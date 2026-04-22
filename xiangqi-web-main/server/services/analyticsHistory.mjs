import { getDb } from '../mongo.mjs';
import { getCoreWebVitals } from './googleReporting.mjs';
import { logger } from '../logger.mjs';

const COLLECTION = 'vitals_history';

/**
 * Saves a single vitals record (e.g. from a manual test)
 */
export async function saveVitalsRecord(strategy, data) {
  try {
    const db = await getDb();
    const col = db.collection(COLLECTION);
    
    const record = {
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      strategy,
      metrics: {
        lcp: data.lcp?.percentile,
        fid: data.fid?.percentile,
        cls: data.cls?.percentile,
        inp: data.inp?.percentile,
        overall: data.overall
      },
      isSnapshot: false,
      createdAt: new Date()
    };

    await col.insertOne(record);
    logger.info(`[AnalyticsHistory] Saved speed record for ${strategy} to MongoDB`);
  } catch (err) {
    logger.error(`[AnalyticsHistory] Failed to save record: ${err.message}`);
  }
}

/**
 * Captures a daily snapshot of Core Web Vitals
 */
export async function takeVitalsSnapshot() {
  try {
    const db = await getDb();
    const col = db.collection(COLLECTION);
    const today = new Date().toISOString().split('T')[0];

    // Check if snapshot already exists for today
    const existing = await col.findOne({ date: today, isSnapshot: true });
    if (existing) return;

    const [mobile, desktop] = await Promise.all([
      getCoreWebVitals('mobile'),
      getCoreWebVitals('desktop')
    ]);

    const docs = [];
    if (mobile) {
      docs.push({
        timestamp: new Date().toISOString(),
        date: today,
        strategy: 'mobile',
        metrics: {
          lcp: mobile.lcp?.percentile,
          fid: mobile.fid?.percentile,
          cls: mobile.cls?.percentile,
          inp: mobile.inp?.percentile,
          overall: mobile.overall
        },
        isSnapshot: true,
        createdAt: new Date()
      });
    }

    if (desktop) {
      docs.push({
        timestamp: new Date().toISOString(),
        date: today,
        strategy: 'desktop',
        metrics: {
          lcp: desktop.lcp?.percentile,
          fid: desktop.fid?.percentile,
          cls: desktop.cls?.percentile,
          inp: desktop.inp?.percentile,
          overall: desktop.overall
        },
        isSnapshot: true,
        createdAt: new Date()
      });
    }

    if (docs.length > 0) {
      await col.insertMany(docs);
      logger.info(`[AnalyticsHistory] Saved daily vitals snapshot for ${today}`);
    }

    // Cleanup: Keep only last 2 years of snapshots
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    await col.deleteMany({ createdAt: { $lt: twoYearsAgo } });

  } catch (err) {
    logger.error('[AnalyticsHistory] Vitals snapshot failed:', err);
  }
}

/**
 * Retrieves historical vitals data
 */
export async function getVitalsHistory(strategy = null, days = 90) {
  try {
    const db = await getDb();
    const col = db.collection(COLLECTION);
    
    const query = {};
    if (strategy) query.strategy = strategy;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    query.createdAt = { $gte: startDate };

    return await col.find(query).sort({ createdAt: 1 }).toArray();
  } catch (err) {
    return [];
  }
}

/**
 * Gets the latest aggregated vitals summary
 */
export async function getLatestVitalsSummary() {
  try {
    const db = await getDb();
    const col = db.collection(COLLECTION);
    
    // Get latest snapshots for both strategies
    const [mobile, desktop] = await Promise.all([
      col.findOne({ strategy: 'mobile', isSnapshot: true }, { sort: { createdAt: -1 } }),
      col.findOne({ strategy: 'desktop', isSnapshot: true }, { sort: { createdAt: -1 } })
    ]);

    return {
      mobile: mobile ? {
        lcp: { percentile: mobile.metrics.lcp, category: getCat(mobile.metrics.lcp, 2500, 4000) },
        fid: { percentile: mobile.metrics.fid, category: getCat(mobile.metrics.fid, 100, 300) },
        cls: { percentile: mobile.metrics.cls, category: getCat(mobile.metrics.cls, 10, 25) },
        inp: { percentile: mobile.metrics.inp, category: getCat(mobile.metrics.inp, 200, 500) },
        overall: mobile.metrics.overall
      } : null,
      desktop: desktop ? {
        lcp: { percentile: desktop.metrics.lcp, category: getCat(desktop.metrics.lcp, 2500, 4000) },
        fid: { percentile: desktop.metrics.fid, category: getCat(desktop.metrics.fid, 100, 300) },
        cls: { percentile: desktop.metrics.cls, category: getCat(desktop.metrics.cls, 10, 25) },
        inp: { percentile: desktop.metrics.inp, category: getCat(desktop.metrics.inp, 200, 500) },
        overall: desktop.metrics.overall
      } : null
    };
  } catch (err) {
    return { mobile: null, desktop: null };
  }
}

function getCat(val, good, poor) {
  if (val === undefined || val === null) return 'UNKNOWN';
  if (val <= good) return 'FAST';
  if (val <= poor) return 'AVERAGE';
  return 'POOR';
}
