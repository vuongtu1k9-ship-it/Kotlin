import { logger } from '../logger.mjs';
import { boardToFen, uciToMoveCoords } from '../fen.mjs';
import { pikafish } from '../routes/engine.mjs';
import { redisClient } from '../services/cache.mjs';
import { getConfig } from '../services/siteConfig.mjs';
import { getBotsCol, toQueryId } from '../mongo.mjs';
import { generateBotTaunt } from '../services/botTauntService.mjs';

export function registerEngineHandlers(io, socket) {
  socket.on('engine:bestmove', async (params, ack) => {
    try {
      const { board, side, movetimeMs = 2000, history = [], initialFen, botId } = params || {};
      const histLen = Array.isArray(history) ? history.length : 0;
      
      const start = Date.now();
      logger.info(`[ENGINE] pikafish request: side=${side}, botId=${botId || 'none'}, movetime=${movetimeMs}ms, history=${histLen}, fen=${(initialFen || '').substring(0, 30)}...`);
      
      // Log history only at debug level to avoid spam
      if (histLen > 0) {
        const sample = history.length > 5 
          ? `${history.slice(0, 3).join(', ')} ... ${history.slice(-1)}`
          : history.join(', ');
        logger.debug(`[ENGINE] History sample: ${sample}`);
      }

      if (!board || (side !== 'red' && side !== 'black')) {
        if (typeof ack === 'function') ack({ ok: false, error: 'BAD_REQUEST' });
        return;
      }

      let fen, finalHistory;
      if (initialFen) {
        fen = initialFen;
        finalHistory = history;
      } else {
        fen = boardToFen(board, side);
        finalHistory = []; // Board already reflects the state, don't double-apply moves
      }

      const cacheKey = `engine:bestmove:pikafish:${fen}:${movetimeMs}:${finalHistory?.join(',') || ''}`;
      const cacheEnabled = await getConfig('ai.pikafishCacheEnabled');

      if (cacheEnabled && redisClient?.isReady) {
        try {
          const cached = await redisClient.get(cacheKey);
          if (cached) {
            logger.info(`[ENGINE] Cache HIT for key: ${cacheKey.substring(0, 40)}...`);
            if (typeof ack === 'function') ack(JSON.parse(cached));
            return;
          }
        } catch (e) { logger.debug(`[REDIS] GET ${cacheKey} failed: ${e.message}`, e); }
      }

      let engineOptions = {};
      let finalMovetimeMs = movetimeMs;
      let bot = null;

      // Handle Dynamic Bot Logic
      if (botId) {
        try {
          const botsCol = await getBotsCol();
          bot = await botsCol.findOne({ _id: toQueryId(botId) });
          if (bot) {
             /**
              * 🎭 PERSONALITY ENGINE
              *
              * Pikafish supported options: MultiPV, Move Overhead (and Threads/Hash at pool level).
              * Contempt / Skill Level / Slow Mover do NOT exist in this Pikafish build.
              *
              * Personality is simulated via 4 real levers:
              *   1. movetimeMs        — how deeply the engine calculates (= effective "strength")
              *   2. MultiPV           — how many candidate moves are generated
              *   3. VarietyThreshold  — (wrapper) max centipawn gap to randomize within
              *   4. Move Overhead     — affects time pressure feel
              *
              * Think-time formula: each personality has a BASE multiplier on level-scaled time,
              * PLUS a contextual variance that makes each move feel different:
              *   - position jitter    — humans don't always spend the same time each move
              *   - phase modifier     — late/early game adjustments per personality
              */

             // Level-scaled base think time: Level 1 = 350ms  →  Level 6 = 4500ms
             const levelTimeMap = [350, 350, 700, 1200, 2000, 3000, 4500];
             const baseTime = levelTimeMap[Math.min(bot.level, 6)] ?? finalMovetimeMs;

             // Move count from history → game phase
             const moveCount = histLen;
             const isOpening  = moveCount < 16;
             const isEndgame  = moveCount > 60;

             let multiPv = 1;
             let varietyScoreThreshold = 0;
             let moveOverhead = 10;

             if (bot.personality === 'aggressive') {
               /**
                * ⚔️ AGGRESSIVE — "Hung Hăng / Hiếu Chiến"
                *
                * Fast, high-pressure play. Thinks least in the opening (plays book-like instinct),
                * slightly longer in the midgame to find tactical shots, but never patient.
                * Wide candidate pool so it sometimes plays a surprise strong move instead of best.
                *
                * Feel: moves quickly in opening, bursts of speed in midgame, sloppy in endgame.
                */
               let mult = 0.45;
               if (!isOpening) mult = 0.55;   // slightly more time midgame to find tactics
               if (isEndgame)  mult = 0.35;   // impatient in endgame — takes risks

               // Small jitter simulating human "instinct" moves vs deliberate moves
               const jitter = 0.85 + Math.random() * 0.3; // 0.85x – 1.15x
               finalMovetimeMs = Math.max(350, Math.round(baseTime * mult * jitter));

               multiPv = 3;
               varietyScoreThreshold = 18; // pick aggressively from top 3 (18cp window)
               moveOverhead = 5;

             } else if (bot.personality === 'defensive') {
               /**
                * 🛡️ DEFENSIVE — "Cẩn Trọng / Thủ Chắc"
                *
                * Thinks longest. Spends MOST time in the opening establishing a solid structure,
                * still careful in midgame, somewhat faster in endgame (knows safe plans exist).
                * Always picks the #1 safest move — no randomization.
                *
                * Feel: long pauses, especially early. Very reliable, hard to trick.
                */
               let mult = 2.2;
               if (!isOpening) mult = 1.8;  // still cautious in midgame
               if (isEndgame)  mult = 1.3;  // slightly faster when position simplifies

               const jitter = 0.88 + Math.random() * 0.24; // 0.88x – 1.12x (small variance)
               finalMovetimeMs = Math.min(7000, Math.round(baseTime * mult * jitter));

               multiPv = 1;              // never randomizes, always safest
               varietyScoreThreshold = 0;
               moveOverhead = 60;        // conservative: makes engine feel the clock pressure

             } else if (bot.personality === 'balanced') {
               /**
                * ⚖️ BALANCED — "Cân Bằng / Linh Hoạt"
                *
                * Adapts to the position. Opens at moderate speed, slows down in complex
                * midgame positions, speeds back up in clear endgames.
                * Has slight randomization to avoid being predictable.
                *
                * Feel: most "human-like" of all personalities. Thoughtful but not exhausting.
                */
               let mult = 1.0;
               if (!isOpening && !isEndgame) mult = 1.2; // extra time in complex midgame
               if (isEndgame) mult = 0.8;                // confident in clear endgames

               const jitter = 0.75 + Math.random() * 0.5; // 0.75x – 1.25x (higher variance)
               finalMovetimeMs = Math.max(400, Math.round(baseTime * mult * jitter));

               multiPv = 2;
               varietyScoreThreshold = 8;  // small variety, mostly plays best
               moveOverhead = 15;

             } else {
               // Fallback: treat unknown personality as balanced
               finalMovetimeMs = Math.round(baseTime * (0.9 + Math.random() * 0.2));
               multiPv = 1;
             }

             // Only send VALID Pikafish UCI options (wrapper-only keys filtered later)
             engineOptions = {
               'MultiPV': multiPv,
               'Move Overhead': moveOverhead,
               'VarietyScoreThreshold': varietyScoreThreshold, // filtered by uciRunner WRAPPER_KEYS
             };

             logger.info(`[ENGINE] 🎭 ${bot.name} (Lvl ${bot.level} · ${bot.personality}) | movetime=${finalMovetimeMs}ms | MultiPV=${multiPv} | threshold=${varietyScoreThreshold}cp | phase=${isOpening?'open':isEndgame?'end':'mid'}`);
          }
        } catch (botErr) {
          logger.error(`[ENGINE] Failed to lookup bot ${botId}: ${botErr.message}`);
        }
      }

      const result = await pikafish.run(fen, finalMovetimeMs, finalHistory, engineOptions);
      
      // Support both old string return and new { move, score } object
      const best = typeof result === 'string' ? result : result?.move;
      const engineScore = typeof result === 'object' ? result?.score : null;

      const coords = uciToMoveCoords(best, 'pikafish');

      if (!coords) {
        if (typeof ack === 'function') ack({ ok: false, error: 'BAD_ENGINE_MOVE', best, fen });
        return;
      }

      const response = { ok: true, bestmove: best, ...coords, fen };
      const elapsed = Date.now() - start;
      logger.info(`[ENGINE] pikafish result: ${best} score=${engineScore} (took ${elapsed}ms)`);

      if (cacheEnabled && redisClient?.isReady) {
        try {
          await redisClient.setEx(cacheKey, 86400, JSON.stringify(response));
        } catch (e) { logger.debug(`[REDIS] SET ${cacheKey} failed: ${e.message}`, e); }
      }

      if (typeof ack === 'function') ack(response);

      // 🗣️ Fire-and-forget: Generate bot personality commentary via LLM
      if (bot) {
        generateBotTaunt({
          bot,
          score: engineScore,
          moveCount: histLen,
        }).then(taunt => {
          if (taunt) {
            socket.emit('bot:taunt', {
              botId,
              name: bot.name,
              personality: bot.personality,
              taunt,
            });
          }
        }).catch(() => { /* never block the game */ });
      }

    } catch (e) {
      logger.error('[ENGINE] engine:bestmove critical failure:', e.message);
      if (typeof ack === 'function') ack({ ok: false, error: String(e?.message || e) });
    }
  });
}
