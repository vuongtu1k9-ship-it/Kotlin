import express from 'express';
import { socialAutomationService } from '../../services/socialAutomationService.mjs';
import { requireAdmin } from '../../utils/auth.mjs';
import { logger } from '../../logger.mjs';
import { getDb } from '../../mongo.mjs';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import multer from 'multer';
import { getConfig, setConfig } from '../../services/siteConfig.mjs';
import { AiGeneratorService } from '../../services/aiGenerator.mjs';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

const router = express.Router();

router.use(requireAdmin);

/**
 * Get social media status and history
 */
router.get('/status', async (req, res) => {
  try {
    const db = await getDb();
    const history = await db.collection('social_history')
      .find({})
      .sort({ postedAt: -1, createdAt: -1 })
      .limit(50)
      .toArray();

    // Check Facebook token status
    let facebookStatus = 'unknown';
    const fbToken = await getConfig('facebook.appToken');
    if (fbToken) {
      try {
        const fbRes = await axios.get(`https://graph.facebook.com/v18.0/me?access_token=${fbToken}`);
        facebookStatus = 'connected';
      } catch (e) {
        facebookStatus = 'expired';
      }
    } else {
      facebookStatus = 'missing';
    }

    res.json({
      ok: true,
      history,
      serviceStatus: socialAutomationService.interval ? 'running' : 'stopped',
      platformStatus: {
        facebook: facebookStatus,
        youtube: (await getConfig('google.refreshToken')) ? 'connected' : 'missing',
        tiktok: (await getConfig('tiktok.refreshToken')) ? 'connected' : 'missing',
        instagram: (await getConfig('instagram.userId')) ? 'connected' : 'missing',
        x: (await getConfig('twitter.apiKey')) ? 'connected' : 'missing'
      },
      prompt: await getConfig('social.prompt')
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * Update Social AI Prompt
 */
router.post('/prompt', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ ok: false, error: 'MISSING_PROMPT' });
    
    await setConfig('social.prompt', prompt);
    res.json({ ok: true, message: 'PROMPT_UPDATED' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * AI Suggestion for Prompt
 */
router.post('/prompt/suggest', async (req, res) => {
  try {
    const { currentPrompt } = req.body;
    const ai = AiGeneratorService.getInstance();
    
    const metaPrompt = `Bạn là một chuyên gia về AI Prompt Engineering và Social Media Marketing. 
Dưới đây là một Prompt hiện tại dùng để tạo bài đăng mạng xã hội cho kênh Cờ Tướng (Xiangqi).
Hãy phân tích và viết lại một bản Prompt HIỆU QUẢ HƠN, tập trung vào việc tạo tiêu đề thu hút (Clickbait sạch) và nội dung tăng tương tác.

YÊU CẦU CHO PROMPT MỚI:
1. Phải giữ lại các placeholder: {{type_vn}}, {{name}}, {{description}}, {{extra_info}}, {{url}}.
2. Phải yêu cầu đầu ra là JSON với cấu trúc: {"title": "...", "content": "..."}.
3. Tối ưu ngôn ngữ để AI hiểu rõ hơn về ngữ cảnh Cờ Tướng chuyên nghiệp.
4. Thêm các chỉ dẫn về tone of voice (ví dụ: hào hứng, chuyên sâu, hoặc hài hước tùy lựa chọn).

PROMPT HIỆN TẠI:
"""
${currentPrompt || await getConfig('social.prompt')}
"""

Hãy chỉ trả về nội dung PROMPT MỚI, không kèm lời giải thích.`;

    const suggestedPrompt = await ai.generateSimpleCompletion(metaPrompt);
    res.json({ ok: true, suggestedPrompt: suggestedPrompt.trim() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * Manual post
 */
router.post('/post', upload.single('media'), async (req, res) => {
  try {
    let { content, platforms, scheduledAt } = req.body;
    
    // Multer puts fields in req.body, but if it was sent as JSON it would be there too.
    // When using FormData, platforms might be a string (JSON stringified array)
    if (typeof platforms === 'string') {
      try {
        platforms = JSON.parse(platforms);
      } catch (e) {
        platforms = [platforms];
      }
    }

    if (!content || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ ok: false, error: 'MISSING_DATA' });
    }

    if (scheduledAt) {
      // Logic for scheduling would go here (e.g., adding to a job queue)
      // For now, let's just log it
      const db = await getDb();
      await db.collection('social_history').insertOne({
        content,
        platforms,
        status: 'scheduled',
        scheduledAt: new Date(scheduledAt),
        createdAt: new Date(),
        type: 'manual'
      });
      return res.json({ ok: true, message: 'POST_SCHEDULED' });
    }

    // Immediate post
    let mediaData = null;
    if (req.file) {
      mediaData = {
        buffer: req.file.buffer,
        type: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
        mimetype: req.file.mimetype
      };
    }

    const results = await socialAutomationService.postManual(content, platforms, mediaData);
    
    const success = Object.values(results).some(v => v !== null);
    
    if (success) {
      res.json({ ok: true, results });
    } else {
      res.status(500).json({ ok: false, error: 'POST_FAILED_ON_ALL_PLATFORMS', results });
    }
  } catch (e) {
    logger.error('POST /admin/social/post failed:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * Manual post for a specific game
 */
router.post('/post-game/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`[AdminSocial] ⚔️ Triggering manual post for game: ${id}`);
    const results = await socialAutomationService.postGameById(id);
    res.json({ ok: true, results });
  } catch (e) {
    logger.error(`POST /post-game/${req.params.id} failed:`, e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * Manual post for a specific puzzle
 */
router.post('/post-puzzle/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`[AdminSocial] 🧩 Triggering manual post for puzzle: ${id}`);
    const results = await socialAutomationService.postPuzzleById(id);
    res.json({ ok: true, results });
  } catch (e) {
    logger.error(`POST /post-puzzle/${req.params.id} failed:`, e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * Exchange short-lived User Token for permanent Page Token
 */
router.post('/exchange-token', async (req, res) => {
  try {
    const { userToken } = req.body;
    if (!userToken) return res.status(400).json({ ok: false, error: 'MISSING_USER_TOKEN' });

    const appId = await getConfig('facebook.appId');
    const appSecret = await getConfig('facebook.appSecret');
    const pageId = await getConfig('facebook.pageId');

    logger.info(`[SocialAdmin] 🔑 Exchanging Facebook token for Page ID: ${pageId}`);

    // 1. Get Long-lived User Token (60 days)
    const exchangeRes = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: userToken
      }
    });

    const longLivedUserToken = exchangeRes.data.access_token;
    if (!longLivedUserToken) throw new Error('Failed to get long-lived user token');

    // 2. Get Page Access Tokens (Permanent for Pages)
    const accountsRes = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: { access_token: longLivedUserToken }
    });

    const accounts = accountsRes.data.data;
    const pageAccount = accounts.find(a => a.id === pageId);

    if (!pageAccount) {
      return res.status(404).json({ 
        ok: false, 
        error: 'PAGE_NOT_FOUND_IN_USER_ACCOUNTS',
        availablePages: accounts.map(a => ({ id: a.id, name: a.name }))
      });
    }

    const permanentPageToken = pageAccount.access_token;

    // 3. Save to config
    // Note: Since facebook.appToken is usually in ENV, we might need to update .env
    // or use setConfig if it's allowed.
    // In siteConfig.mjs, ENV_MAP keys are read-only for setConfig.
    // So we should update the .env file directly if possible.
    
    const envPath = path.join(process.cwd(), '.env');
    let envContent = await fs.promises.readFile(envPath, 'utf8');
    
    if (envContent.includes('FB_PAGE_TOKEN=')) {
        envContent = envContent.replace(/FB_PAGE_TOKEN=.*/, `FB_PAGE_TOKEN="${permanentPageToken}"`);
    } else {
        envContent += `\nFB_PAGE_TOKEN="${permanentPageToken}"\n`;
    }
    
    await fs.promises.writeFile(envPath, envContent);
    
    // Also update current process.env for immediate effect
    process.env.FB_PAGE_TOKEN = permanentPageToken;

    logger.info(`[SocialAdmin] ✅ Successfully updated permanent Facebook Page Token for ${pageAccount.name}`);

    res.json({ 
      ok: true, 
      pageName: pageAccount.name,
      message: 'PERMANENT_TOKEN_SAVED' 
    });
  } catch (e) {
    logger.error('Token exchange failed:', e.response?.data || e.message);
    res.status(500).json({ ok: false, error: e.message, details: e.response?.data });
  }
});

/**
 * Delete a post from history and social platforms
 */
router.delete('/post/:id', async (req, res) => {
  try {
    const db = await getDb();
    const post = await db.collection('social_history').findOne({ _id: new ObjectId(req.params.id) });
    if (!post) return res.status(404).json({ ok: false, error: 'POST_NOT_FOUND' });

    // Try to delete from platforms
    const deleteTasks = [];
    if (post.results?.facebook) deleteTasks.push(socialAutomationService.deleteFacebookPost(post.results.facebook));
    if (post.results?.youtube) deleteTasks.push(socialAutomationService.deleteYoutubeVideo(post.results.youtube));
    
    await Promise.allSettled(deleteTasks);

    // Remove from history
    await db.collection('social_history').deleteOne({ _id: post._id });

    res.json({ ok: true, message: 'POST_DELETED' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * Get aggregated stats for dashboard
 */
router.get('/summary', async (req, res) => {
    try {
        const db = await getDb();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        const monthlyData = await db.collection('social_history')
          .find({ postedAt: { $gte: firstOfMonth } })
          .toArray();

        const counts = { facebook: 0, youtube: 0, tiktok: 0, instagram: 0, x: 0 };
        monthlyData.forEach(p => {
          if (p.results?.facebook) counts.facebook++;
          if (p.results?.youtube) counts.youtube++;
          if (p.results?.tiktok) counts.tiktok++;
          if (p.results?.instagram) counts.instagram++;
          if (p.results?.x) counts.x++;
        });

        // Daily post counts for the last 14 days
        const dailyData = {};
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            dailyData[dateStr] = 0;
        }

        const posts = await db.collection('social_history')
            .find({ postedAt: { $gte: thirtyDaysAgo } })
            .toArray();

        posts.forEach(p => {
            const dateStr = new Date(p.postedAt || p.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            if (dailyData[dateStr] !== undefined) {
                dailyData[dateStr]++;
            }
        });

        const chartData = Object.entries(dailyData).map(([date, count]) => ({ date, count }));

        const summary = {
            totalPosts: posts.length,
            platforms: counts,
            chartData
        };

        res.json({ ok: true, summary });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

/**
 * Fetch fresh stats for a specific post
 */
router.get('/stats/:id', async (req, res) => {
    try {
        const db = await getDb();
        const post = await db.collection('social_history').findOne({ _id: new ObjectId(req.params.id) });
        if (!post) return res.status(404).json({ ok: false, error: 'POST_NOT_FOUND' });

        const stats = {};
        if (post.results?.facebook) stats.facebook = await socialAutomationService.getFacebookStats(post.results.facebook);
        
        for (const [platform, id] of Object.entries(post.results || {})) {
          switch (platform) {
            case 'youtube':
              stats.youtube = await socialAutomationService.getYoutubeStats(id);
              break;
            case 'instagram':
              stats.instagram = await socialAutomationService.getInstagramStats(id);
              break;
            case 'x':
              // stats.x = await socialAutomationService.getXStats(id);
              break;
          }
        }

        res.json({ ok: true, stats });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

export default router;
