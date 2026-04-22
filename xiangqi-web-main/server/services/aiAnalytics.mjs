import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAnalyticsSummary, getSearchConsoleSummary, getSearchConsoleDetailed } from './googleReporting.mjs';
import { AiResourceManager } from './aiResourceManager.mjs';
import { logger } from '../logger.mjs';

/**
 * AI Analytics Service
 * Analyzes traffic and search data to provide management insights
 */
export async function generateAdminInsights(days = 30) {
  try {
    logger.info(`[AI_ANALYTICS] Generating insights for last ${days} days...`);

    // 1. Fetch data
    const [ga4, gsc, keywords, pages] = await Promise.all([
      getAnalyticsSummary(days),
      getSearchConsoleSummary(days).catch(() => ({ rows: [] })),
      getSearchConsoleDetailed(days, 'query', 20).catch(() => []),
      getSearchConsoleDetailed(days, 'page', 20).catch(() => [])
    ]);

    // 2. Prepare condensed data for prompt
    const context = {
      period: `${days} days`,
      ga4_summary: {
        total_rows: ga4?.rows?.length || 0,
        // Calculate totals or trends if needed
      },
      gsc_summary: {
        total_clicks: gsc?.rows?.reduce((acc, r) => acc + r.clicks, 0) || 0,
        total_impressions: gsc?.rows?.reduce((acc, r) => acc + r.impressions, 0) || 0,
      },
      top_keywords: (keywords || []).slice(0, 10).map(k => ({
        term: k.keys?.[0] || 'unknown',
        clicks: k.clicks || 0,
        pos: k.position?.toFixed(1) || '0.0'
      })),
      top_pages: (pages || []).slice(0, 10).map(p => ({
        url: (p.keys?.[0] || '').replace('https://cotuong.xyz', ''),
        clicks: p.clicks || 0
      }))
    };

    // 3. Prompt
    const prompt = `Bạn là một CHUYÊN GIA PHÂN TÍCH SEO & MARKETING cho website cờ tướng "cotuong.xyz".
Dựa trên dữ liệu Google Analytics và Search Console của ${days} ngày qua:
${JSON.stringify(context, null, 2)}

Hãy đưa ra một bản phân tích QUẢN TRỊ ngắn gọn (tiếng Việt), tập trung vào:
1. **Hiệu suất tổng quan**: Website đang phát triển thế nào?
2. **Cơ hội từ khóa**: Những từ khóa nào tiềm năng nhưng vị trí còn thấp?
3. **Nội dung thu hút**: Trang nào đang kéo traffic chính?
4. **Đề xuất hành động**: Admin nên làm gì tiếp theo (ví dụ: viết bài mới về từ khóa X, tối ưu trang Y)?

YÊU CẦU ĐẦU RA (JSON format):
{
  "summary": "Mô tả ngắn gọn xu hướng traffic",
  "insights": [
    {"title": "Tiêu đề insight", "description": "Mô tả và giải pháp", "type": "opportunity|warning|info"}
  ],
  "recommendations": ["Hành động 1", "Hành động 2"]
}`;

    const { generateContent } = await import('./aiService.mjs');
    const text = await generateContent(prompt);
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
    
    return JSON.parse(jsonStr);
  } catch (err) {
    logger.error(`[AI_ANALYTICS] Generation failed: ${err.message}`);
    return {
      summary: "Không thể tự động phân tích dữ liệu lúc này.",
      insights: [],
      recommendations: ["Kiểm tra lại cấu hình API Key", "Thử lại sau ít phút"]
    };
  }
}
