import dotenv from 'dotenv';
dotenv.config();
import path from 'path';

import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { getGamesCol, getPuzzlesCol, getUsersCol, getDb, getPracticeLessonsCol, getPuzzleSolutionsCol } from './mongo.mjs';
import { initSocket } from './socket/index.mjs';
import { logger } from './logger.mjs';
import { getDataRoot } from './utils/dataRoot.mjs';
import { makeSlug } from './utils/slug.mjs';
import { redisClient } from './services/cache.mjs';
import { getConfig, getAllConfig } from './services/siteConfig.mjs';
import { languageDetector, SUPPORTED_LANGS } from './utils/i18n.mjs';

// Routes
import authRoutes from './routes/auth.mjs';
import usersRoutes from './routes/users.mjs';
import gamesRoutes from './routes/games.mjs';
import tournamentCoreRouter from './routes/tournaments/core.mjs';
import tournamentActionsRouter from './routes/tournaments/actions.mjs';
import adminRouter from './routes/admin/index.mjs';
import puzzlesCoreRouter from './routes/puzzles/core.mjs';
import puzzlesPublicRouter from './routes/puzzles/public.mjs';
import puzzlesSocialRouter from './routes/puzzles/social.mjs';
import engineRoutes from './routes/engine.mjs';
import messagesRoutes from './routes/messages.mjs';
import uploadRoutes from './routes/upload.mjs';
import exportRoutes from './routes/api/export.mjs';
import commentRoutes from './routes/comments.mjs';
import giftsRoutes from './routes/gifts.mjs';
import practiceRoutes from './routes/practice.mjs';
import userLogsRoutes from './routes/userLogs.mjs';
import sitemapRouter from './routes/sitemap.mjs';
import { router as pushAuditRouter } from './routes/pushAudit.mjs';
import avatarRoutes from './routes/avatarRoutes.mjs';
import legacyRoutes from './routes/legacyRoutes.mjs';
import botsRoutes from './routes/bots.mjs';
import tiktokRouter from './routes/api/tiktok.mjs';

import botManager from './services/botManager.mjs';
import { socialAutomationService } from './services/socialAutomationService.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); 
dotenv.config({ path: path.join(__dirname, '..', '.env') }); 

