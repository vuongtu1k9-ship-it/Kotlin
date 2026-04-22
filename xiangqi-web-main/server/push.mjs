import webpush from 'web-push';
import { getDb } from './mongo.mjs';
import { logger } from './logger.mjs';
import { getConfig } from './services/siteConfig.mjs';

const CONTACT_EMAIL = 'mailto:hello@cotuong.xyz';

let isPushInit = false;
async function ensurePushInit() {
  if (isPushInit) return true;
  const [pub, priv] = await Promise.all([
    getConfig('push.vapidPublic'),
    getConfig('push.vapidPrivate')
  ]);
  if (pub && priv) {
    webpush.setVapidDetails(CONTACT_EMAIL, pub, priv);
    isPushInit = true;
    return true;
  }
  return false;
}

export async function getSubscriptionCol() {
  const db = await getDb();
  return db.collection('user_subscriptions');
}

export async function saveSubscription(userUid, subscription) {
  const col = await getSubscriptionCol();
  await col.updateOne(
    { userUid, 'subscription.endpoint': subscription.endpoint },
    { $set: { userUid, subscription, lastUsed: Date.now() } },
    { upsert: true }
  );
}

export async function sendNotification(userUid, payload) {
  const initialized = await ensurePushInit();
  if (!initialized) {
    logger.error('[PUSH] Cannot send notification: VAPID keys not configured in Environment');
    return [];
  }

  logger.info(`[PUSH] Triggered for UID: ${userUid} | Title: "${payload.title}"`);
  
  const col = await getSubscriptionCol();
  const subs = await col.find({ userUid }).toArray();
  
  if (subs.length === 0) {
    logger.warn(`[PUSH] No subscriptions found for ${userUid}.`);
    return [];
  }

  const results = await Promise.allSettled(
    subs.map(s => 
      webpush.sendNotification(s.subscription, JSON.stringify(payload))
        .then(res => {
          logger.info(`[PUSH] SUCCESS for ${userUid} | Status: ${res.statusCode}`);
          return res;
        })
        .catch(async (err) => {
          logger.error(`[PUSH] FAILED for ${userUid} | Error: ${err.statusCode || err.message}`);
          if (err.statusCode === 410 || err.statusCode === 404) {
            logger.info(`[PUSH] Removing expired subscription for ${userUid}`);
            await col.deleteOne({ _id: s._id });
          }
          throw err;
        })
    )
  );

  return results;
}
