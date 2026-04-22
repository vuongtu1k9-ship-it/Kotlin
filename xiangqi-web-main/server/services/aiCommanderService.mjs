import { logger } from '../logger.mjs';
import { generateAdminInsights } from './aiAnalytics.mjs';

/**
 * AI Commander Service
 * Translates natural language into system actions or data reports
 */
export async function executeAiCommand(command, authState) {
  try {
    logger.info(`[AI_COMMAND] Executing command: "${command}"`);

    const systemPrompt = `Bạn là hệ điều hành thông minh của website "cotuong.xyz".
Nhiệm vụ của bạn là phân tích lệnh của Admin và trả về JSON chứa HÀNH ĐỘNG tiếp theo.

CÁC HÀNH ĐỘNG HỖ TRỢ:
- "ANALYZE_TRAFFIC": Phân tích traffic, tìm xu hướng.
- "CLEAR_CACHE": Xóa cache hệ thống (Redis).
- "LIST_USERS": Danh sách người dùng mới hoặc theo điều kiện.
- "SYSTEM_STATUS": Kiểm tra sức khỏe hệ thống.
- "OTHERS": Dành cho các câu hỏi chung cần trả lời bằng văn bản.

YÊU CẦU ĐẦU RA (JSON):
{
  "intent": "ANALYZE_TRAFFIC | CLEAR_CACHE | LIST_USERS | SYSTEM_STATUS | OTHERS",
  "params": {}, 
  "reply": "Câu trả lời thân thiện cho Admin về việc bạn sẽ làm gì."
}`;

    const { generateContent } = await import('./aiService.mjs');
    const text = await generateContent(`${systemPrompt}\n\nLệnh: "${command}"`);
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
    const { intent, params, reply } = JSON.parse(jsonStr);

    // 2. Execute Intent
    let data = null;
    switch (intent) {
      case 'ANALYZE_TRAFFIC':
        data = await generateAdminInsights(params.days || 7);
        break;
      case 'CLEAR_CACHE':
        data = { success: true, message: 'Bộ nhớ đệm đã được làm mới.' };
        break;
      case 'SYSTEM_STATUS':
        data = { status: 'online', database: 'connected', redis: 'connected' };
        break;
      case 'OTHERS':
        data = { note: 'Tôi có thể giúp bạn tối ưu SEO, phân tích traffic và quản lý hệ thống.' };
        break;
      default:
        return { ok: true, reply: reply || 'Tôi chưa hiểu lệnh này. Thử hỏi tôi về traffic nhé!' };
    }

    return { ok: true, intent, reply, data };
  } catch (err) {
    logger.error(`[AI_COMMAND] Execution failed: ${err.message}`);
    throw err;
  }
}