process.on('uncaughtException', (err) => {
  logger.error('[CRITICAL] Uncaught Exception:', err.message, err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// Allow all subdomains of cotuong.xyz for CORS
const corsOptions = {
  origin: (origin, callback) => {
    const isAllowed = !origin || 
                     origin.endsWith('.cotuong.xyz') || 
                     origin === 'https://cotuong.xyz' || 
                     origin === 'http://cotuong.xyz' ||
                     origin.includes('localhost') || 
                     origin.includes('127.0.0.1');
    
    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn(`[CORS] Rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
};

const BOT_UA_REGEX = /facebookexternalhit|facebook|facebot|twitterbot|googlebot|bingbot|linkedinbot|whatsapp|viber|telegrambot|bot|opengraph|node|axios|fetch|crawler|spider|checker|validator|preview|inspect|parse|slurp|yandex/i;

let cachedIndexHtml = null;
let lastIndexReadTime = 0;
const INDEX_CACHE_TTL = 300_000; // 5 minutes
const indexPath = path.join(process.cwd(), 'dist', 'index.html');

const app = express();
app.set('trust proxy', 1);

// --- 🌎 Legacy Path-Based Localization Redirect ---
// Consolidates old /en/, /ja/ URLs to the new subdomain-based structure
app.use((req, res, next) => {
  const path = req.path;
  const langMatch = path.match(/^\/(ar|de|en|es|fi|fr|id|it|ja|km|ko|ms|my|nl|ru|th|vi|zh|zh-tw)\b/i);
  
  if (langMatch) {
    const lang = langMatch[1].toLowerCase();
    const remainingPath = path.substring(lang.length + 1) || '/';
    const host = req.hostname || 'cotuong.xyz';
    const hostParts = host.split('.');
    
    // Determine base domain (strip any existing language subdomain to avoid nesting)
    let baseDomain = host;
    if (SUPPORTED_LANGS.includes(hostParts[0].toLowerCase()) && hostParts.length > 1) {
      baseDomain = hostParts.slice(1).join('.');
    }

    
    // Construct new URL
    const query = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    let newUrl;
    if (lang === 'vi') {
      newUrl = `https://${baseDomain}${remainingPath}${query}`;
    } else {
      newUrl = `https://${lang}.${baseDomain}${remainingPath}${query}`;
    }
    
    // Clean up double slashes
    newUrl = newUrl.replace(/([^:]\/)\/+/g, '$1');
    
    if (path !== remainingPath) {
      logger.info(`[LEGACY_REDIRECT] ${path} -> ${newUrl}`);
      return res.redirect(301, newUrl);
    }
  }
  next();
});


// --- 🌐 Social Crawler Meta Tag Ingester (SEO) ---
// MOVED TO TOP to ensure it runs before ANY other middleware/routes for browser requests
app.use(async (req, res, next) => {
  let workPath = req.path;
  let lang = 'vi';

  // Detect language from Subdomain (e.g., en.cotuong.xyz)
  const host = req.hostname || '';
  const hostParts = host.split('.');
    if (hostParts.length > 1) {
      const subdomain = hostParts[0].toLowerCase();
      if (SUPPORTED_LANGS.includes(subdomain)) {
        lang = subdomain;
      }
    }

  const socialPaths = ['/', '/ai', '/practice', '/puzzles', '/xep-co-the', '/players', '/privacy', '/terms'];
  const isExactMatch = socialPaths.includes(workPath);
  const isPuzzle = workPath.startsWith('/puzzles/') && workPath.length > 9;
  const isGame = workPath.startsWith('/game/') && workPath.length > 6;
  const isPractice = workPath.startsWith('/practice/') && workPath.length > 10;
  const isProfile = (workPath.startsWith('/profile/') && workPath.length > 9) || (workPath.startsWith('/player/') && workPath.length > 8);

  if (!isExactMatch && !isPuzzle && !isGame && !isPractice && !isProfile) {
    logger.debug(`[SEO] Path not in social list: ${req.path}`);
    return next();
  }
  if (req.method !== 'GET') return next();

  // 🚨 CRITICAL: Never inject SEO tags into API responses
  if (req.path.startsWith('/api/')) return next();

  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  
  // 🚨 CRITICAL: Never treat Lighthouse as a bot for SEO tagging
  if (userAgent.includes('lighthouse')) return next();

  const isBot = BOT_UA_REGEX.test(userAgent);
  if (!isBot) return next();

  try {
    const t = (vi, en, zh, ja) => {
      if (lang === 'en') return en || vi;
      if (lang === 'zh') return zh || vi;
      if (lang === 'ja') return ja || vi;
      return vi;
    };

    let title = t(
      'Cờ Tướng Live - Chơi Cờ Tướng Online Miễn Phí',
      'Xiangqi Live - Free Online Chinese Chess',
      '象棋在线 - 免费在线象棋',
      'シャンチーライブ - 無料オンラインシャンチー'
    );
    let description = t(
      'Nền tảng chơi cờ tướng online miễn phí, không quảng cáo. Luyện tập với máy, giải thế cờ và thi đấu cùng hàng ngàn kỳ thủ khác.',
      'Free, ad-free online Xiangqi platform. Practice with AI, solve puzzles, and play with thousands of players.',
      '免费、无广告的在线象棋平台。与AI对弈，挑战残局，并与数千名玩家对战。',
      '無料で広告のないオンラインシャンチープラットフォーム。AIと練習し、パズルを解いて、何千人ものプレイヤーと対戦しましょう。'
    );
    let imageUrl = '';
    let videoUrl = '';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const reqHost = req.headers['x-forwarded-host'] || req.get('host') || 'cotuong.xyz';
    const isLocalHost = reqHost.includes('localhost') || reqHost.includes('127.0.0.1');
    const detectedUrl = isLocalHost ? `http://${reqHost}` : `${protocol}://${reqHost}`;
    const BASE_URL = process.env.PUBLIC_URL || detectedUrl;
    let pageUrl = `${BASE_URL}${req.path}`;

    const getCleanId = (raw) => {
      if (!raw) return '';
      let id = raw.split('-')[0];
      if (id === 'game' || id === 'puzzle') {
        id = raw.split('-')[1] || '';
      }
      return id.replace(/\.(png|jpg|jpeg|webp|mp4)$/i, '');
    };

    if (isPuzzle) {
      const parts = workPath.split('/');
      const rawId = parts[parts.length - 1];
      const uid = getCleanId(rawId);
      const col = await getPuzzlesCol();
      const puzzleData = await col.findOne({ $or: [{ uid: uid }, { 'importedFrom.legacy13CharId': uid }] });
      if (puzzleData) {
        const pzName = puzzleData.name || t('Thế cờ hay', 'Great Puzzle', '经典残局', '素晴らしいパズル');
        title = t(`Cờ tướng: ${pzName}`, `Xiangqi: ${pzName}`, `象棋残局: ${pzName}`, `シャンチー ${pzName}`);
        description = puzzleData.description || t(`Giải thế cờ tướng hay. Cấp độ: ${puzzleData.level || 1}.`, `Solve this Xiangqi puzzle. Level: ${puzzleData.level || 1}.`, `挑战这个象棋残局。难度: ${puzzleData.level || 1}。`, `このシャンチーのパズルを解いてください。レベル: ${puzzleData.level || 1}`);
        imageUrl = `${BASE_URL}/api/export/image/16x9/puzzle/${puzzleData.uid || uid}.webp`;
        
        const solutionsCol = await getPuzzleSolutionsCol();
        const hasSolution = await solutionsCol.findOne({ puzzleId: puzzleData.uid || uid });
        if (hasSolution || (puzzleData.moves && puzzleData.moves.length > 0)) {
           videoUrl = `${BASE_URL}/api/export/video/16x9/puzzle/${puzzleData.uid || uid}.mp4`;
        }
      } else {
        imageUrl = `${BASE_URL}/assets/cover.png`;
      }
    } else if (isGame) {
      const parts = workPath.split('/');
      const rawId = parts[parts.length - 1];
      const id = getCleanId(rawId);
      const gamesCol = await getGamesCol();
      
      const queryArr = [{ _id: id }, { uid: id }, { id: id }];
      if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
        try { 
          const { ObjectId } = await import('mongodb');
          queryArr.push({ _id: new ObjectId(id) }); 
        } catch(e){}
      }
      const gameData = await gamesCol.findOne({ $or: queryArr.filter(q => q._id !== null) });
      if (gameData) {
        const pNames = gameData.state?.playerNames || gameData.playerNames || gameData.players || { red: t('Kỳ thủ','Player','玩家','プレイヤー'), black: t('Kỳ thủ','Player','玩家','プレイヤー') };
        const redName = pNames.red || pNames.redName || t('Kỳ thủ Đỏ','Red Player','红方','紅');
        const blackName = pNames.black || pNames.blackName || t('Kỳ thủ Đen','Black Player','黑方','黒');
        
        const matchTitle = t('Trận đấu cờ tướng', 'Xiangqi Match', '象棋对局', 'シャンチー対局');
        title = `${redName} vs ${blackName} — ${matchTitle}`;
        if (gameData.title) title = `${gameData.title} — ${title}`;
        
        description = t(`Xem lại trận đấu cờ tướng hấp dẫn giữa ${redName} và ${blackName}.`, `Watch the replay of an exciting match between ${redName} and ${blackName}.`, `观看 ${redName} 与 ${blackName} 之间的精彩对局回放。`, `${redName} と ${blackName} のエキサイティングな対局を観戦する。`);
        imageUrl = `${BASE_URL}/api/export/image/16x9/game/${id}.webp`;
        videoUrl = `${BASE_URL}/api/export/video/16x9/game/${id}.mp4`;
      } else {
        imageUrl = `${BASE_URL}/assets/cover.png`;
      }
    } else if (isPractice) {
      const parts = workPath.split('/');
      const slug = getCleanId(parts[parts.length - 1]);
      const lessonsCol = await getPracticeLessonsCol();
      const lesson = await lessonsCol.findOne({ $or: [{ id: slug }, { slug: slug }] });
      if (lesson) {
        title = lesson.title || t('Luyện tập cờ tướng', 'Xiangqi Practice', '象棋练习', 'シャンチーの練習');
        description = lesson.description || t('Luyện tập các kỹ thuật và chiến thuật cờ tướng.', 'Practice Xiangqi techniques and tactics.', '练习象棋技巧和战术。', 'シャンチーのテクニックと戦術を練習する。');
      }
      imageUrl = `${BASE_URL}/og-image.svg`;
    } else if (isProfile) {
      const parts = workPath.split('/');
      const uid = getCleanId(parts[parts.length - 1]);
      const usersCol = await getUsersCol();
      const user = await usersCol.findOne({ $or: [{ uid: uid }, { slug: uid }, { name: uid }] });
      if (user) {
        title = `${user.name || t('Kỳ thủ','Player','玩家','プレイヤー')} — ` + t('Hồ sơ kỳ thủ cờ tướng', 'Xiangqi Player Profile', '象棋玩家主页', 'シャンチープレイヤープロフィール');
        description = user.bio || t(`Xem hồ sơ và thành tích của kỳ thủ ${user.name || ''} tại Cờ tướng Online.`, `View the profile and achievements of ${user.name || ''} on Xiangqi Online.`, `在象棋在线查看玩家 ${user.name || ''} 的个人资料和成就。`, `Xiangqi Onlineで ${user.name || ''} のプロフィールと実績を表示します。`);
        if (user.picture) imageUrl = user.picture;
      }
      if (!imageUrl) imageUrl = `${BASE_URL}/assets/cover.png`;
    } else {
      imageUrl = `${BASE_URL}/assets/cover.png`;
    }

    if (!cachedIndexHtml || (Date.now() - lastIndexReadTime > INDEX_CACHE_TTL)) {
      if (!fs.existsSync(indexPath)) {
          logger.error(`[SocialMeta] index.html missing at ${indexPath}`);
          return next();
      }
      cachedIndexHtml = fs.readFileSync(indexPath, 'utf8');
      lastIndexReadTime = Date.now();
    }

    let html = cachedIndexHtml;
    
    // Clean up all existing dynamic tags
    html = html.replace(/<title>.*?<\/title>/gi, '');
    html = html.replace(/<meta\s+(?:property|name)="og:[^"]*"\s+content="[^"]*"\s*\/?>/gi, '');
    html = html.replace(/<meta\s+content="[^"]*"\s+(?:property|name)="og:[^"]*"\s*\/?>/gi, '');
    html = html.replace(/<meta\s+(?:property|name)="twitter:[^"]*"\s+content="[^"]*"\s*\/?>/gi, '');
    html = html.replace(/<meta\s+content="[^"]*"\s+(?:property|name)="twitter:[^"]*"\s*\/?>/gi, '');
    html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/gi, '');
    html = html.replace(/<meta\s+content="[^"]*"\s+name="description"\s*\/?>/gi, '');

    const allConfig = await getAllConfig();
    const keywords = allConfig['site.keywords'] || '';

    const metaTags = `
      <title>${title}</title>
      <meta name="description" content="${description}" />
      <meta name="keywords" content="${keywords}" />
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="${imageUrl}" />
      <meta property="og:url" content="${pageUrl}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${title}" />
      <meta name="twitter:description" content="${description}" />
      <meta name="twitter:image" content="${imageUrl}" />
      ${videoUrl ? `
      <meta property="og:video" content="${videoUrl}" />
      <meta property="og:video:type" content="video/mp4" />
      <meta name="twitter:card" content="player" />
      <meta name="twitter:player" content="${videoUrl}" />
      <meta name="twitter:player:width" content="1280" />
      <meta name="twitter:player:height" content="720" />
      ` : ''}
    `;
    
    if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/(<head[^>]*>)/i, `$1${metaTags}`);
    } else {
        html = metaTags + html;
    }
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Vary', 'User-Agent');
    res.status(200).set('Content-Type', 'text/html').send(html);
  } catch (err) {
    logger.error('[SocialMeta] Error:', err.message);
    return next();
  }
});

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cors(corsOptions));
app.use(languageDetector);

