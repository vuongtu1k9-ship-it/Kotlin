import express from 'express';
import { getPuzzlesCol, getUsersCol, getPracticeLessonsCol, getGamesCol, getDb } from '../mongo.mjs';
import { logger } from '../logger.mjs';
import { makeSlug } from '../utils/slug.mjs';

const router = express.Router();
const BASE_URL = 'https://cotuong.xyz';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function formatUrl(path, priority = '0.5', freq = 'weekly', image = null) {
  let imgXml = '';
  if (image) {
    imgXml = `
    <image:image>
      <image:loc>${escapeXml(image.url)}</image:loc>
      <image:title><![CDATA[${image.title}]]></image:title>
    </image:image>`;
  }

  const safePath = path === '/' ? '' : path;
  
  // Base domain logic
  const domain = 'cotuong.xyz';
  
  // Default (x-default and vi) point to apex domain
  let altLinks = `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml('https://' + domain + path)}" />`;
  altLinks += `\n    <xhtml:link rel="alternate" hreflang="vi" href="${escapeXml('https://' + domain + path)}" />`;
  
  // All supported languages (excluding vi which is the apex)
  const langs = ['ar', 'de', 'en', 'es', 'fi', 'fr', 'id', 'it', 'ja', 'km', 'ko', 'ms', 'my', 'nl', 'ru', 'th', 'zh', 'zh-TW'];
  
  for(const lang of langs) {
    altLinks += `\n    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml('https://' + lang.toLowerCase() + '.' + domain + path)}" />`;
  }

  return `  <url>
    <loc>${escapeXml('https://' + domain + path)}</loc>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>${imgXml}${altLinks}
  </url>`;
}

const PUZZLES_PER_PAGE = 1000;

router.get('/sitemap.xml', async (req, res) => {
  const { type, page } = req.query;
  const ua = req.headers['user-agent'] || '';
  const isBot = /googlebot|bingbot/i.test(ua);
  
  if (isBot || type) {
    logger.info(`[SITEMAP_HIT] Type=${type || 'index'}, Page=${page || 1}, Bot=${isBot}, IP=${req.ip}, UA=${ua.substring(0, 50)}`);
  }

  try {
    if (type === 'main') return serveMain(req, res);
    if (type === 'puzzles') return servePuzzlesPage(req, res, parseInt(page) || 1);
    if (type === 'games') return serveGames(req, res);
    if (type === 'players') return servePlayers(req, res);
    if (type === 'content') return serveContent(req, res);

    await serveIndex(req, res);
  } catch (e) {
    logger.error(`Sitemap error (type=${type}):`, e);
    res.status(500).send('Error');
  }
});

