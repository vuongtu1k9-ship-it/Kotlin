import { spawn } from 'child_process';
import { logger } from './logger.mjs';

/**
 * Generic UCI engine runner.
 * - Manages a single persistent process
 * - Handles UCI-compliant engines (Pikafish, Stockfish, etc.)
 * - Sequential request queue
 */
export function createUciRunner(name, opts = {}) {
  const binPath = opts.binPath || '';
  const movetimeMsDefault = Number(opts.movetimeMsDefault || 1000);
  const threads = Number(opts.threads || 1);
  const hashMb = Number(opts.hashMb || 64);
  const nnuePath = opts.nnuePath || '';
  const variant = opts.variant || '';

  let proc = null;
  let ready = false;
  let busy = false;
  let queue = [];
  let fatalError = null;
  let current = null;
  // Deduplication map: key=`fen:movetimeMs:history` -> list of pending callbacks
  const pendingKeys = new Map();

  const uciOptions = opts.uciOptions || {};
  const multiPv = Number(uciOptions.MultiPV || 1);
  const scoreThreshold = 50; // Millipawns (0.05 units) - only pick if close to best

  // Helper to parse piece at algebraic coordinate in XQ FEN: ranks stm ...
  const getPieceAt = (ranks, alg) => {
    try {
      const col = alg.charCodeAt(0) - 'a'.charCodeAt(0);
      const row = 9 - parseInt(alg[1]);
      const rows = ranks.split('/');
      const rStr = rows[row];
      if (!rStr) return null;
      let currCol = 0;
      for (let i = 0; i < rStr.length; i++) {
        const char = rStr[i];
        if (/\d/.test(char)) { currCol += parseInt(char); } 
        else {
          if (currCol === col) return char;
          currCol++;
        }
      }
    } catch (e) { /* ignore */ }
    return null;
  };

  const getPieceSide = (fenOrRanks, alg) => {
    try {
      const ranks = fenOrRanks.includes(' ') ? fenOrRanks.split(' ')[0] : fenOrRanks;
      const char = getPieceAt(ranks, alg);
      if (!char) return null;
      return (char === char.toUpperCase()) ? 'w' : 'b';
    } catch (e) { /* ignore */ }
    return null;
  };

  // Ultra-light simulation to check if a sequence of moves is valid for stm alternating rules
  const validateHistory = (initialFen, history) => {
    try {
      const [ranks, stm] = initialFen.split(' ');
      let currentRanks = ranks;
      let currentPlayer = stm;
      const validMoves = [];

      for (const m of history) {
        if (typeof m !== 'string' || !/^[a-i][0-9][a-i][0-9]$/.test(m)) break;
        
        const side = getPieceSide(currentRanks, m.slice(0, 2));
        // Must have piece at source, and must be currentPlayer's piece
        if (!side || side !== currentPlayer) {
          logger.warn(`[${name}] Validation FAILED for move ${m}: pieceSide=${side}, stm=${currentPlayer}. Truncating.`);
          break; 
        }

        // Basic "simulate": find piece, remove from source, place at target.
        // Actually for STERN Pikafish protection, just checking stm consistency is 80% of safety.
        // To be 100% safe we'd need a full move applier. Let's do a basic one.
        const piece = getPieceAt(currentRanks, m.slice(0, 2));
        if (!piece) {
          logger.warn(`[${name}] Validation FAILED: No piece at source ${m.slice(0, 2)}. Truncating.`);
          break;
        }

        const board = currentRanks.split('/').map(row => {
          const properCells = [];
          for (let i = 0; i < row.length; i++) {
             const char = row[i];
             if (/\d/.test(char)) {
               for (let j = 0; j < parseInt(char); j++) properCells.push(null);
             } else {
               properCells.push(char);
             }
          }
          return properCells;
        });


        const srcCol = m.charCodeAt(0) - 'a'.charCodeAt(0);
        const srcRow = 9 - parseInt(m[1]);
        const dstCol = m.charCodeAt(2) - 'a'.charCodeAt(0);
        const dstRow = 9 - parseInt(m[3]);

        if (board[srcRow][srcCol] !== piece) {
           logger.warn(`[${name}] Validation FAILED: Piece mismatch at ${m.slice(0, 2)}. Truncating.`);
           break;
        }

        // --- NEW: Friendly Capture Check ---
        const targetPiece = board[dstRow][dstCol];
        if (targetPiece) {
            const targetSide = (targetPiece === targetPiece.toUpperCase()) ? 'w' : 'b';
            if (targetSide === currentPlayer) {
                logger.warn(`[${name}] Validation FAILED: Friendly capture at ${m.slice(2, 4)} (${piece} to ${targetPiece}). Truncating.`);
                break;
            }
        }

        board[srcRow][srcCol] = null;
        board[dstRow][dstCol] = piece;

        // Convert back to FEN ranks
        currentRanks = board.map(row => {
          let r = '';
          let empty = 0;
          for (const c of row) {
            if (c === null) { empty++; }
            else {
              if (empty > 0) { r += empty; empty = 0; }
              r += c;
            }
          }
          if (empty > 0) r += empty;
          return r;
        }).join('/');

        validMoves.push(m);
        currentPlayer = (currentPlayer === 'w' ? 'b' : 'w');
      }
      return validMoves;

    } catch (e) {
      logger.error(`[${name}] validateHistory error:`, e);
      return [];
    }
  };

  const ensureProc = () => {
    if (fatalError || proc) return;

    proc = spawn(binPath, [], { stdio: ['pipe', 'pipe', 'pipe'] });
    
    proc.stdin.on('error', (err) => {
      // Catch EPIPE/broken pipe errors and just log them.
      // The proc.on('exit') will handle the cleanup.
      logger.error(`[${name}] STDIN_ERROR:`, err.message || err);
    });
    
    proc.on('error', (err) => {
      logger.error(`[${name}] process error:`, err);
      fatalError = err;
      try { proc?.kill('SIGKILL'); } catch (e) { logger.debug(`[${name}] kill failed`, e); }
      proc = null;
      ready = false;
      busy = false;
      if (current?.finish) current.finish(err);
      queue.forEach(it => it.finish?.(err));
      queue = [];
    });

    proc.on('exit', (code, signal) => {
      logger.info(`[${name}] process exited with code ${code} and signal ${signal}`);
      if (busy && current?.lastCommand) {
        logger.error(`[${name}] Crash occurred while executing: ${current.lastCommand}`);
      }
      const err = new Error(`ENGINE_PROCESS_EXITED: code=${code}, signal=${signal}`);
      if (busy && current?.finish) {
        current.finish(err);
      }
      proc = null;
      ready = false;
      busy = false;
    });

    proc.stdout.setEncoding('utf8');
    proc.stderr.setEncoding('utf8');

    proc.stderr.on('data', (d) => {
      logger.error(`[${name}] ENGINE_STDERR: ${d || ''}`.trim());
    });

    const write = (line) => {
      if (!proc?.stdin?.writable) {
        logger.debug(`[${name}] Write skipped (stdin not writable): ${line}`);
        return false;
      }
      try {
        return proc.stdin.write(line + '\n');
      } catch (e) {
        logger.error(`[${name}] Write error:`, e.data || e.message || e);
        return false;
      }
    };

    const onLine = (line) => {
      line = String(line || '').trim();
      if (!line) return;

      if (!ready && line === 'uciok') {
        if (variant) write(`setoption name UCI_Variant value ${variant}`);
        if (nnuePath) write(`setoption name EvalFile value ${nnuePath}`);
        write(`setoption name Threads value ${threads}`);
        write(`setoption name Hash value ${hashMb}`);

        // Custom options
        for (const [k, v] of Object.entries(uciOptions)) {
          write(`setoption name ${k} value ${v}`);
        }

        write('isready');
        return;
      }

      if (!ready && line === 'readyok') {
        ready = true;
        flush();
        return;
      }

      if (busy && current?.onOutput) current.onOutput(line);
    };

    let buf = '';
    proc.stdout.on('data', (d) => {
      buf += d;
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        onLine(line);
      }
    });

    write('uci');
  };

  const flush = () => {
    if (!ready || busy) return;
    const item = queue.shift();
    if (!item) return;
    busy = true;
    current = item;
    logger.debug(`[${name}] Executing request (Queue: ${queue.length})`);
    item.run();
  };

  const run = (fen, movetimeMs, history = [], engineOptions = {}) =>
    new Promise((resolve, reject) => {
      ensureProc();
      if (fatalError) return reject(new Error(`ENGINE_UNAVAILABLE: ${name}`));
      if (!proc) return reject(new Error(`ENGINE_NOT_RUNNING: ${name}`));

      // --- Deduplication: if identical request is already queued/running, share the result ---
      const mt = Number(movetimeMs || movetimeMsDefault);
      const dedupKey = `${fen}:${mt}:${(history || []).join(',')}`;
      if (pendingKeys.has(dedupKey)) {
        logger.debug(`[${name}] Dedup hit — reusing pending result for key=${dedupKey.slice(0, 60)}...`);
        pendingKeys.get(dedupKey).push({ resolve, reject });
        return;
      }
      // Register this key with first subscriber
      pendingKeys.set(dedupKey, [{ resolve, reject }]);

      const notifyAll = (err, bestmove) => {
        const subscribers = pendingKeys.get(dedupKey) || [];
        pendingKeys.delete(dedupKey);
        for (const { resolve: res, reject: rej } of subscribers) {
          if (err) rej(err);
          else res(bestmove);
        }
      };

      const write = (line) => {
        if (!proc?.stdin?.writable) {
          logger.debug(`[${name}] Write skipped (stdin not writable): ${line}`);
          return false;
        }
        try {
          return proc.stdin.write(line + '\n');
        } catch (e) {
          logger.error(`[${name}] Write error:`, e.data || e.message || e);
          return false;
        }
      };
      let done = false;
      let timer = null;
      const candidates = new Map(); // multipv index -> { move, score }

      const finish = (err, engineBestmove) => {
        if (done) return;
        done = true;
        if (timer) clearTimeout(timer);
        busy = false;
        current = null;
        flush();

        const runDuration = item.runStartTime ? Date.now() - item.runStartTime : 0;
        const totalDuration = Date.now() - (item.startTime || Date.now());
        
        let finalMove = engineBestmove;
        let finalScore = null;

        const activeMultiPv = Number(item.engineOptions?.MultiPV || item.engineOptions?.multiPV || multiPv);
        const activeScoreThreshold = Number(item.engineOptions?.VarietyScoreThreshold || scoreThreshold);

        // Variety logic: if we have MultiPV moves close to bestmove, pick one randomly
        if (!err && activeMultiPv > 1 && candidates.size > 0) {
          try {
            const sorted = Array.from(candidates.values()).sort((a, b) => b.score - a.score);
            if (sorted.length > 0) {
              finalScore = sorted[0].score; // Always capture top score for LLM commentary
              const bestScore = sorted[0].score;
              const acceptable = sorted.filter(c => (bestScore - c.score) <= activeScoreThreshold);
              
              if (acceptable.length > 1) {
                const picked = acceptable[Math.floor(Math.random() * acceptable.length)];
                if (picked.move !== finalMove) {
                  logger.info(`[${name}] Random pick: ${finalMove} -> ${picked.move} (Among ${acceptable.length} candidates, score diff <= ${activeScoreThreshold}cp)`);
                  finalMove = picked.move;
                }
              }
            }
          } catch (e) {
            logger.error(`[${name}] Random selection failed:`, e);
          }
        } else if (!err && candidates.size > 0) {
          // Capture score even for MultiPV=1
          const top = candidates.get(1);
          if (top) finalScore = top.score;
        }

        if (err) {
          logger.error(`[${name}] Request FAILED in ${runDuration}ms (Total: ${totalDuration}ms):`, err.message || err);
          notifyAll(err, null);
        } else {
          logger.info(`[${name}] Request SUCCESS in ${runDuration}ms (Total: ${totalDuration}ms): bestmove=${finalMove} score=${finalScore}`);
          notifyAll(null, { move: finalMove, score: finalScore });
        }
      };

      const item = {
        finish: (err) => finish(err, null),
        onOutput: (line) => {
          if (line.startsWith('bestmove ')) {
            logger.info(`[${name}] Engine output: ${line}`);
            const mv = line.split(/\s+/)[1] || '';
            logger.info(`[${name}] Extracted move: ${mv}`);
            finish(null, mv);
          } else if (line.startsWith('info ')) {
            // Parse ALL info lines for score/move — MultiPV-tagged and single-search
            try {
              const scoreMatch = line.match(/score\s+cp\s+(-?\d+)/);
              const moveMatch = line.match(/\spv\s+([a-i][0-9][a-i][0-9])/);

              if (line.includes('multipv')) {
                // MultiPV line: info depth 10 multipv 2 score cp 50 ... pv e2e4
                const pvMatch = line.match(/multipv\s+(\d+)/);
                if (pvMatch && scoreMatch && moveMatch) {
                  const idx = parseInt(pvMatch[1]);
                  const score = parseInt(scoreMatch[1]);
                  const move = moveMatch[1];
                  candidates.set(idx, { move, score });
                }
              } else if (scoreMatch && moveMatch) {
                // Single-PV line (MultiPV=1 or not set): track as candidate #1
                candidates.set(1, { move: moveMatch[1], score: parseInt(scoreMatch[1]) });
              }
            } catch (e) { /* ignore parse errors */ }
          }
        },
        startTime: Date.now(),
        run: () => {
          try {
            item.runStartTime = Date.now();
            const safeHistory = (history || [])
              .filter(m => typeof m === 'string' && /^[a-i][0-9][a-i][0-9][a-z]?$/.test(m))
              .slice(-2000);

            const posCmd = (() => {
              // PIKAFISH PROTECTION: Truncate history if it's invalid or contains illegal positions.
              try {
                const [ranks] = fen.split(' ');
                
                // 1. Basic Illegal Piece Position Check (Initial FEN)
                const rows = ranks.split('/');
                for (let r = 0; r < rows.length; r++) {
                  if (r >= 7 && rows[r].includes('P')) {
                    logger.warn(`[${name}] ILLEGAL POSITION: Red pawn (P) at row ${r}. Skipping history.`);
                    return `position fen ${fen}`;
                  }
                  if (r <= 2 && rows[r].toLowerCase().includes('p') && rows[r].split('').some(c => c === 'p')) {
                     if (rows[r].split('').includes('p')) {
                        logger.warn(`[${name}] ILLEGAL POSITION: Black pawn (p) at row ${r}. Skipping history.`);
                        return `position fen ${fen}`;
                     }
                  }
                }

                // 2. Validate move sequence turns and pieces
                const validated = validateHistory(fen, safeHistory);
                if (validated.length < safeHistory.length) {
                  logger.warn(`[${name}] TRUNCATED history: input=${safeHistory.length}, validated=${validated.length}`);
                }
                
                if (validated.length > 0) {
                  return `position fen ${fen} moves ${validated.join(' ')}`;
                }
              } catch (e) { logger.debug(`[${name}] FEN validation error`, e); }
              
              return `position fen ${fen}`;
            })();

            item.lastCommand = posCmd;
            
            const displayHist = safeHistory.length > 5 
              ? `${safeHistory.slice(0, 3).join(' ')} ... ${safeHistory.slice(-2).join(' ')}`
              : safeHistory.join(' ');
            
            logger.info(`[${name}] Executing (moves=${safeHistory.length}): ${posCmd.slice(0, 100)}... [Hist: ${displayHist}]`);

            // === WRAPPER-ONLY keys (never sent to engine) ===
            const WRAPPER_KEYS = new Set(['VarietyScoreThreshold']);

            // Inject per-request engine options BEFORE position (strict UCI compliance)
            if (engineOptions && typeof engineOptions === 'object') {
              for (const [key, value] of Object.entries(engineOptions)) {
                if (WRAPPER_KEYS.has(key)) continue; // skip internal keys
                write(`setoption name ${key} value ${value}`);
                logger.debug(`[${name}] setoption ${key} = ${value}`);
              }
            }

            write(posCmd);
            write(`go movetime ${mt}`);

            timer = setTimeout(() => {
              try { write('stop'); } catch (e) { logger.debug(`[${name}] stop write failed`, e); }
              finish(new Error('ENGINE_TIMEOUT'), null);
            }, mt + 15000); 
          } catch (e) {
            finish(e, null);
          }
        },
      };

      queue.push(item);
      flush();
    });

  return { run, status: () => ({ name, binPath, ready, busy, queued: queue.length }) };
}
