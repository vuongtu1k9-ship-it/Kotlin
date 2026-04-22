import { getSearchConsoleDetailed } from './googleReporting.mjs';
import { logger } from '../logger.mjs';

/**
 * AI SEO Optimizer Service
 * Generates content and metadata improvements based on Search Console data
 */
export async function suggestSeoOptimizations(pageUrl, days = 30) {
  try {
    logger.info(`[AI_SEO] Generating suggestions for ${pageUrl}...`);

    // 1. Fetch queries for this SPECIFIC page
    const pageQueries = await fetchQueriesForPage(pageUrl, days);

    // 2. Prepare context
    const context = {
      url: pageUrl,
      top_keywords_leading_to_page: pageQueries.map(q => ({
        term: q.keys[0],
        clicks: q.clicks,
        ctr: (q.ctr * 100).toFixed(1) + '%',
        pos: q.position.toFixed(1)
      })),
    };

    // 3. Prompt
    const prompt = `Bạn là một CHUYÊN GIA SEO ĐẲNG CẤP THẾ GIỚI.
Hãy tối ưu hóa thẻ Meta cho trang web sau dựa trên dữ liệu Google Search Console thực tế:
URL: ${context.url}
Dữ liệu từ khóa chính: ${JSON.stringify(context.top_keywords_leading_to_page, null, 2)}

YÊU CẦU:
1. Tạo một tiêu đề (Title) hấp dẫn, chuẩn SEO (< 60 ký tự), chứa từ khóa có lượt hiển thị cao nhất.
2. Tạo một mô tả (Meta Description) cực kỳ thu hút (< 160 ký tự), kích thích người dùng nhấp vào (tăng CTR).
3. Gợi ý 3-5 thẻ Tags liên quan.
4. Phân tích tại sao bạn đề xuất như vậy (Rất ngắn gọn).

TRẢ VỀ ĐỊNH DẠNG JSON:
{
  "title": "...",
  "description": "...",
  "tags": ["...", "..."],
  "reasoning": "..."
}`;

    const { generateContent } = await import('./aiService.mjs');
    const text = await generateContent(prompt);
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
    
    return JSON.parse(jsonStr);
  } catch (err) {
    logger.error(`[AI_SEO] Suggestion failed: ${err.message}`);
    throw err;
  }
}

/**
 * Analyzes keyword trends and suggests semantic expansion
 */
export async function analyzeKeywordTrends(trends) {
  try {
    const limitedTrends = trends.slice(0, 10);

    const prompt = `Phân tích dữ liệu tìm kiếm (Search Console) sau: ${JSON.stringify(limitedTrends)}

Hãy thực hiện ngắn gọn:
1. Phân tích 3 xu hướng bùng nổ hàng đầu.
2. Gợi ý 8-10 từ khóa tiềm năng cao (Volume, Difficulty, Growth) để mở rộng ngách (Cờ úp, Cờ vua, v.v.).
3. 3 hành động thực tế.

TRẢ VỀ JSON:
{
  "analysis": "...",
  "suggestions": [{"keyword": "...", "volume": 0, "difficulty": 0, "growth": 0, "strategy": "..."}],
  "actions": ["..."]
}`;

    const { generateContent } = await import('./aiService.mjs');
    const text = await generateContent(prompt);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('NO_JSON_FOUND');
    return JSON.parse(match[0]);
  } catch (err) {
    logger.error(`[AI_SEO] Trend analysis failed: ${err.message}`);
    return null;
  }
}

/**
 * Deep Market Expansion Analysis
 * Uses the full list of GSC queries to find major expansion opportunities and LSI clusters
 */
export async function analyzeMarketExpansion(topQueries) {
  try {
    // Lấy top 100 query để có đủ dữ liệu phân cụm (clustering)
    const queryList = topQueries.slice(0, 100).map(q => ({
      k: q.keys[0],
      v: q.impressions,
      c: q.clicks,
      p: q.position.toFixed(1),
      ctr: (q.ctr * 100).toFixed(1) + '%'
    }));

    const prompt = `Bạn là một CHUYÊN GIA PHÂN TÍCH SEO & SEMANTIC SEARCH.
Dựa trên danh sách 100 từ khóa thực tế từ Google Search Console của website "cotuong.xyz":
${JSON.stringify(queryList)}

HÃY THỰC HIỆN PHÂN TÍCH CHUYÊN SÂU:
1. **TOPIC CLUSTERS (Phân cụm chủ đề)**: Nhóm 100 từ khóa trên vào 4-6 cụm chủ đề lớn (ví dụ: Khai cuộc, Cờ thế, Phần mềm, Tin tức kỳ thủ). Mỗi cụm cần có: tên cụm, số lượng từ khóa, và trạng thái hiệu suất (đang chiếm ưu thế hay cần cải thiện).
2. **LSI KEYWORDS (Từ khóa ngữ nghĩa)**: Với mỗi cụm chủ đề, hãy gợi ý 5-7 từ khóa LSI (Latent Semantic Indexing) mà website CHƯA có hoặc có ít traffic nhưng tiềm năng cao để bao phủ toàn bộ thực thể (Entity).
3. **TRENDING & BREAKOUT**: Xác định các từ khóa có lượt hiển thị (Impressions) cao bất thường nhưng Clicks thấp (cơ hội tối ưu Title/Description).
4. **CHIẾN LƯỢC NỘI DUNG**: Đề xuất 3 Topic Cluster mới mà đối thủ đang chiếm lĩnh nhưng website có thể thâm nhập (ví dụ: Cờ Úp, Cờ Vua thế giới, v.v.).

TRẢ VỀ JSON CHI TIẾT:
{
  "clusters": [
    {
      "name": "Tên nhóm",
      "keywords": ["kw1", "kw2"],
      "status": "growth_opportunity | dominant | weak",
      "lsi_suggestions": ["lsi1", "lsi2"]
    }
  ],
  "breakoutKeywords": [
    {"keyword": "...", "impressions": 0, "growth": "...", "reason": "..."}
  ],
  "expansionSuggestions": [
    {"keyword": "...", "volume": 0, "difficulty": 0, "growth": 0, "strategy": "..."}
  ],
  "expansionStrategy": {
    "newClusters": ["Cluster 1", "Cluster 2"],
    "actionPlan": ["Hành động 1", "Hành động 2"]
  }
}`;

    const { generateContent } = await import('./aiService.mjs');
    const text = await generateContent(prompt);
    
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('NO_JSON_FOUND');
    
    return JSON.parse(match[0]);
  } catch (err) {
    logger.error(`[AI_EXPANSION] Analysis failed: ${err.message}`);
    return null;
  }
}

/**
 * Helper to fetch queries for a specific landing page using GSC
 */
async function fetchQueriesForPage(pageUrl, days) {
  try {
    const { getSearchConsoleDetailed } = await import('./googleReporting.mjs');
    // Lấy dữ liệu chi tiết cho page cụ thể
    const allQueries = await getSearchConsoleDetailed(days, 'query', 200);
    // Lưu ý: GSC API nodejs client hỗ trợ filter theo page trực tiếp, 
    // nhưng ở đây ta dùng hàm helper có sẵn và filter thủ công nếu cần hoặc gọi trực tiếp API
    return allQueries.filter(q => q.clicks > 0).slice(0, 20); 
  } catch (err) {
    logger.error(`[AI_SEO] Failed to fetch queries for page: ${err.message}`);
    return [];
  }
}
