import { getGamesCol, getPuzzlesCol, getDb, getPuzzleSolutionsCol, toQueryId } from '../mongo.mjs';
import { logger } from '../logger.mjs';
import { getConfig } from './siteConfig.mjs';
import { generateBoardImage } from '../utils/imageGen.mjs';
import axios from 'axios';
import { google } from 'googleapis';
import { generateGameVideo } from '../utils/videoGen.mjs';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

import { AiGeneratorService } from './aiGenerator.mjs';
import { takeKeywordSnapshot, takePageSnapshot } from './searchHistory.mjs';
import { takeVitalsSnapshot } from './analyticsHistory.mjs';

const execPromise = promisify(exec);

/**
 * Helper to ensure a value is a string (handles multilingual objects)
 */
function ensureString(val, fallback = '') {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.vi || val.en || val.displayName || JSON.stringify(val);
  }
  return String(val);
}

/**
 * SocialAutomationService
 * Handles automated content distribution to Facebook/Social channels.
 * Note: Requires a Long-lived Page Access Token in site_config (facebook.appToken).
 */
class SocialAutomationService {
  constructor() {
    this.interval = null;
    this.POST_INTERVAL_MS = 1000 * 60 * 60 * 6; // Every 6 hours to avoid spamming
    this.VIDEO_CACHE_DIR = '/data/xiangqi/uploads/videos/';
  }

  async init() {
    const fbToken = await getConfig('facebook.appToken');
    const ytToken = await getConfig('google.refreshToken');
    const ttToken = await getConfig('tiktok.refreshToken');
    const igUser = await getConfig('instagram.userId');
    const twKey = await getConfig('twitter.apiKey');

    if (!fbToken && !ytToken && !ttToken && !igUser && !twKey) {
      logger.info('[SocialService] ⏹️ Social Automation Service is disabled (no credentials found).');
      return;
    }

    logger.info('[SocialService] 🚀 Initializing Social Automation Service...');

    // Wait 10 seconds before first run to allow system to stabilize
    this.initialTimeout = setTimeout(() => this.runCycle(), 10000);

    // Schedule periodic runs
    this.interval = setInterval(() => this.runCycle(), this.POST_INTERVAL_MS);
  }

  /**
   * Generate engaging social content using AI
   */
  async generateSocialContent(type, data) {
    try {
      const ai = AiGeneratorService.getInstance();
      let promptTemplate = await getConfig('social.prompt');
      
      if (!promptTemplate) {
        logger.warn('[SocialService] social.prompt not found in config. Using hardcoded fallback.');
        promptTemplate = `Bạn là một chuyên gia Marketing cho kênh Cờ Tướng (Xiangqi). Viết bài đăng JSON {title, content} cho {{type_vn}}: {{name}}, {{url}}`;
      }

      const typeVn = type === 'puzzle' ? 'thế cờ' : 'ván đấu';
      const extraInfo = type === 'puzzle' 
        ? `- Cấp độ: ${data.level || 'Khó'}` 
        : `- Số nước đi: ${data.moveCount || 0}`;

      const prompt = promptTemplate
        .replace(/{{type_vn}}/g, typeVn)
        .replace(/{{name}}/g, data.name || 'Thế cờ hay')
        .replace(/{{description}}/g, data.description || '')
        .replace(/{{extra_info}}/g, extraInfo)
        .replace(/{{url}}/g, data.url);

      const response = await ai.generateSimpleCompletion(prompt);
      const jsonStr = response.match(/\{[\s\S]*\}/)?.[0] || response;
      const result = JSON.parse(jsonStr);
      
      if (result && result.title && result.content) {
        return result;
      }
    } catch (err) {
      logger.error('[SocialService] AI content generation failed:', err.message);
    }
    return null;
  }

  async runCycle() {
    logger.info('[SocialService] 🔄 Starting automation cycle...');
    try {
      // 📊 Take daily snapshots for historical tracking
      await Promise.allSettled([
        takeKeywordSnapshot(),
        takePageSnapshot(),
        takeVitalsSnapshot()
      ]).catch(err => logger.error('[SocialService] Snapshots failed:', err));

      const hour = new Date().getHours();
      if (hour % 2 === 0) {
        await this.postLatestPuzzle();
      } else {
        await this.postLatestHighQualityGame();
      }
    } catch (err) {
      logger.error('[SocialService] Automation cycle failed:', err.message);
    }
  }

  /**
   * Generic Post to Facebook Page
   */
  async postToFacebook(message, media = null, options = {}) {
    if (!media) return await this.postTextToFacebook(message);
    if (options.type === 'video' || options.isVideo) {
      return await this.postVideoToFacebook(message, media, options.title);
    }
    return await this.postImageToFacebook(message, media);
  }

  /**
   * Post text to Facebook Page
   */
  async postTextToFacebook(message) {
    const sMessage = ensureString(message);
    const pageId = await getConfig('facebook.pageId');
    const appToken = await getConfig('facebook.appToken');

    if (!pageId || !appToken) return null;

    try {
      const url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
      logger.info(`[SocialService] 📘 Posting text to Facebook Page: ${pageId}...`);

      const response = await axios.post(url, null, {
        params: { message: sMessage, access_token: appToken },
        timeout: 30000
      });

      logger.info(`[SocialService] ✅ Facebook Page text post successful! ID: ${response.data.id}`);
      return { id: response.data.id, status: 'success', link: `https://www.facebook.com/${response.data.id}` };
    } catch (err) {
      logger.error('[SocialService] Facebook Page text post failed:', err.response?.data || err.message);
      return { status: 'failed', error: err.response?.data?.error?.message || err.message };
    }
  }

