import { BetaAnalyticsDataClient } from '@google-analytics/data';
const AnalyticsDataClient = BetaAnalyticsDataClient;
import { google } from 'googleapis';
import { logger } from '../logger.mjs';
import { getConfig } from './siteConfig.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../');

/**
 * Strict SSOT for Google API Clients
 */
let clients = null;
let lastUsedConfig = "";

async function getClients() {
  const [propertyId, siteUrl, jsonStr] = await Promise.all([
    getConfig('google.ga4PropertyId'),
    getConfig('google.searchConsoleSiteUrl'),
    getConfig('google.serviceAccountJson')
  ]);

  if (!propertyId || !siteUrl || !jsonStr) {
    const missing = [];
    if (!propertyId) missing.push('ga4PropertyId');
    if (!siteUrl) missing.push('searchConsoleSiteUrl');
    if (!jsonStr) missing.push('serviceAccountJson');
    logger.warn(`[GoogleReporting] SSOT Missing required keys: ${missing.join(', ')}`);
    return null;
  }

  const configFingerprint = `${propertyId}-${siteUrl}-${jsonStr.length}`;
  if (clients && lastUsedConfig === configFingerprint) {
    return { ...clients, propertyId, siteUrl };
  }

  try {
    let credentials;
    if (jsonStr.trim().startsWith('{')) {
      credentials = JSON.parse(jsonStr);
    } else {
      let filePath = jsonStr.trim();
      if (filePath.startsWith('./')) {
        filePath = path.resolve(PROJECT_ROOT, filePath.substring(2));
      } else if (!path.isAbsolute(filePath)) {
        filePath = path.resolve(PROJECT_ROOT, filePath);
      }
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Secret file not found at: ${filePath}`);
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      credentials = JSON.parse(fileContent);
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/webmasters.readonly'
      ],
    });

    clients = {
      analytics: new AnalyticsDataClient({ credentials }),
      searchconsole: google.webmasters({ version: 'v3', auth }),
      pagespeedonline: google.pagespeedonline('v5'),
    };
    lastUsedConfig = configFingerprint;
    return { ...clients, propertyId, siteUrl };
  } catch (err) {
    logger.error('[GoogleReporting] Client initialization failed:', err);
    return null;
  }
}

export async function isGoogleReportingEnabled() {
  const c = await getClients();
  return !!c;
}

export async function getAnalyticsSummary(days = 30) {
  const c = await getClients();
  if (!c) return null;
  try {
    const [response] = await c.analytics.runReport({
      property: `properties/${c.propertyId}`,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' }, { name: 'sessions' },
        { name: 'screenPageViews' }, { name: 'averageSessionDuration' }
      ],
    });
    return response;
  } catch (err) {
    logger.error('[GoogleReporting] GA4 error:', err.message);
    return null;
  }
}

export async function getSearchConsoleSummary(days = 30) {
  const c = await getClients();
  if (!c) return null;
  try {
    const res = await c.searchconsole.searchanalytics.query({
      siteUrl: c.siteUrl,
      requestBody: {
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['date', 'device'],
      },
    });
    return res.data;
  } catch (err) {
    logger.error('[GoogleReporting] GSC error:', err.message);
    return null;
  }
}

export async function getSearchConsoleDetailed(days = 30, dimension = 'query', limit = 10) {
  const c = await getClients();
  if (!c) return [];
  try {
    const res = await c.searchconsole.searchanalytics.query({
      siteUrl: c.siteUrl,
      requestBody: {
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dimensions: [dimension],
        rowLimit: limit
      },
    });
    return res.data.rows || [];
  } catch (err) {
    logger.error(`[GoogleReporting] GSC ${dimension} error:`, err.message);
    return [];
  }
}

export async function getSitemapsStatus() {
  const c = await getClients();
  if (!c) return [];
  try {
    const res = await c.searchconsole.sitemaps.list({ siteUrl: c.siteUrl });
    return res.data.sitemap || [];
  } catch (err) {
    logger.error('[GoogleReporting] Sitemaps error:', err.message);
    return [];
  }
}

export async function getRealtimeSummary() {
  const c = await getClients();
  if (!c) return null;
  try {
    const [response] = await c.analytics.runRealtimeReport({
      property: `properties/${c.propertyId}`,
      metrics: [{ name: 'activeUsers' }],
      dimensions: [{ name: 'country' }]
    });
    return response;
  } catch (err) {
    logger.error('[GoogleReporting] GA4 Realtime error:', err.message);
    return null;
  }
}

export async function getCoreWebVitals(strategy = 'mobile', force = false, targetUrl = null) {
  const c = await getClients();
  if (!c) return null;
  const apiKey = await getConfig('google.pagespeedApiKey');
  if (!apiKey) {
    logger.warn('[GoogleReporting] Missing PageSpeed API Key');
    return null;
  }
  
  const url = targetUrl || c.siteUrl.replace('sc-domain:', 'https://');
  
  try {
    const res = await c.pagespeedonline.pagespeedapi.runpagespeed({
      url,
      strategy,
      key: apiKey,
      category: ['performance']
    });

    const data = res.data;
    const exp = data.loadingExperience || data.originLoadingExperience;
    
    if (!exp || !exp.metrics) {
      logger.warn('[GoogleReporting] No loading experience data found for', url);
      return null;
    }

    // Map CrUX metrics to frontend format
    return {
      lcp: {
        percentile: exp.metrics.LARGEST_CONTENTFUL_PAINT_MS?.percentile,
        category: exp.metrics.LARGEST_CONTENTFUL_PAINT_MS?.category
      },
      fid: {
        percentile: exp.metrics.FIRST_INPUT_DELAY_MS?.percentile,
        category: exp.metrics.FIRST_INPUT_DELAY_MS?.category
      },
      cls: {
        percentile: exp.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile,
        category: exp.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.category
      },
      inp: {
        percentile: exp.metrics.INTERACTION_TO_NEXT_PAINT?.percentile,
        category: exp.metrics.INTERACTION_TO_NEXT_PAINT?.category
      }
    };
  } catch (err) {
    logger.error('[GoogleReporting] PageSpeed error:', err.message);
    return null;
  }
}

export async function getSearchConsoleTrends(days = 30) {
  const c = await getClients();
  if (!c) return [];
  try {
    const res = await c.searchconsole.searchanalytics.query({
      siteUrl: c.siteUrl,
      requestBody: {
        startDate: new Date(Date.now() - (days * 2) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['query', 'device'],
      },
    });
    return res.data.rows || [];
  } catch (err) {
    logger.error('[GoogleReporting] GSC Trends error:', err.message);
    return [];
  }
}

export async function inspectUrls(urls = []) {
  if (!urls || urls.length === 0) return [];
  const c = await getClients();
  if (!c) return [];
  
  const targetUrls = urls.slice(0, 5); // Google limit per request batching conceptually
  const fetchResults = await Promise.allSettled(targetUrls.map(async (url) => {
    try {
      const res = await c.searchconsole.urlInspection.index.inspect({
        requestBody: { inspectionUrl: url, siteUrl: c.siteUrl, languageCode: 'en-US' }
      });
      return { 
        url, 
        state: res.data.inspectionResult?.indexStatusResult?.verdict, 
        coverage: res.data.inspectionResult?.indexStatusResult?.coverageState 
      };
    } catch (err) {
      return { url, error: err.message };
    }
  }));

  return fetchResults.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason });
}
export async function getKeywordDeltas(days = 30) {
  const c = await getClients();
  if (!c) return null;

  const now = new Date();
  const periodA_End = now.toISOString().split('T')[0];
  const periodA_Start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const periodB_End = periodA_Start;
  const periodB_Start = new Date(now.getTime() - (days * 2) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const [resA, resB] = await Promise.all([
      c.searchconsole.searchanalytics.query({
        siteUrl: c.siteUrl,
        requestBody: { startDate: periodA_Start, endDate: periodA_End, dimensions: ['query'], rowLimit: 500 }
      }),
      c.searchconsole.searchanalytics.query({
        siteUrl: c.siteUrl,
        requestBody: { startDate: periodB_Start, endDate: periodB_End, dimensions: ['query'], rowLimit: 500 }
      })
    ]);

    const rowsA = resA.data.rows || [];
    const rowsB = resB.data.rows || [];

    const mapB = new Map(rowsB.map(r => [r.keys[0], r]));
    
    const results = rowsA.map(r => {
      const query = r.keys[0];
      const prev = mapB.get(query);
      if (prev) {
        return {
          query,
          current: { clicks: r.clicks, impressions: r.impressions, position: r.position },
          previous: { clicks: prev.clicks, impressions: prev.impressions, position: prev.position },
          delta: {
            clicks: r.clicks - prev.clicks,
            impressions: r.impressions - prev.impressions,
            position: prev.position - r.position // Positive means rank improved (e.g. 5 -> 3)
          },
          status: 'existing'
        };
      } else {
        return {
          query,
          current: { clicks: r.clicks, impressions: r.impressions, position: r.position },
          status: 'new'
        };
      }
    });

    // Also find lost keywords
    const mapA = new Map(rowsA.map(r => [r.keys[0], r]));
    const lost = rowsB.filter(r => !mapA.has(r.keys[0])).map(r => ({
      query: r.keys[0],
      previous: { clicks: r.clicks, impressions: r.impressions, position: r.position },
      status: 'lost'
    }));

    return [...results, ...lost];
  } catch (err) {
    logger.error('[GoogleReporting] Delta calculation failed:', err);
    return null;
  }
}