async function serveIndex(req, res) {
  const puzzlesCol = await getPuzzlesCol();
  const totalPuzzles = await puzzlesCol.countDocuments();
  const puzzlePages = Math.ceil(totalPuzzles / PUZZLES_PER_PAGE);
  
  let puzzleSitemaps = '';
  for (let i = 1; i <= puzzlePages; i++) {
    puzzleSitemaps += `  <sitemap>
    <loc>${BASE_URL}/sitemap.xml?type=puzzles&amp;page=${i}</loc>
  </sitemap>\n`;
  }

  const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap.xml?type=main</loc>
  </sitemap>
${puzzleSitemaps}  <sitemap>
    <loc>${BASE_URL}/sitemap.xml?type=games</loc>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap.xml?type=players</loc>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap.xml?type=content</loc>
  </sitemap>
</sitemapindex>`;

  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.send(index.trim());
}

function serveMain(req, res) {
  const urls = [
    formatUrl('/', '1.0', 'daily'),
    formatUrl('/lobby', '0.9', 'daily'),
    formatUrl('/tournaments', '0.8', 'daily'),
    formatUrl('/puzzles', '0.8', 'daily'),
    formatUrl('/practice', '0.7', 'weekly'),
    formatUrl('/players', '0.7', 'daily'),
    formatUrl('/how-to-play', '0.7', 'monthly'),
    formatUrl('/shop', '0.6', 'weekly'),
    formatUrl('/terms', '0.3', 'yearly'),
    formatUrl('/privacy', '0.3', 'yearly'),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml.trim());
}

async function servePuzzlesPage(req, res, page = 1) {
  const puzzlesCol = await getPuzzlesCol();
  const puzzles = await puzzlesCol.find({}, { 
    projection: { uid: 1, name: 1 }, 
    sort: { createdAt: -1 }, 
    skip: (page - 1) * PUZZLES_PER_PAGE,
    limit: PUZZLES_PER_PAGE 
  }).toArray();
  
  const urls = puzzles.map(p => {
    const slug = makeSlug(p.name || '', p.uid);
    const puzzleId = p.uid;
    const image = {
      url: `${BASE_URL}/uploads/co-the/1260x630/${puzzleId}.webp`,
      title: p.name || `Thế cờ ${puzzleId}`
    };
    return formatUrl(`/puzzles/${slug}`, '0.6', 'monthly', image);
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml.trim());
}

async function serveGames(req, res) {
  const gamesCol = await getGamesCol();
  const docs = await gamesCol.find(
    { 'state.finished': true },
    { projection: { id: 1, _id: 1, playerUids: 1, 'state.playerUids': 1, 'state.playerNames': 1, puzzleName: 1, 'state.puzzleName': 1 }, sort: { updatedAt: -1 }, limit: 1000 }
  ).toArray();
  
  const uidsToFetch = new Set();
  docs.forEach(d => {
    const ps = d.playerUids || d.state?.playerUids || {};
    if (ps.red) uidsToFetch.add(String(ps.red));
    if (ps.black) uidsToFetch.add(String(ps.black));
  });
  
  const playerMap = new Map();
  if (uidsToFetch.size > 0) {
    const usersCol = await getUsersCol();
    const users = await usersCol.find({ uid: { $in: Array.from(uidsToFetch) } }, { projection: { uid: 1, name: 1 } }).toArray();
    users.forEach(u => playerMap.set(String(u.uid), u.name));
  }

  const urls = docs.map(d => {
    const ps = d.playerUids || d.state?.playerUids || {};
    const redName = d.state?.playerNames?.red || playerMap.get(String(ps.red)) || 'player';
    const blackName = d.state?.playerNames?.black || playerMap.get(String(ps.black)) || 'player';
    const displayName = d.puzzleName || d.state?.puzzleName || `${redName}-vs-${blackName}`;
    const slug = makeSlug(displayName, d.id || String(d._id));
    return formatUrl(`/game/${slug}`, '0.4', 'monthly');
  });
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml.trim());
}

async function servePlayers(req, res) {
  const usersCol = await getUsersCol();
  const users = await usersCol.find({ name: { $exists: true } }, { projection: { uid: 1, name: 1 }, limit: 1000 }).toArray();
  const urls = users.map(u => {
    const slug = makeSlug(u.name || '', u.uid);
    return formatUrl(`/player/${slug}`, '0.5', 'weekly');
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml.trim());
}

async function serveContent(req, res) {
  const urls = [];
  const lessonsCol = await getPracticeLessonsCol();
  const lessons = await lessonsCol.find({}, { projection: { id: 1, slug: 1, categorySlug: 1 } }).toArray();
  lessons.forEach(l => {
    const lessonSlug = l.slug || l.id;
    const catSlug = l.categorySlug || 'bai-hoc';
    urls.push(formatUrl(`/practice/${catSlug}/${lessonSlug}`, '0.5', 'monthly'));
  });
  
  const db = await getDb();
  const tournaments = await db.collection('tournaments').find({}, { projection: { id: 1 }, sort: { createdAt: -1 }, limit: 100 }).toArray();
  tournaments.forEach(t => urls.push(formatUrl(`/tournament/${t.id}`, '0.7', 'weekly')));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml.trim());
}

export default router;
