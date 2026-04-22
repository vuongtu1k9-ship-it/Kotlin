import express from 'express';
import { logger } from '../../logger.mjs';
import { requireAdmin } from '../../utils/auth.mjs';
import { 
  getAnalyticsSummary, 
  getSearchConsoleSummary,
  getSearchConsoleDetailed,
  getSitemapsStatus,
  isGoogleReportingEnabled,
  getCoreWebVitals,
  inspectUrls,
  getRealtimeSummary
} from '../../services/googleReporting.mjs';
import { generateAdminInsights } from '../../services/aiAnalytics.mjs';
import { executeAiCommand } from '../../services/aiCommanderService.mjs';
import { suggestSeoOptimizations } from '../../services/aiSceoOptimizer.mjs';
import { getVitalsHistory } from '../../services/analyticsHistory.mjs';

const router = express.Router();

router.get('/status', requireAdmin, async (req, res) => {
  res.json({ ok: true, enabled: await isGoogleReportingEnabled() });
});

router.get('/summary', requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    // Fetch local snapshots first for speed
    const { getLatestSummary } = await import('../../services/searchHistory.mjs');
    const { getLatestVitalsSummary, getVitalsHistory } = await import('../../services/analyticsHistory.mjs');
    const { getSearchConsoleTrends, getKeywordDeltas } = await import('../../services/googleReporting.mjs');
    const { analyzeKeywordTrends } = await import('../../services/aiSceoOptimizer.mjs');

    const [localSearch, localVitals] = await Promise.all([
      getLatestSummary(days),
      getLatestVitalsSummary()
    ]);

    logger.info(`[Analytics] Local summary check - Search: ${localSearch ? 'FOUND' : 'MISSING'}, Vitals: ${localVitals?.mobile ? 'FOUND' : 'MISSING'}`);

    const [analytics, searchConsole, sitemaps, topQueries, topPages, devices, perfMobile, perfDesktop, realtime, vitalsHistory, trends, deltas] = await Promise.allSettled([
      getAnalyticsSummary(days),
      getSearchConsoleSummary(days),
      getSitemapsStatus(),
      localSearch ? (logger.info('[Analytics] Using local keywords'), Promise.resolve(localSearch.keywords)) : getSearchConsoleDetailed(days, 'query', 100),
      localSearch ? (logger.info('[Analytics] Using local pages'), Promise.resolve(localSearch.pages)) : getSearchConsoleDetailed(days, 'page', 50),
      getSearchConsoleDetailed(days, 'device', 10),
      localVitals?.mobile ? (logger.info('[Analytics] Using local mobile vitals'), Promise.resolve(localVitals.mobile)) : getCoreWebVitals('mobile'),
      localVitals?.desktop ? (logger.info('[Analytics] Using local desktop vitals'), Promise.resolve(localVitals.desktop)) : getCoreWebVitals('desktop'),
      getRealtimeSummary(),
      getVitalsHistory(null, days),
      getSearchConsoleTrends(days),
      getKeywordDeltas(days)
    ]);

    // Helper tìm từ khóa liên quan dựa trên cụm từ (Phrase-based matching)
    const findRelated = (query, all) => {
      const qLower = query.toLowerCase();
      const qWords = qLower.split(' ').filter(w => w.length >= 2);
      
      return all
        .filter(q => q.keys[0] !== query)
        .map(q => {
          const target = q.keys[0].toLowerCase();
          const tWords = target.split(' ');
          let score = 0;

          // 1. Ưu tiên tuyệt đối nếu cụm từ này chứa cụm từ kia (Substring match)
          if (target.includes(qLower) || qLower.includes(target)) {
            score = 100 + Math.abs(target.length - qLower.length);
          } else {
            // 2. Tính toán trùng lặp từ (nhưng yêu cầu khắt khe hơn)
            const overlapWords = qWords.filter(w => tWords.includes(w));
            const overlapCount = overlapWords.length;

            // Nếu truy vấn gốc có từ 2 từ trở lên, yêu cầu ít nhất 2 từ trùng nhau
            if (qWords.length >= 2) {
              if (overlapCount >= 2) score = overlapCount * 10;
            } else if (overlapCount === 1) {
              // Nếu truy vấn gốc chỉ có 1 từ (ví dụ: "cotuong"), thì 1 từ trùng là đủ
              score = 5;
            }
          }

          return { query: q.keys[0], score, clicks: q.clicks };
        })
        .filter(q => q.score > 0)
        .sort((a, b) => b.score - a.score || b.clicks - a.clicks)
        .slice(0, 6)
        .map(q => q.query);
    };

    // Format dữ liệu thực tế
    const rawKeywords = topQueries.status === 'fulfilled' ? topQueries.value.map(q => {
      const query = q.keys[0];
      const related = findRelated(query, topQueries.value);
      
      // Tạo danh sách so sánh cho Google Trends (tối đa 5 từ khóa)
      const comparisonList = [query, ...related].slice(0, 5);
      const trendsUrl = `https://trends.google.com.vn/trends/explore?date=today%203-m&geo=VN&q=${comparisonList.map(k => encodeURIComponent(k)).join(',')}&hl=vi`;

      return {
        query,
        clicks: q.clicks,
        impressions: q.impressions,
        ctr: (q.ctr * 100).toFixed(1) + '%',
        position: Math.round(q.position),
        trendsUrl,
        related
      };
    }) : [];

    // Inspect indexing status for top landing pages in parallel with the rest of the synthesis logic
    const topUrls = (topPages.status === 'fulfilled' && topPages.value.length > 0)
      ? topPages.value.map(p => p.keys[0])
      : [];

    const [indexingStatus, pagesPerformance] = await Promise.all([
      topUrls.length > 0 ? inspectUrls(topUrls) : Promise.resolve([]),
      topUrls.length > 0 ? Promise.all(topUrls.slice(0, 5).map(async (url) => {
        // Lấy dữ liệu hiệu năng cho từng URL (ưu tiên cache)
        const perf = await getCoreWebVitals('mobile', false, url);
        return { url, perf };
      })) : Promise.resolve([])
    ]);

    // --- Synthesize Alerts & Warnings ---
    const alerts = [];
    
    const siteUrl = 'https://cotuong.xyz'; // Default fallback or fetch from searchConsole.value

    // 1. Sitemap Alerts
    if (sitemaps.status === 'fulfilled' && sitemaps.value.sitemap) {
      const siteIssues = sitemaps.value.sitemap.filter(sm => sm.errors !== "0" || sm.warnings !== "0");
      if (siteIssues.length > 0) {
        alerts.push({
          type: 'critical',
          source: 'Search Console',
          title: 'Lỗi Sitemap',
          message: `${siteIssues.length} sitemap gặp vấn đề kỹ thuật. Kiểm tra lại đường dẫn và cấu trúc XML.`,
          link: `https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(siteUrl)}`
        });
      }
    }

    // 2. Performance (CWV) Alerts
    const checkCWV = (perf, device) => {
      if (!perf) return;
      const poorMetrics = [];
      if (perf.lcp?.category === 'POOR') poorMetrics.push('LCP');
      if (perf.fid?.category === 'POOR') poorMetrics.push('FID');
      if (perf.cls?.category === 'POOR') poorMetrics.push('CLS');
      if (perf.inp?.category === 'POOR') poorMetrics.push('INP');
      const needsMetrics = [];
      if (perf.inp?.category === 'AVERAGE') needsMetrics.push('INP');
      if (perf.cls?.category === 'AVERAGE') needsMetrics.push('CLS');
      
      if (poorMetrics.length > 0) {
        alerts.push({
          type: 'critical',
          source: 'Core Web Vitals',
          title: `Hiệu năng ${device} kém (POOR)`,
          message: `Chỉ số ${poorMetrics.join(', ')} trên ${device} đạt ngưỡng KÉM. Cần tối ưu khẩn cấp.`,
          link: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(siteUrl)}`
        });
      }
      if (needsMetrics.length > 0) {
        alerts.push({
          type: 'warning',
          source: 'Core Web Vitals',
          title: `Cần cải thiện ${device}`,
          message: `Chỉ số ${needsMetrics.join(', ')} trên ${device} cần cải thiện (> ngưỡng). Xem báo cáo GSC.`,
          link: `https://search.google.com/search-console/core-web-vitals?resource_id=${encodeURIComponent(siteUrl)}`
        });
      }
    };
    checkCWV(perfMobile.status === 'fulfilled' ? perfMobile.value : null, 'Mobile');
    checkCWV(perfDesktop.status === 'fulfilled' ? perfDesktop.value : null, 'Desktop');

    // 3. Indexing Alerts
    const nonIndexed = indexingStatus.filter(idx => idx.state !== 'NEUTRAL' && idx.state !== 'PASS' && idx.state !== 'GOOD');
    if (nonIndexed.length > 0) {
      alerts.push({
        type: 'critical',
        source: 'Search Console',
        title: 'Trang chưa được lập chỉ mục',
        message: `${nonIndexed.length} trong số các trang quan trọng nhất của bạn chưa xuất hiện trên Google.`,
        link: `https://search.google.com/search-console/index?resource_id=${encodeURIComponent(siteUrl)}`
      });
    }

    res.json({
      ok: true,
      data: {
        analytics: analytics.status === 'fulfilled' ? analytics.value : null,
        searchConsole: searchConsole.status === 'fulfilled' ? searchConsole.value : null,
        sitemaps: sitemaps.status === 'fulfilled' ? sitemaps.value : { sitemap: [] },
        topQueries: rawKeywords, // Sử dụng dữ liệu đã xử lý ở trên
        topPages: topPages.status === 'fulfilled' ? topPages.value : [],

        devices: devices.status === 'fulfilled' ? devices.value : [],
        performance: {
          mobile: perfMobile.status === 'fulfilled' ? perfMobile.value : null,
          desktop: perfDesktop.status === 'fulfilled' ? perfDesktop.value : null
        },
        indexingStatus,
        pagesPerformance,
        alerts,
        realtime: realtime.status === 'fulfilled' ? realtime.value : null,
        vitalsHistory: vitalsHistory.status === 'fulfilled' ? vitalsHistory.value : [],
        trends: trends.status === 'fulfilled' ? trends.value.map(r => ({
          query: r.keys[0],
          device: r.keys[1],
          current: r.clicks,
          currentImpressions: r.impressions,
          position: r.position
        })) : [],
        deltas: deltas.status === 'fulfilled' ? deltas.value : [],
        kwAnalysis: (trends.status === 'fulfilled') ? await analyzeKeywordTrends(trends.value) : null
      }
    });
  } catch (e) {
    logger.error('GET /admin/analytics/summary failed', e);
    res.status(500).json({ ok: false, error: e.message || 'REPORTING_FAILED' });
  }
});

