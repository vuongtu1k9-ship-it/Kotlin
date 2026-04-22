import { spawn } from 'child_process';
import EventEmitter from 'events';

export class UciEngine extends EventEmitter {
  constructor(binPath) {
    super();
    this.binPath = binPath;
    this.proc = null;
    this.ready = false;
    this.queue = [];
    this.busy = false;
  }

  start() {
    this.proc = spawn(this.binPath, [], { stdio: ['pipe', 'pipe', 'pipe'] });
    this.proc.stdout.on('data', (d) => {
      const lines = d.toString().split('\n');
      for (const line of lines) {
        this.onLine(line.trim());
      }
    });

    this.write('uci');
  }

  write(line) {
    if (this.proc) {
      this.proc.stdin.write(line + '\n');
    }
  }

  onLine(line) {
    if (!line) return;
    if (line === 'uciok') {
      this.write('isready');
    } else if (line === 'readyok') {
      this.ready = true;
      this.emit('ready');
      this.flush();
    } else if (line.startsWith('bestmove')) {
      const move = line.split(' ')[1];
      if (this.currentResolver) {
        this.currentResolver(move);
        this.currentResolver = null;
        this.busy = false;
        this.flush();
      }
    }
  }

  async getBestMove(fen, movetime = 1000) {
    return new Promise((resolve) => {
      this.queue.push({ fen, movetime, resolve });
      this.flush();
    });
  }

  flush() {
    if (!this.ready || this.busy || this.queue.length === 0) return;
    this.busy = true;
    const { fen, movetime, resolve } = this.queue.shift();
    this.currentResolver = resolve;
    this.write(`position fen ${fen}`);
    this.write(`go movetime ${movetime}`);
  }

  // Interrupt current analysis
  stopAnalysis() {
    if (this.busy) {
      this.write('stop');
      // The 'bestmove' response will trigger resolver and flush
    }
  }

  // Clear everything
  abortAll() {
    this.queue = [];
    if (this.currentResolver) {
      this.currentResolver(null);
      this.currentResolver = null;
    }
    this.busy = false;
    this.write('stop');
  }

  stop() {
    if (this.proc) {
      this.proc.kill();
      this.proc = null;
    }
  }
}

// Reuse FEN logic
const mapTypeToFen = {
  chariot: 'r', horse: 'n', elephant: 'b', advisor: 'a',
  general: 'k', cannon: 'c', soldier: 'p',
};

export function boardToFen(board, sideToMove) {
  const ranks = [];
  for (let r = 0; r < 10; r++) {
    let empty = 0;
    let s = '';
    for (let c = 0; c < 9; c++) {
      const p = board?.[r]?.[c] ?? null;
      if (!p) {
        empty++;
        continue;
      }
      if (empty) {
        s += String(empty);
        empty = 0;
      }
      const ch = mapTypeToFen[p.type];
      s += p.side === 'red' ? ch.toUpperCase() : ch;
    }
    if (empty) s += String(empty);
    ranks.push(s || '9');
  }
  const stm = sideToMove === 'red' ? 'w' : 'b';
  return `${ranks.join('/')} ${stm} - - 0 1`;
}

export function uciToMoveCoords(uci) {
  const match = uci.match(/^([a-i])(\d+)([a-i])(\d+)$/);
  if (!match) return null;
  const [, f1, r1, f2, r2] = match;
  return {
    from: { row: 9 - parseInt(r1), col: f1.charCodeAt(0) - 'a'.charCodeAt(0) },
    to: { row: 9 - parseInt(r2), col: f2.charCodeAt(0) - 'a'.charCodeAt(0) },
  };
}
