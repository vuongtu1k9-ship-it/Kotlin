import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const userToken = "EAAKUSvXi6x4BRO32S7ZAVE30DM8JYZBoyO6XyY8z46d4Jc6c67ahnBngLmrqgbur8p098KiCQ7lffJSRFZC0OSXvwETysKRCCyNsfZBKR2WsklJ5covZBUqtufzFzbK1dxn2qOiyFJxRGsro8gZBu1VOe7fiJzoBE6sK7lcBUypsBuilrSZCwEgpQ91ZCrW1qCt9NTV6VfODwcv7x8wDKjrxzYaH6Qn7ZCJNJQ8pYPYUZBag1H4ij1Bt0hfu6wuyxdFBWHnUmHtkbbu1sRnZCQJuKLLdmF6rvFidMRZBj05ZC6gZDZD";
const appId = "725999627201310";
const appSecret = "33dda3353405580e5cb06b427bb46948";
const pageId = "2336479353252465"; // Actual page ID found in account

async function exchange() {
    console.log('🔄 Exchanging Facebook token...');
    try {
        // 1. Get Long-lived User Token
        const res1 = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: appId,
                client_secret: appSecret,
                fb_exchange_token: userToken
            }
        });
        const longLivedUserToken = res1.data.access_token;
        console.log('✅ Got long-lived user token.');

        // 2. Get Page Token
        const res2 = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
            params: { access_token: longLivedUserToken }
        });
        const accounts = res2.data.data;
        const page = accounts.find(a => a.id === pageId);

        if (!page) {
            console.error('❌ Page not found in accounts:', accounts.map(a => ({ name: a.name, id: a.id })));
            return;
        }

        const permanentPageToken = page.access_token;
        console.log(`✅ Got permanent page token for: ${page.name}`);

        // 3. Update .env
        const envPath = path.join(process.cwd(), '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        if (envContent.includes('FB_PAGE_TOKEN=')) {
            envContent = envContent.replace(/FB_PAGE_TOKEN=.*/, `FB_PAGE_TOKEN="${permanentPageToken}"`);
        } else {
            envContent += `\nFB_PAGE_TOKEN="${permanentPageToken}"\n`;
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log('🚀 Permanent token saved to .env!');

    } catch (err) {
        console.error('❌ Exchange failed:', err.response?.data || err.message);
    }
}

exchange();
