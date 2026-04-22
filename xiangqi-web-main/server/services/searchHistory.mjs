import { getDb } from '../mongo.mjs';
import { getSearchConsoleDetailed } from './googleReporting.mjs';
import { logger } from '../logger.mjs';

const KEYWORD_COLLECTION = 'keyword_history';
const PAGE_COLLECTION = 'page_history';

/**
 * Captures a daily snapshot of top keywords from GSC
 */
export async function takeKeywordSnapshot(limit = 500) {
  try {
    const db = await getDb();
    const col = db.collection(KEYWORD_COLLECTION);
    const today = new Date().toISOString().split('T')[0];

    const existing = await col.findOne({ date: today });
    if (existing) return;

    const queries = await getSearchConsoleDetailed(3, 'query', limit);
    if (!queries || queries.length === 0) return;

    const docs = queries.map(q => ({
      date: today,
      query: q.keys[0],
      clicks: q.clicks,
      impressions: q.impressions,
      position: q.position,
      ctr: q.ctr,
      createdAt: new Date()
    }));

    await col.insertMany(docs);
    logger.info(`[SearchHistory] Saved ${docs.length} keywords for ${today}`);
    await cleanupOldRecords(col);
  } catch (err) {
    logger.error('[SearchHistory] Keyword snapshot failed:', err);
  }
}

/**
 * Captures a daily snapshot of top pages from GSC
 */
export async function takePageSnapshot(limit = 200) {
  try {
    const db = await getDb();
    const col = db.collection(PAGE_COLLECTION);
    const today = new Date().toISOString().split('T')[0];

    const existing = await col.findOne({ date: today });
    if (existing) return;

    const pages = await getSearchConsoleDetailed(3, 'page', limit);
    if (!pages || pages.length === 0) return;

    const docs = pages.map(p => ({
      date: today,
      page: p.keys[0],
      clicks: p.clicks,
      impressions: p.impressions,
      position: p.position,
      ctr: p.ctr,
      createdAt: new Date()
    }));

    await col.insertMany(docs);
    logger.info(`[SearchHistory] Saved ${docs.length} pages for ${today}`);
    await cleanupOldRecords(col);
  } catch (err) {
    logger.error('[SearchHistory] Page snapshot failed:', err);
  }
}

async function cleanupOldRecords(col) {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const cleanupDate = twoYearsAgo.toISOString().split('T')[0];
  await col.deleteMany({ date: { $lt: cleanupDate } });
}

/**
 * Gets history for a specific keyword with granularity
 */
export async function getKeywordTrend(query, days = 90, granularity = 'day') {
  try {
    const db = await getDb();
    const col = db.collection(KEYWORD_COLLECTION);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (granularity === 'day') {
      return await col.find({ query, date: { $gte: startDate } }).sort({ date: 1 }).toArray();
    }

    // Aggregate by week or month
    const groupFormat = granularity === 'week' ? "%Y-%U" : "%Y-%m";
    return await col.aggregate([
      { $match: { query, date: { $gte: startDate } } },
      { $addFields: { dateObj: { $dateFromString: { dateString: "$date" } } } },
      { $group: {
          _id: { $dateToString: { format: groupFormat, date: "$dateObj" } },
          clicks: { $sum: "$clicks" },
          impressions: { $sum: "$impressions" },
          position: { $avg: "$position" },
          date: { $max: "$date" } // Use the last date in period as label
      }},
      { $sort: { _id: 1 } }
    ]).toArray();
  } catch (err) { return []; }
}

/**
 * Gets history for a specific page with granularity
 */
export async function getPageTrend(page, days = 90, granularity = 'day') {
  try {
    const db = await getDb();
    const col = db.collection(PAGE_COLLECTION);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (granularity === 'day') {
      return await col.find({ page, date: { $gte: startDate } }).sort({ date: 1 }).toArray();
    }

    const groupFormat = granularity === 'week' ? "%Y-%U" : "%Y-%m";
    return await col.aggregate([
      { $match: { page, date: { $gte: startDate } } },
      { $addFields: { dateObj: { $dateFromString: { dateString: "$date" } } } },
      { $group: {
          _id: { $dateToString: { format: groupFormat, date: "$dateObj" } },
          clicks: { $sum: "$clicks" },
          impressions: { $sum: "$impressions" },
          position: { $avg: "$position" },
          date: { $max: "$date" }
      }},
      { $sort: { _id: 1 } }
    ]).toArray();
  } catch (err) { return []; }
}

/**
 * Aggregates daily snapshots to provide a summary for a period
 */
export async function getLatestSummary(days = 30) {
  try {
    const db = await getDb();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Aggregate Keywords
    const kwCol = db.collection(KEYWORD_COLLECTION);
    const kwData = await kwCol.aggregate([
      { $match: { date: { $gte: startDate } } },
      { $group: {
          _id: "$query",
          clicks: { $sum: "$clicks" },
          impressions: { $sum: "$impressions" },
          avgPosition: { $avg: "$position" },
          count: { $sum: 1 }
      }},
      { $sort: { clicks: -1 } },
      { $limit: 100 }
    ]).toArray();

    // Aggregate Pages
    const pgCol = db.collection(PAGE_COLLECTION);
    const pgData = await pgCol.aggregate([
      { $match: { date: { $gte: startDate } } },
      { $group: {
          _id: "$page",
          clicks: { $sum: "$clicks" },
          impressions: { $sum: "$impressions" },
          avgPosition: { $avg: "$position" },
          count: { $sum: 1 }
      }},
      { $sort: { clicks: -1 } },
      { $limit: 100 }
    ]).toArray();

    return {
      keywords: kwData.map(k => ({ keys: [k._id], clicks: k.clicks, impressions: k.impressions, position: k.avgPosition, ctr: k.clicks / (k.impressions || 1) })),
      pages: pgData.map(p => ({ keys: [p._id], clicks: p.clicks, impressions: p.impressions, position: p.avgPosition, ctr: p.clicks / (p.impressions || 1) }))
    };
  } catch (err) {
    logger.error('[SearchHistory] Failed to aggregate summary:', err);
    return null;
  }
}