// --- 📊 Request logging middleware ---
app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json;
  let responseBody = null;

  res.json = function(data) {
    responseBody = data;
    return originalJson.call(this, data);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    const uid = req.user?.uid || 'anonymous';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ua = req.headers['user-agent'] || 'unknown';
    
    const logPrefix = `${req.method} ${req.originalUrl}`;
    const logInfo = {
      status: res.statusCode,
      duration: `${duration}ms`,
      user: uid,
      ip,
      ua: ua.substring(0, 50) + (ua.length > 50 ? '...' : '')
    };

    // 🔍 Deep Debug (visible when DEBUG=true)
    logger.debug(`[REQUEST_DETAILS] ${logPrefix}`, {
      query: req.query,
      body: req.body,
      ...logInfo
    });

    if (res.statusCode >= 400) {
      const errorDetail = responseBody?.error || responseBody?.message || responseBody;
      const level = res.statusCode >= 500 ? 'error' : 'warn';
      logger[level](`[RESPONSE_ERROR] ${logPrefix} ${res.statusCode}`, {
        error: errorDetail,
        response: (res.statusCode >= 500) ? responseBody : undefined,
        ...logInfo
      });
    } else {
      if (req.path !== '/health' && !req.path.startsWith('/uploads')) {
        logger.info(`[SUCCESS] ${logPrefix} ${res.statusCode}`, { 
          duration: logInfo.duration, 
          user: logInfo.user 
        });
      }
    }
  });
  next();
});