  /**
   * Post image to Facebook Page
   */
  async postImageToFacebook(message, imageBuffer) {
    const sMessage = ensureString(message);
    const pageId = await getConfig('facebook.pageId');
    const appToken = await getConfig('facebook.appToken');

    if (!pageId || !appToken) return null;

    try {
      const url = `https://graph.facebook.com/v18.0/${pageId}/photos`;
      logger.info(`[SocialService] 📘 Posting image to Facebook Page: ${pageId}...`);

      const formData = new FormData();
      formData.append('message', sMessage);
      formData.append('access_token', appToken);
      formData.append('source', new Blob([imageBuffer], { type: 'image/webp' }), 'board.webp');

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000)
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error?.message || response.statusText);

      logger.info(`[SocialService] ✅ Facebook Page image post successful! ID: ${data.id}`);
      return { id: data.id, status: 'success', link: `https://www.facebook.com/photo.php?fbid=${data.id}` };
    } catch (err) {
      logger.error('[SocialService] Facebook Page image post failed:', err.message);
      return { status: 'failed', error: err.message };
    }
  }

  /**
   * Post video to Facebook Page
   */
  async postVideoToFacebook(message, videoBuffer, title) {
    const sMessage = ensureString(message);
    const sTitle = ensureString(title, 'Cờ Tướng Highlight');
    const pageId = await getConfig('facebook.pageId');
    const appToken = await getConfig('facebook.appToken');

    if (!pageId || !appToken) return null;

    try {
      const url = `https://graph-video.facebook.com/v18.0/${pageId}/videos`;
      logger.info(`[SocialService] 📘 Posting video to Facebook Page: ${pageId}...`);

      const formData = new FormData();
      formData.append('description', sMessage);
      formData.append('title', sTitle);
      formData.append('access_token', appToken);
      formData.append('source', new Blob([videoBuffer], { type: 'video/mp4' }), 'video.mp4');

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(60000)
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error?.message || response.statusText);

      logger.info(`[SocialService] ✅ Facebook Page video post successful! ID: ${data.id}`);
      return { id: data.id, status: 'success', link: `https://www.facebook.com/watch/?v=${data.id}` };
    } catch (err) {
      logger.error('[SocialService] Facebook Page video post failed:', err.message);
      return { status: 'failed', error: err.message };
    }
  }


  /**
   * Post to Instagram (Business) - Supports both Image and Video (Reels)
   */
  async postToInstagram(message, imageBuffer, videoBuffer = null) {
    const sMessage = ensureString(message);
    const igUserId = await getConfig('instagram.userId');
    const fbToken = await getConfig('facebook.appToken');

    if (!igUserId || !fbToken) {
      logger.warn('[SocialService] Missing Instagram credentials. Skipping.');
      return null;
    }

    try {
      const isVideo = !!videoBuffer;
      const buffer = isVideo ? videoBuffer : imageBuffer;

      if (!buffer) {
        logger.warn('[SocialService] Instagram requires a media buffer. Skipping.');
        return { status: 'failed', error: 'MEDIA_BUFFER_MISSING' };
      }

      logger.info(`[SocialService] 📸 Posting ${isVideo ? 'video (Reels)' : 'image'} to Instagram: ${igUserId}...`);

      const tempId = `ig_${Date.now()}`;
      const ext = isVideo ? 'mp4' : 'jpg';
      const tempPath = path.join(process.cwd(), 'public', 'uploads', 'social', `${tempId}.${ext}`);
      await fs.promises.mkdir(path.dirname(tempPath), { recursive: true });
      await fs.promises.writeFile(tempPath, buffer);

      const publicUrl = `https://cotuong.xyz/uploads/social/${tempId}.${ext}`;

      // Step 1: Create Container
      const containerParams = {
        caption: sMessage,
        access_token: fbToken
      };

      if (isVideo) {
        containerParams.media_type = 'REELS';
        containerParams.video_url = publicUrl;
      } else {
        containerParams.image_url = publicUrl;
      }

      const containerRes = await axios.post(`https://graph.facebook.com/v18.0/${igUserId}/media`, null, {
        params: containerParams
      });

      const creationId = containerRes.data.id;

      // Step 2: For Reels, we need to wait for the video to be processed by IG
      if (isVideo) {
        logger.info(`[SocialService] ⏳ Waiting for Instagram to process video container: ${creationId}...`);
        let ready = false;
        let attempts = 0;
        while (!ready && attempts < 10) {
          await new Promise(r => setTimeout(r, 5000));
          const statusRes = await axios.get(`https://graph.facebook.com/v18.0/${creationId}`, {
            params: { fields: 'status_code', access_token: fbToken }
          });
          if (statusRes.data.status_code === 'FINISHED') ready = true;
          else if (statusRes.data.status_code === 'ERROR') throw new Error('Instagram video processing failed');
          attempts++;
        }
      }

      // Step 3: Publish Container
      const publishRes = await axios.post(`https://graph.facebook.com/v18.0/${igUserId}/media_publish`, null, {
        params: {
          creation_id: creationId,
          access_token: fbToken
        }
      });

      // Cleanup temp file
      setTimeout(() => fs.promises.unlink(tempPath).catch(() => { }), 60000);

      logger.info(`[SocialService] ✅ Instagram ${isVideo ? 'Reels' : 'photo'} post successful! ID: ${publishRes.data.id}`);
      return { id: publishRes.data.id, status: 'success', link: `https://www.instagram.com/reels/` };
    } catch (err) {
      const igErr = err.response?.data?.error || {};
      const errCode = igErr.code;
      const errMsg = igErr.message;

      if (errCode === 10) {
        return {
          status: 'failed',
          error: 'Instagram Permission Denied (Code 10). Ensure your App has "instagram_content_publish" permission and your Instagram account is a Business Account.'
        };
      }

      logger.error('[SocialService] Instagram post failed:', igErr || err.message);
      return { status: 'failed', error: errMsg || err.message };
    }
  }

  /**
   * Post to X (Twitter)
   */
  async postToX(message, imageBuffer) {
    const sMessage = ensureString(message).substring(0, 280);
    const apiKey = await getConfig('twitter.apiKey');
    const apiSecret = await getConfig('twitter.apiSecret');
    const accessToken = await getConfig('twitter.accessToken');
    const accessSecret = await getConfig('twitter.accessSecret');

    if (!apiKey || !accessToken || !apiSecret || !accessSecret) {
      logger.warn('[SocialService] Missing X.com credentials. Skipping.');
      return null;
    }

    try {
      logger.info('[SocialService] 𝕏 Posting to X.com...');

      // Step 1: Upload Media (v1.1)
      // Note: This is simplified. For production, we'd use a more robust OAuth1.0a implementation.
      // But we can implement the signature logic here.

      const oauthParams = {
        oauth_consumer_key: apiKey,
        oauth_nonce: crypto.randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, ''),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_token: accessToken,
        oauth_version: '1.0'
      };

      const tweetData = { text: sMessage };
      const url = 'https://api.twitter.com/2/tweets';

      const signature = this._generateXSignature('POST', url, oauthParams, apiSecret, accessSecret);
      const authHeader = `OAuth ${Object.entries({ ...oauthParams, oauth_signature: signature })
        .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
        .join(', ')}`;

      const response = await axios.post(url, tweetData, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`[SocialService] ✅ X.com post successful! ID: ${response.data.data.id}`);
      return { id: response.data.data.id, status: 'success', link: `https://twitter.com/i/status/${response.data.data.id}` };
    } catch (err) {
      logger.error('[SocialService] X.com post failed:', err.response?.data || err.message);
      return { status: 'failed', error: err.response?.data?.detail || err.message };
    }
  }

  _generateXSignature(method, url, params, consumerSecret, tokenSecret) {
    const parameterString = Object.keys(params)
      .sort()
      .map(k => `${this._rfc3986Encode(k)}=${this._rfc3986Encode(params[k])}`)
      .join('&');

    const signatureBaseString = `${method.toUpperCase()}&${this._rfc3986Encode(url)}&${this._rfc3986Encode(parameterString)}`;
    const signingKey = `${this._rfc3986Encode(consumerSecret)}&${this._rfc3986Encode(tokenSecret)}`;

    return crypto.createHmac('sha1', signingKey).update(signatureBaseString).digest('base64');
  }

  _rfc3986Encode(str) {
    return encodeURIComponent(str)
      .replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  }

  /**
   * Generic Post to Facebook Group
   * Detects content type and routes to specific handler.
   */
  async postToFacebookGroup(message, media = null, options = {}) {
    if (!media) {
      return await this.postTextToFacebookGroup(message);
    }

    // Check if media is a video (either by option or by checking buffer signature if possible, but options are safer)
    if (options.type === 'video' || options.isVideo) {
      return await this.postVideoToFacebookGroup(message, media, options.title);
    }

    // Default to image
    return await this.postImageToFacebookGroup(message, media);
  }

  /**
   * Post text-only to Facebook Group
   */
  async postTextToFacebookGroup(message) {
    const sMessage = ensureString(message);
    const groupId = await getConfig('facebook.groupId');
    const appToken = await getConfig('facebook.appToken');

    if (!groupId || !appToken) return null;

    try {
      const url = `https://graph.facebook.com/v18.0/${groupId}/feed`;
      logger.info(`[SocialService] 👥 Posting text to Facebook Group: ${groupId}...`);

      const response = await axios.post(url, null, {
        params: {
          message: sMessage,
          access_token: appToken
        },
        timeout: 30000
      });

      logger.info(`[SocialService] ✅ Facebook Group text post successful! ID: ${response.data.id}`);
      return response.data.id;
    } catch (err) {
      logger.error('[SocialService] Facebook Group text post failed:', err.response?.data || err.message);
      return null;
    }
  }

  /**
   * Post image to Facebook Group
   */
  async postImageToFacebookGroup(message, imageBuffer) {
    const sMessage = ensureString(message);
    const groupId = await getConfig('facebook.groupId');
    const appToken = await getConfig('facebook.appToken');

    if (!groupId || !appToken) return null;

    try {
      const url = `https://graph.facebook.com/v18.0/${groupId}/photos`;
      logger.info(`[SocialService] 👥 Posting image to Facebook Group: ${groupId}...`);

      const formData = new FormData();
      formData.append('message', sMessage);
      formData.append('access_token', appToken);
      formData.append('source', new Blob([imageBuffer], { type: 'image/webp' }), 'board.webp');

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000)
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error?.message || response.statusText);

      logger.info(`[SocialService] ✅ Facebook Group image post successful! ID: ${data.id}`);
      return { id: data.id, status: 'success', link: `https://www.facebook.com/photo.php?fbid=${data.id}` };
    } catch (err) {
      logger.error('[SocialService] Facebook Group image post failed:', err.message);
      return { status: 'failed', error: err.message };
    }
  }

  /**
   * Post video to Facebook Group
   */
  async postVideoToFacebookGroup(message, videoBuffer, title) {
    const sMessage = ensureString(message);
    const sTitle = ensureString(title, 'Cờ Tướng Highlight');
    const groupId = await getConfig('facebook.groupId');
    const appToken = await getConfig('facebook.appToken');

    if (!groupId || !appToken) return null;

    try {
      const url = `https://graph-video.facebook.com/v18.0/${groupId}/videos`;
      logger.info(`[SocialService] 👥 Posting video to Facebook Group: ${groupId}...`);

      const formData = new FormData();
      formData.append('description', sMessage);
      formData.append('title', sTitle);
      formData.append('access_token', appToken);
      formData.append('source', new Blob([videoBuffer], { type: 'video/mp4' }), 'video.mp4');

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(60000)
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error?.message || response.statusText);

      logger.info(`[SocialService] ✅ Facebook Group video post successful! ID: ${data.id}`);
      return { id: data.id, status: 'success', link: `https://www.facebook.com/watch/?v=${data.id}` };
    } catch (err) {
      logger.error('[SocialService] Facebook Group video post failed:', err.message);
      return { status: 'failed', error: err.message };
    }
  }


  /**
   * Post to Facebook Personal Profile
   */
  async postToFacebookProfile(message, imageBuffer) {
    const sMessage = ensureString(message);
    const userToken = await getConfig('facebook.userToken');
    if (!userToken) return null;

    try {
      const url = `https://graph.facebook.com/v18.0/me/photos`;
      logger.info('[SocialService] 👤 Posting to Facebook Profile...');

      const formData = new FormData();
      formData.append('message', sMessage);
      formData.append('access_token', userToken);
      formData.append('source', new Blob([imageBuffer], { type: 'image/webp' }), 'board.webp');

      const response = await axios.post(url, formData, {
        timeout: 30000,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      logger.info(`[SocialService] ✅ Facebook Profile post successful! ID: ${response.data.id}`);
      return response.data.id;
    } catch (err) {
      logger.error('[SocialService] Facebook Profile post failed:', err.response?.data || err.message);
      return null;
    }
  }

  /**
   * Generate a video from frames or image buffer
   * Supports both static looping and animated replays.
   */
  async generateVideo(input, options = {}) {
    try {
      // If input is a buffer (legacy support), wrap it in a static frame
      if (Buffer.isBuffer(input)) {
        logger.info('[SocialService] Generating static image video...');
        // We'll create a 5-second static video from the image
        return await generateGameVideo({ staticImage: input, duration: 5 }, {
          width: options.width || 1280,
          ratio: options.ratio || '16:9',
          fps: 1,
          format: 'mp4'
        });
      }

      // If input is { initialFen, moves } or Array of frames
      return await generateGameVideo(input, {
        width: options.width || 1280,
        ratio: options.ratio || '16:9',
        fps: options.fps || 0.5, // Slowed down further to 0.5 (2s/move) for better readability
        format: 'mp4',
        bitrate: options.bitrate || '5M'
      });
    } catch (err) {
      logger.error('[SocialService] Video generation failed:', err.message);
      return null;
    }
  }

  /**
   * Helper to get or generate video from cache
   * @param {Object} input { initialFen, moves }
   * @param {string} type 'puzzle' or 'game'
   * @param {string} id Unique ID
   * @param {Object} options Video options
   */
  async getOrGenerateVideo(input, type, id, options = {}) {
    const ratio = options.ratio || '16:9';
    const filename = `${type}_${id}_${ratio.replace(':', 'x')}.mp4`;
    const cachePath = path.join(this.VIDEO_CACHE_DIR, filename);

    try {
      // Check if cache directory exists
      if (!fs.existsSync(this.VIDEO_CACHE_DIR)) {
        await fs.promises.mkdir(this.VIDEO_CACHE_DIR, { recursive: true });
      }

      // Check if file exists
      if (fs.existsSync(cachePath)) {
        logger.info(`[SocialService] 📀 Using cached video: ${cachePath}`);
        return await fs.promises.readFile(cachePath);
      }

      // Generate if not exists
      logger.info(`[SocialService] 🎬 Generating new video: ${filename}`);
      const videoBuffer = await this.generateVideo(input, options);
      if (videoBuffer) {
        await fs.promises.writeFile(cachePath, videoBuffer);
        logger.info(`[SocialService] 💾 Video saved to cache: ${cachePath}`);
      }
      return videoBuffer;
    } catch (err) {
      logger.error(`[SocialService] Cache/Generation failed for ${filename}:`, err.message);
      return null;
    }
  }

  /**
   * Post to YouTube using Data API v3
   */
  async postToYouTube(title, description, videoBuffer) {
    const sTitle = ensureString(title, 'Ván cờ hay');
    const sDescription = ensureString(description, '');

    const clientId = await getConfig('google.clientId');
    const clientSecret = await getConfig('google.clientSecret');
    const refreshToken = await getConfig('google.refreshToken');

    console.log(`[DEBUG] YT Credentials - Client: ${clientId ? 'EXISTS' : 'MISSING'}, Secret: ${clientSecret ? 'EXISTS' : 'MISSING'}, Refresh: ${refreshToken ? 'EXISTS' : 'MISSING'}`);

    if (!clientId || !clientSecret || !refreshToken) {
      logger.warn('[SocialService] Missing YouTube credentials. Skipping.');
      return null;
    }

    try {
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

      // Save buffer to a temp file for the upload stream
      const tmpPath = path.join(os.tmpdir(), `upload_${Date.now()}.mp4`);
      await fs.promises.writeFile(tmpPath, videoBuffer);

      const response = await youtube.videos.insert({
        part: 'snippet,status',
        requestBody: {
          snippet: {
            title: sTitle.substring(0, 100),
            description: sDescription,

            categoryId: '20', // Gaming
            tags: ['cotuong', 'xiangqi', 'chinesechess']
          },
          status: {
            privacyStatus: 'public', // Set to public
            selfDeclaredMadeForKids: false
          }
        },
        media: {
          body: fs.createReadStream(tmpPath)
        }
      });

      // Cleanup
      await fs.promises.unlink(tmpPath).catch(() => { });

      return { id: response.data.id, status: 'success', link: `https://www.youtube.com/watch?v=${response.data.id}` };
    } catch (err) {
      logger.error('[SocialService] YouTube upload failed:', err.message);
      return { status: 'failed', error: err.message };
    }
  }

  /**
   * Get a fresh TikTok access token using the refresh token
   */
  async getTikTokAccessToken() {
    const clientKey = await getConfig('tiktok.clientKey');
    const clientSecret = await getConfig('tiktok.clientSecret');
    const refreshToken = await getConfig('tiktok.refreshToken');

    if (!clientKey || !clientSecret || !refreshToken) return null;

    try {
      const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/',
        new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const data = response.data;
      if (data.access_token) {
        // If they returned a NEW refresh token, update it
        if (data.refresh_token && data.refresh_token !== refreshToken) {
          logger.info('[SocialService] Received new TikTok refresh token. Updating .env...');
          const envPath = path.join(process.cwd(), '.env');
          let envContent = await fs.promises.readFile(envPath, 'utf8');
          envContent = envContent.replace(/TIKTOK_REFRESH_TOKEN=.*/, `TIKTOK_REFRESH_TOKEN="${data.refresh_token}"`);
          await fs.promises.writeFile(envPath, envContent);
        }
        return data.access_token;
      }
      return null;
    } catch (err) {
      logger.error('[SocialService] Failed to refresh TikTok token:', err.response?.data || err.message);
      return null;
    }
  }

  /**
   * Post to TikTok using Content Posting API
   */
  async postToTikTok(title, videoBuffer) {
    const sTitle = ensureString(title, 'Cờ Tướng Online');

    const accessToken = await this.getTikTokAccessToken();
    console.log(`[DEBUG] TikTok Access Token: ${accessToken ? 'EXISTS' : 'MISSING'}`);
    if (!accessToken) {
      logger.warn('[SocialService] Could not get TikTok access token. Skipping.');
      return { status: 'failed', error: 'Missing credentials' };
    }

    try {
      logger.info(`[SocialService] 🎵 Initializing TikTok Direct Post (Size: ${videoBuffer.length} bytes)...`);

      // Step 1: Initialize Direct Post
      const initResponse = await axios.post('https://open.tiktokapis.com/v2/post/publish/video/init/',
        {
          post_info: {
            title: sTitle.substring(0, 100),
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_duet: false,
            disable_stitch: false,
            disable_comment: false,
            video_label_from_creator: 'UNSPECIFIED'
          },
          source_info: {
            source: 'FILE_UPLOAD',
            video_size: videoBuffer.length,
            chunk_size: videoBuffer.length,
            total_chunk_count: 1
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8'
          }
        }
      );

      if (initResponse.data.error && initResponse.data.error.code !== 'ok') {
        throw new Error(`TikTok Init Error: ${initResponse.data.error.message} (Code: ${initResponse.data.error.code})`);
      }

      const { upload_url, publish_id } = initResponse.data.data;
      if (!upload_url) {
        throw new Error('No upload_url returned from TikTok init');
      }

      logger.info(`[SocialService] 📤 Uploading video to TikTok (Publish ID: ${publish_id})...`);

      const response = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': videoBuffer.length.toString(),
          'Content-Range': `bytes 0-${videoBuffer.length - 1}/${videoBuffer.length}`
        },
        body: videoBuffer,
        signal: AbortSignal.timeout(300000) // 5 minutes timeout for large video
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TikTok Upload Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      logger.info(`[SocialService] ✅ TikTok Direct Post upload complete! Publish ID: ${publish_id}.`);
      return { id: publish_id, status: 'success', link: `https://www.tiktok.com/@cotuong.xyz` };
    } catch (err) {
      const tiktokErr = err.response?.data?.error || {};
      const errCode = tiktokErr.code;
      const errMsg = tiktokErr.message;

      // Special handling for common TikTok API hurdles
      if (errCode === 'unaudited_client_can_only_post_to_private_accounts') {
        return {
          status: 'failed',
          error: 'TikTok App is in Development mode. You MUST add this TikTok account as a "Tester" in your TikTok Developer Console to see the post.'
        };
      }

      if (errCode === 'scope_not_found' || errCode === 'permission_denied') {
        logger.warn(`[SocialService] TikTok Direct Post not permitted (${errCode}). Falling back to Inbox...`);
        return await this.postToTikTokInbox(sTitle, videoBuffer, accessToken);
      }

      logger.error('[SocialService] TikTok post failed:', errMsg || err.message);
      return { status: 'failed', error: errMsg || err.message };
    }
  }

  /**
   * Fallback: Post to TikTok Inbox (requires manual approval on phone)
   */
  async postToTikTokInbox(title, videoBuffer, accessToken) {
    try {
      logger.info(`[SocialService] 🎵 Initializing TikTok Inbox Fallback (Size: ${videoBuffer.length} bytes)...`);

      const initResponse = await axios.post('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/',
        {
          post_info: {
            title: title.substring(0, 100)
          },
          source_info: {
            source: 'FILE_UPLOAD',
            video_size: videoBuffer.length,
            chunk_size: videoBuffer.length,
            total_chunk_count: 1
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8'
          }
        }
      );

      if (initResponse.data.error && initResponse.data.error.code !== 'ok') {
        throw new Error(`TikTok Inbox Init Error: ${initResponse.data.error.message} (Code: ${initResponse.data.error.code})`);
      }

      const { upload_url, publish_id } = initResponse.data.data;

      logger.info(`[SocialService] 📤 Uploading video to TikTok Inbox (Publish ID: ${publish_id})...`);

      const response = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': videoBuffer.length.toString(),
          'Content-Range': `bytes 0-${videoBuffer.length - 1}/${videoBuffer.length}`
        },
        body: videoBuffer,
        signal: AbortSignal.timeout(300000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TikTok Inbox Upload Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      logger.info(`[SocialService] ✅ TikTok Inbox fallback complete! Publish ID: ${publish_id}. Please check your TikTok app.`);
      return { id: publish_id, status: 'success', type: 'inbox', link: `https://www.tiktok.com/inbox`, message: 'Check TikTok app for manual approval' };
    } catch (err) {
      const tiktokErr = err.response?.data?.error || {};
      const errCode = tiktokErr.code;

      if (errCode === 'unaudited_client_can_only_post_to_private_accounts') {
        return {
          status: 'failed',
          error: 'TikTok App is in Development mode. You MUST add this TikTok account as a "Tester" in your TikTok Developer Console to see the post in your Inbox.'
        };
      }

      logger.error('[SocialService] TikTok Inbox fallback failed:', err.message);
      return { status: 'failed', error: err.message };
    }
  }

  /**
   * Select and post the latest unposted puzzle
   * [FIX] Only upload puzzles that have solutions (real videos)
   */
  async postLatestPuzzle() {
    const FALLBACK_RESOURCES = [
      { provider: 'gemini', model: 'gemini-1.5-flash' },
      { provider: 'cerebras', model: 'llama-3.1-8b' },
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      { provider: 'sambanova', model: 'Meta-Llama-3.3-70B-Instruct' },
      { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct' },
      { provider: 'mistral', model: 'mistral-large-latest' },
      { provider: 'gemini', model: 'gemini-2.0-flash' },
      { provider: 'gemini', model: 'gemini-1.5-pro' }
    ];

    const col = await getPuzzlesCol();
    const solutionsCol = await getPuzzleSolutionsCol();

    // 1. [FIX] Find high-quality unposted puzzles that have solutions
    const pipeline = [
      {
        $match: {
          'social_posted.facebook': { $ne: true },
          $or: [
            { importedFrom: { $exists: true } },
            { tags: 'cờ thế' },
            { level: { $gte: 3 } }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'puzzle_solutions',
          localField: 'uid',
          foreignField: 'puzzleId',
          as: 'solutions'
        }
      },
      { $match: { 'solutions.0': { $exists: true } } },
      { $limit: 1 }
    ];

    const resultsAgg = await col.aggregate(pipeline).toArray();
    const puzzle = resultsAgg[0];

    if (!puzzle) {
      logger.info('[SocialService] 🧩 No unposted puzzles with solutions found.');
      return;
    }

    await this.postPuzzle(puzzle);
  }

  /**
   * Post a specific puzzle by its ID or UID
   */
  async postPuzzleById(id) {
    const col = await getDb().then(db => db.collection('puzzles'));
    const puzzle = await col.aggregate([
      { $match: { $or: [{ _id: toQueryId(id) }, { uid: id }] } },
      {
        $lookup: {
          from: 'puzzle_solutions',
          localField: 'uid',
          foreignField: 'puzzleId',
          as: 'solutions'
        }
      }
    ]).next();

    if (!puzzle) throw new Error('Puzzle not found');
    return await this.postPuzzle(puzzle);
  }

  /**
   * Internal logic to post a puzzle object
   */
  async postPuzzle(puzzle) {
    const col = await getDb().then(db => db.collection('puzzles'));
    logger.info(`[SocialService] 🧩 Processing puzzle post: ${puzzle.uid || puzzle._id}`);

    try {
      // 2. [FIX] Get the best solution
      const solution = puzzle.solutions.sort((a, b) => (a.moves?.length || 0) - (b.moves?.length || 0))[0];

      if (!solution || !solution.moves || solution.moves.length === 0) {
        logger.warn(`[SocialService] ⏭️ Skipping puzzle ${puzzle.uid}: No solution moves found in joined data.`);
        return;
      }

      const imageBuffer = await generateBoardImage(puzzle.fen, {
        ratio: '16:9',
        width: 1280
      });

      const puzzleUrl = `https://cotuong.xyz/puzzles/${puzzle.uid}`;
      const socialData = await this.generateSocialContent('puzzle', {
        name: puzzle.name,
        description: puzzle.description,
        level: puzzle.level,
        url: puzzleUrl
      });

      const nameStr = typeof puzzle.name === 'object' ? (puzzle.name.vi || puzzle.name.en || 'Thế cờ hay') : (puzzle.name || 'Thế cờ hay');
      const title = socialData?.title || `${nameStr} #Shorts`;
      const message = socialData?.content || `🧩 Giải mã thế cờ #d${puzzle.uid}: ${nameStr}\n\n👉 Chơi ngay tại: ${puzzleUrl}`;

      // 3. Only generate and post video if there are moves (avoid static image videos)
      let videoBuffer = null;
      if (solution.moves && solution.moves.length > 0) {
        videoBuffer = await this.getOrGenerateVideo({
          initialFen: puzzle.fen,
          moves: solution.moves
        }, 'puzzle', puzzle.uid || String(puzzle._id), {
          ratio: '9:16', // Vertical for Shorts
          width: 720,
          fps: 0.5, // 2 seconds per move for puzzles
          bitrate: '10M'
        });
      }

      const results = await Promise.allSettled([
        this.postToFacebook(message, imageBuffer),
        this.postToFacebookGroup(message, imageBuffer),
        ...(videoBuffer ? [
          this.postToYouTube(title, message, videoBuffer),
          this.postToTikTok(title, videoBuffer)
        ] : [])
      ]);

      const success = results.some(r => r.status === 'fulfilled' && r.value?.status === 'success');

      if (success) {
        const updateData = {
          'social_posted.facebook': true,
          'social_posted.postedAt': Date.now()
        };

        if (videoBuffer) {
          if (results[2]?.status === 'fulfilled' && results[2].value?.status === 'success') updateData['social_posted.youtube'] = results[2].value.id;
          if (results[3]?.status === 'fulfilled' && results[3].value?.status === 'success') updateData['social_posted.tiktok'] = results[3].value.id;
        }

        await col.updateOne(
          { _id: puzzle._id },
          { $set: updateData }
        );

        // 4. Log to history for dashboard visibility
        await this._logToHistory({
          content: message,
          type: 'puzzle',
          entityId: puzzle.uid || String(puzzle._id),
          platforms: ['facebook', 'facebookGroup', 'youtube', 'tiktok'].filter((p, i) => results[i]?.status === 'fulfilled' && results[i].value?.status === 'success'),
          results: results.reduce((acc, r, i) => {
            const p = ['facebook', 'facebookGroup', 'youtube', 'tiktok'][i];
            if (r.status === 'fulfilled') acc[p] = r.value;
            return acc;
          }, {}),
          status: 'success'
        });

        logger.info(`[SocialService] ✅ Puzzle ${puzzle.uid || puzzle._id} posted to social channels.`);
      }
    } catch (err) {
      logger.error(`[SocialService] Failed to post puzzle ${puzzle.uid}:`, err.message);
    }
  }

  /**
   * Select and post the latest high-quality match (replay)
   */
  async postLatestHighQualityGame() {
    const col = await getGamesCol();
    const game = await col.findOne(
      {
        'social_posted.facebook': { $ne: true },
        'state.moveCount': { $gt: 30 },
        status: 'finished',
        $or: [
          { likeCount: { $gt: 0 } },
          { 'rating.red.before': { $gt: 1300 } },
          { 'rating.black.before': { $gt: 1300 } }
        ]
      },
      { sort: { updatedAt: -1 } }
    );

    if (!game) return;
    await this.postGame(game);
  }

  /**
   * Post a specific game by its ID
   */
  async postGameById(id) {
    const col = await getGamesCol();
    const game = await col.findOne({ _id: toQueryId(id) });
    if (!game) throw new Error('Game not found');
    return await this.postGame(game);
  }

  /**
   * Internal logic to post a game object
   */
  async postGame(game) {
    const col = await getGamesCol();
    const roomId = String(game._id);
    logger.info(`[SocialService] ⚔️ Processing game post: ${roomId}`);

    try {
      // Use the last FEN from history for the thumbnail image (final position)
      let fen = game.state?.fen || 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
      if (game.history && game.history.length > 0) {
        fen = game.history[game.history.length - 1];
      }

      const imageBuffer = await generateBoardImage(fen, {
        ratio: '16:9',
        width: 1280
      });

      const gameUrl = `https://cotuong.xyz/game/${game.roomId || roomId}`;
      const socialData = await this.generateSocialContent('game', {
        name: `${game.playerNames?.red || 'Red'} vs ${game.playerNames?.black || 'Black'}`,
        description: game.winReason || 'Ván đấu đỉnh cao',
        moveCount: game.state?.moveCount,
        url: gameUrl
      });

      const redName = ensureString(game.playerNames?.red, 'Đỏ');
      const blackName = ensureString(game.playerNames?.black, 'Đên');
      const title = socialData?.title || `Ván cờ hay: ${redName} vs ${blackName}`;
      const message = socialData?.content || `⚔️ Theo dõi ván đấu giữa ${redName} và ${blackName}\n\n👉 Xem tại: ${gameUrl}`;

      // 1. Only generate and post video if there are moves
      let videoBuffer = null;
      if (game.history && game.history.length > 0) {
        videoBuffer = await this.getOrGenerateVideo({
          initialFen: game.history[0],
          moves: game.history.slice(1)
        }, 'game', roomId, {
          ratio: '16:9',
          fps: 0.5,
          bitrate: '10M'
        });
      }

      const results = await Promise.allSettled([
        this.postToFacebook(message, imageBuffer),
        this.postToFacebookGroup(message, imageBuffer),
        ...(videoBuffer ? [
          this.postToYouTube(title, message, videoBuffer),
          this.postToTikTok(title, videoBuffer)
        ] : [])
      ]);

      const updateData = {
        'social_posted.facebook': true,
        'social_posted.postedAt': Date.now()
      };

      if (results[2]?.status === 'fulfilled' && results[2].value?.status === 'success') {
        updateData['social_posted.youtube'] = results[2].value.id;
      }
      if (results[3]?.status === 'fulfilled' && results[3].value?.status === 'success') {
        updateData['social_posted.tiktok'] = results[3].value.id;
      }

      await col.updateOne(
        { _id: game._id },
        { $set: updateData }
      );

      // 2. Log to history for dashboard visibility
      await this._logToHistory({
        content: message,
        type: 'game',
        entityId: roomId,
        platforms: ['facebook', 'facebookGroup', 'youtube', 'tiktok'].filter((p, i) => results[i]?.status === 'fulfilled' && results[i].value?.status === 'success'),
        results: results.reduce((acc, r, i) => {
          const p = ['facebook', 'facebookGroup', 'youtube', 'tiktok'][i];
          if (r.status === 'fulfilled') acc[p] = r.value;
          return acc;
        }, {}),
        status: 'success'
      });

      logger.info(`[SocialService] ✅ Game ${roomId} posted to social channels.`);
    } catch (err) {
      logger.error(`[SocialService] Failed to post game ${roomId}:`, err.message);
    }
  }

  /**
   * Post manual content to selected platforms
   */
  async postManual(content, platforms = [], media = null) {
    const sContent = String(content || '');
    logger.info(`[SocialService] 📝 Processing manual post request (Length: ${sContent.length}) to platforms: ${platforms.join(', ')}`);


    const results = {};
    let imageBuffer = media?.type === 'image' ? media.buffer : null;
    let videoBuffer = media?.type === 'video' ? media.buffer : null;

    // If no media provided, generate a default board image and video
    if (!imageBuffer && !videoBuffer) {
      try {
        const defaultFen = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
        imageBuffer = await generateBoardImage(defaultFen, {
          ratio: '16:9',
          width: 1280
        });
        videoBuffer = await this.generateVideo(imageBuffer);
      } catch (err) {
        logger.error('[SocialService] Failed to generate default media for manual post:', err.message);
      }
    } else if (imageBuffer && !videoBuffer) {
      // If image is provided but video is needed for YT/TikTok
      videoBuffer = await this.generateVideo(imageBuffer);
    }

    const tasks = [];

    if (platforms.includes('facebook')) {
      tasks.push((async () => {
        results.facebook = await this.postToFacebook(sContent, imageBuffer);
      })());
      tasks.push((async () => {
        if (videoBuffer) {
          results.facebookGroup = await this.postVideoToFacebookGroup(sContent, videoBuffer);
        } else {
          results.facebookGroup = await this.postToFacebookGroup(sContent, imageBuffer);
        }
      })());
    }

    if (platforms.includes('youtube')) {
      tasks.push((async () => {
        if (videoBuffer) {
          const title = sContent.split('\n')[0].substring(0, 100) || 'Cờ Tướng Online';
          results.youtube = await this.postToYouTube(title, sContent, videoBuffer);
        } else {
          results.youtube = { status: 'failed', error: 'No video' };
        }
      })());
    }

    if (platforms.includes('tiktok')) {
      tasks.push((async () => {
        if (videoBuffer) {
          results.tiktok = await this.postToTikTok(sContent.split('\n')[0], videoBuffer);
        } else {
          results.tiktok = { status: 'failed', error: 'No video' };
        }
      })());
    }

    if (platforms.includes('instagram')) {
      tasks.push((async () => {
        results.instagram = await this.postToInstagram(sContent, imageBuffer, videoBuffer);
      })());
    }

    if (platforms.includes('x')) {
      tasks.push((async () => {
        results.x = await this.postToX(sContent, imageBuffer);
      })());
    }

    await Promise.allSettled(tasks);

    // Log to a social history collection
    const finalStatus = Object.values(results).some(v => v && v.status === 'success') ? 'success' : 'failed';
    await this._logToHistory({
      content: sContent,
      platforms,
      results,
      type: 'manual',
      status: finalStatus
    });

    return results;
  }

  /**
   * Fetch real-time stats for a Facebook post
   */
  async getFacebookStats(postId) {
    try {
      const fbToken = await getConfig('facebook.appToken');
      if (!fbToken) return null;

      const res = await axios.get(`https://graph.facebook.com/v18.0/${postId}`, {
        params: {
          fields: 'reactions.summary(true),comments.summary(true),shares,insights.metric(post_impressions_unique)',
          access_token: fbToken
        }
      });

      const reach = res.data.insights?.data?.find(m => m.name === 'post_impressions_unique')?.values?.[0]?.value || 0;

      return {
        likes: res.data.reactions?.summary?.total_count || 0,
        comments: res.data.comments?.summary?.total_count || 0,
        shares: res.data.shares?.count || 0,
        reach: reach
      };
    } catch (err) {
      logger.error(`[SocialService] Failed to fetch FB stats for ${postId}:`, err.message);
      return null;
    }
  }

  /**
   * Fetch real-time stats for an Instagram post
   */
  async getInstagramStats(mediaId) {
    try {
      const fbToken = await getConfig('facebook.appToken');
      if (!fbToken) return null;

      const res = await axios.get(`https://graph.facebook.com/v18.0/${mediaId}`, {
        params: {
          fields: 'like_count,comments_count,reach,impressions',
          access_token: fbToken
        }
      });

      return {
        likes: res.data.like_count || 0,
        comments: res.data.comments_count || 0,
        reach: res.data.reach || 0,
        impressions: res.data.impressions || 0
      };
    } catch (err) {
      logger.error(`[SocialService] Failed to fetch IG stats for ${mediaId}:`, err.message);
      return null;
    }
  }

  /**
   * Fetch real-time stats for a YouTube video
   */
  async getYoutubeStats(videoId) {
    try {
      const clientId = await getConfig('google.clientId');
      const clientSecret = await getConfig('google.clientSecret');
      const refreshToken = await getConfig('google.refreshToken');

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      const res = await youtube.videos.list({
        id: videoId,
        part: 'statistics'
      });

      const stats = res.data.items?.[0]?.statistics;
      if (!stats) return null;

      return {
        views: parseInt(stats.viewCount || 0),
        likes: parseInt(stats.likeCount || 0),
        comments: parseInt(stats.commentCount || 0)
      };
    } catch (err) {
      logger.error(`[SocialService] Failed to fetch YT stats for ${videoId}:`, err.message);
      return null;
    }
  }

  /**
   * Delete a post from Facebook
   */
  async deleteFacebookPost(postId) {
    try {
      const fbToken = await getConfig('facebook.appToken');
      await axios.delete(`https://graph.facebook.com/v18.0/${postId}?access_token=${fbToken}`);
      return true;
    } catch (err) {
      logger.error(`[SocialService] Failed to delete FB post ${postId}:`, err.message);
      return false;
    }
  }

  /**
   * Delete a video from YouTube
   */
  async deleteYoutubeVideo(videoId) {
    try {
      const clientId = await getConfig('google.clientId');
      const clientSecret = await getConfig('google.clientSecret');
      const refreshToken = await getConfig('google.refreshToken');

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      await youtube.videos.delete({ id: videoId });
      return true;
    } catch (err) {
      logger.error(`[SocialService] Failed to delete YT video ${videoId}:`, err.message);
      return false;
    }
  }

  /**
   * Internal helper to log social activities to history
   */
  async _logToHistory(data) {
    try {
      const db = await getDb();
      await db.collection('social_history').insertOne({
        ...data,
        postedAt: data.postedAt || new Date(),
        createdAt: new Date()
      });
    } catch (err) {
      logger.error('[SocialService] Failed to log to social_history:', err.message);
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export const socialAutomationService = new SocialAutomationService();