router.get('/insights', requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const { getSearchConsoleDetailed } = await import('../../services/googleReporting.mjs');
    const { analyzeMarketExpansion } = await import('../../services/aiSceoOptimizer.mjs');
    
    const [insights, topQueries] = await Promise.all([
      generateAdminInsights(days),
      getSearchConsoleDetailed(days, 'query', 100)
    ]);

    const expansion = await analyzeMarketExpansion(topQueries);
    
    res.json({ 
      ok: true, 
      data: { 
        ...insights, 
        expansion 
      } 
    });
  } catch (e) {
    logger.error('GET /admin/analytics/insights failed', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// AI Command Center Executor
router.post('/ai/command', requireAdmin, async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) throw new Error('EMPTY_COMMAND');
    const result = await executeAiCommand(command, req.user);
    res.json(result);
  } catch (e) {
    logger.error('POST /admin/ai/command failed', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// AI SEO Optimizer Suggestions
router.get('/ai/optimize', requireAdmin, async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) throw new Error('MISSING_URL');
    const suggestions = await suggestSeoOptimizations(url);
    res.json({ ok: true, data: suggestions });
  } catch (e) {
    logger.error('GET /admin/ai/optimize failed', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Manual PageSpeed Test
router.post('/speed-test', requireAdmin, async (req, res) => {
  try {
    const { strategy, url } = req.body;
    const result = await getCoreWebVitals(strategy || 'mobile', true, url);
    res.json({ ok: true, data: result });
  } catch (e) {
    logger.error('POST /admin/analytics/speed-test failed', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Keyword History & Trends
router.get('/keyword-trend', requireAdmin, async (req, res) => {
  try {
    const { query, days, granularity } = req.query;
    if (!query) throw new Error('MISSING_QUERY');
    const { getKeywordTrend } = await import('../../services/searchHistory.mjs');
    const trend = await getKeywordTrend(query, parseInt(days) || 90, granularity || 'day');
    res.json({ ok: true, data: trend });
  } catch (e) {
    logger.error('GET /admin/analytics/keyword-trend failed', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/page-trend', requireAdmin, async (req, res) => {
  try {
    const { page, days, granularity } = req.query;
    if (!page) throw new Error('MISSING_PAGE');
    const { getPageTrend } = await import('../../services/searchHistory.mjs');
    const trend = await getPageTrend(page, parseInt(days) || 90, granularity || 'day');
    res.json({ ok: true, data: trend });
  } catch (e) {
    logger.error('GET /admin/analytics/page-trend failed', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/keyword-snapshots', requireAdmin, async (req, res) => {
  try {
    const { getLatestSnapshot } = await import('../../services/searchHistory.mjs');
    const data = await getLatestSnapshot();
    res.json({ ok: true, data });
  } catch (e) {
    logger.error('GET /admin/analytics/keyword-snapshots failed', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
