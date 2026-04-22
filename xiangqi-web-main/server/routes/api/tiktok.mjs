import express from 'express';
import axios from 'axios';
import { logger } from '../../logger.mjs';
import { getConfig } from '../../services/siteConfig.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get('/oauth/tiktok/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send('Missing code');
  }

  try {
    const clientKey = await getConfig('tiktok.clientKey');
    const clientSecret = await getConfig('tiktok.clientSecret');

    logger.info(`[TikTok] Exchanging code for token...`);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const redirectUri = `${protocol}://${host}/api/oauth/tiktok/callback`;

    logger.info(`[TikTok] Exchanging code for token with redirect_uri: ${redirectUri}`);

    const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', 
      new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      }), 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const data = response.data;
    if (data.access_token) {
      logger.info('[TikTok] Token exchange successful!');
      
      // Update .env file with the refresh token
      const envPath = path.join(__dirname, '../../..', '.env');
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      const refreshToken = data.refresh_token;
      
      if (envContent.includes('TIKTOK_REFRESH_TOKEN=')) {
        envContent = envContent.replace(/TIKTOK_REFRESH_TOKEN=.*/, `TIKTOK_REFRESH_TOKEN="${refreshToken}"`);
      } else {
        envContent += `\nTIKTOK_REFRESH_TOKEN="${refreshToken}"`;
      }
      
      fs.writeFileSync(envPath, envContent);
      logger.info('[TikTok] Updated .env with new refresh token.');

      return res.send('<h1>TikTok Authorized Successfully!</h1><p>You can close this window now. The refresh token has been saved to the server.</p>');
    } else {
      logger.error('[TikTok] Token exchange failed:', data);
      return res.status(500).json(data);
    }
  } catch (err) {
    logger.error('[TikTok] Error during token exchange:', err.response?.data || err.message);
    return res.status(500).send('Token exchange error');
  }
});

export default router;
