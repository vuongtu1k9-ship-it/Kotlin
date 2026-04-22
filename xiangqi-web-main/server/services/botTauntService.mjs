/**
 * botTauntService.mjs
 *
 * Generates in-character, personality + phase-aware commentary for AI bots
 * using Pikafish evaluation score + Gemini LLM.
 *
 * Called fire-and-forget from engineHandlers after each bot move.
 * Cached in Redis by (personality × score bucket × phase) to minimize LLM calls.
 */

import { logger } from '../logger.mjs';
import { AiGeneratorService } from './aiGenerator.mjs';
import { redisClient } from './cache.mjs';

const aiGen = AiGeneratorService.getInstance();
const CACHE_TTL = 720; // 12 minutes

function getPhase(moveCount) {
  if (moveCount < 16) return 'opening';
  if (moveCount < 50) return 'midgame';
  return 'endgame';
}

function getSituation(score) {
  if (score === null || score === undefined) return 'cân bằng';
  if (score > 500) return 'đang thắng lớn';
  if (score > 200) return 'đang nhỉnh hơn';
  if (score < -500) return 'đang thua nặng';
  if (score < -200) return 'đang yếu thế';
  return 'thế cờ ngang nhau';
}

function buildPrompt(bot, phase, situation) {
  const name = bot.name || 'Bot';
  const p = bot.personality || 'balanced';

  const phaseContext = {
    opening:  'Giai đoạn khai cuộc — quân đang triển khai, chưa có giao chiến lớn.',
    midgame:  'Giai đoạn trung cuộc — đang giao chiến, các kế hoạch đang triển khai.',
    endgame:  'Giai đoạn tàn cuộc — ít quân, mỗi nước đi quyết định.',
  };

  const voices = {
    aggressive: `Bạn là ${name}, một võ sĩ cờ tướng hung hăng, nóng nảy, thích áp đảo tâm lý. Phong cách:
- Khai cuộc: phát ngôn dọa dẫm ("Chuẩn bị đón chiêu ta!", "Khai màn đi!")
- Trung cuộc: khiêu khích ("Ngươi không thoát khỏi vòng vây", "Chiếu tướng rồi đó!")
- Tàn cuộc: kiêu ngạo nếu thắng, cáu kỉnh nếu thua ("Ta biết kết cuộc rồi", "Không thể tin được!")`,

    defensive: `Bạn là ${name}, một lão kỳ thủ cẩn trọng, uyên thâm như sách cổ. Phong cách:
- Khai cuộc: trích tục ngữ/binh pháp ("Bất động như núi", "Hãy đặt nền móng trước")
- Trung cuộc: triết lý thế trận ("Người kiên nhẫn sẽ thắng", "Thế cờ đang rõ dần")
- Tàn cuộc: điềm tĩnh tự tin ("Ta đã dự liệu điều này", "Đường về còn dài")`,

    balanced: `Bạn là ${name}, một kỳ thủ chuyên nghiệp linh hoạt, thích nghi mọi hoàn cảnh. Phong cách:
- Khai cuộc: nhận xét trung tính ("Khai cuộc thú vị", "Xem thế trận phát triển nào")
- Trung cuộc: phân tích ("Thế này phức tạp hơn tôi nghĩ", "Nhiều khả năng chưa lộ")
- Tàn cuộc: tự tin hoặc cẩn thận ("Tàn cuộc này thuộc về ta", "Cần cẩn thận từng bước")`,
  };

  const voice = voices[p] || voices.balanced;

  return `${voice}

Bối cảnh: ${phaseContext[phase] || phaseContext.midgame}
Tình trạng: ${situation}

Nói đúng 1 câu ngắn (tối đa 15 từ) theo giọng của bạn, phù hợp bối cảnh và tình trạng trên.
Chỉ trả về câu nói. Không giải thích, không JSON, không ngoặc kép.`;
}

export async function generateBotTaunt({ bot, score, moveCount }) {
  if (!bot) return null;

  const phase = getPhase(moveCount || 0);
  const situation = getSituation(score);
  const scoreBucket = score === null ? 'null' : Math.round((score || 0) / 100) * 100;
  const cacheKey = `bot:taunt:v2:${bot.personality}:${scoreBucket}:${phase}`;

  if (redisClient?.isReady) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug(`[TAUNT] Cache hit: ${cacheKey}`);
        return cached;
      }
    } catch (e) { /* ignore */ }
  }

  const prompt = buildPrompt(bot, phase, situation);

  try {
    const raw = await aiGen.generateSimpleCompletion(prompt);
    const taunt = raw?.trim()
      .replace(/^["""''`]/g, '')
      .replace(/["""''`]$/g, '')
      .substring(0, 100) || null;

    if (taunt && redisClient?.isReady) {
      const jitter = Math.floor(Math.random() * 180);
      await redisClient.setEx(cacheKey, CACHE_TTL + jitter, taunt).catch(() => {});
    }

    logger.info(`[TAUNT] ${bot.name} (${bot.personality}·${phase}·${scoreBucket}cp): "${taunt}"`);
    return taunt;
  } catch (err) {
    logger.warn(`[TAUNT] Failed for ${bot.name}: ${err.message}`);
    return null;
  }
}