// --- 🚀 API Router ---
const apiRouter = express.Router();

apiRouter.use((req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex');
  next();
});

apiRouter.get('/site-settings', async (req, res) => {
  try {
    const cacheKey = 'site:settings:public';
    if (redisClient?.isReady) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) { logger.debug('[REDIS] site-settings miss', e); }
    }

    const all = await getAllConfig();
    const publicKeys = [
      'site.registrationOpen', 'site.guestAllowed', 'site.maintenanceMode', 
      'site.maintenanceMessage', 'site.announcementText', 'site.keywords',
      'chat.enabled', 'chat.globalEnabled', 'chat.roomEnabled', 'elo.ranks',
      'lobby.videoHighlightId'
    ];
    const settings = {};
    publicKeys.forEach(k => settings[k] = all[k]);
    const response = { ok: true, settings };

    if (redisClient?.isReady) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(response));
      } catch (e) { logger.debug('[REDIS] site-settings save failed', e); }
    }
    
    res.json(response);
  } catch (err) {
    logger.error('GET /api/site-settings failed:', err);
    res.status(500).json({ ok: false, error: 'CONFIG_FETCH_FAILED' });
  }
});

apiRouter.use(authRoutes);
apiRouter.use(avatarRoutes);
apiRouter.use(usersRoutes);
apiRouter.use('/games', gamesRoutes);
apiRouter.use(tournamentCoreRouter);
apiRouter.use(tournamentActionsRouter);
apiRouter.use(puzzlesPublicRouter);
apiRouter.use(puzzlesCoreRouter);
apiRouter.use(puzzlesSocialRouter);
apiRouter.use(engineRoutes);
apiRouter.use(messagesRoutes);
apiRouter.use(uploadRoutes);
apiRouter.use('/export', exportRoutes);
apiRouter.use(commentRoutes);
apiRouter.use('/gifts', giftsRoutes);
apiRouter.use('/practice', practiceRoutes);
apiRouter.use(userLogsRoutes);
apiRouter.use(pushAuditRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use(botsRoutes);
apiRouter.use(tiktokRouter);

app.use('/api', apiRouter);
app.use(sitemapRouter);
app.use(legacyRoutes);

// --- 📂 Static Files & Healthy ---
const UPLOADS_ROOT = path.join(getDataRoot(), 'uploads');
app.use('/uploads', express.static(UPLOADS_ROOT));

app.use(express.static(path.join(process.cwd(), 'public')));
app.use(express.static(path.join(process.cwd(), 'dist')));

app.get('/health', async (_req, res) => {
  try {
    const db = await getDb();
    const ping = await db.command({ ping: 1 });
    res.json({ 
      ok: ping.ok === 1 && !!redisClient?.isReady, 
      version: process.env.BUILD_NAME || 'dev',
      uptime: process.uptime(), 
      redis: !!redisClient?.isReady,
      mongodb: ping.ok === 1
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Serve SPA index.html for all other routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  const isAsset = /\.(js|css|png|jpg|ico|svg|mp4|html)$/.test(req.path);
  if (isAsset) return res.status(404).send('Not Found');
  res.sendFile(indexPath);
});

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  logger.info(`[Server] 🚀 Listening on port :${PORT}`);
  botManager.init().catch(err => logger.error('[BotManager] Init failed:', err.message));
  socialAutomationService.init().catch(err => logger.error('[SocialService] Init failed:', err.message));
});
