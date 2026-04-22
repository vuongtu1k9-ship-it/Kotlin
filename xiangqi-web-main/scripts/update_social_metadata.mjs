import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const {
    FB_PAGE_TOKEN,
    FB_APP_ID,
    FB_APP_SECRET,
    PUBLIC_URL
} = process.env;

const BRAND_NAME = "Cờ Tướng XYZ";
const DESCRIPTION = "Cờ Tướng XYZ - Nền tảng chơi cờ tướng chuyên nghiệp. Trải nghiệm đỉnh cao trí tuệ với giao diện hiện đại, engine phân tích mạnh mẽ và cộng đồng kỳ thủ đông đảo.";
const TOS_URL = `${PUBLIC_URL}/terms`;
const PRIVACY_URL = `${PUBLIC_URL}/privacy`;
const CONTACT_EMAIL = "support@cotuong.xyz";

async function updateFacebookPage() {
    console.log("--- Updating Facebook Page ---");
    try {
        const response = await axios.post(`https://graph.facebook.com/v19.0/me`, {
            about: BRAND_NAME,
            description: DESCRIPTION,
            website: PUBLIC_URL,
            access_token: FB_PAGE_TOKEN
        });
        console.log("FB Page Update Success:", response.data);
    } catch (error) {
        console.error("FB Page Update Error:", error.response?.data || error.message);
    }
}

async function updateFacebookApp() {
    console.log("\n--- Updating Facebook App Settings ---");
    // App updates require an App Access Token: app_id|app_secret
    const appAccessToken = `${FB_APP_ID}|${FB_APP_SECRET}`;
    try {
        const response = await axios.post(`https://graph.facebook.com/v19.0/${FB_APP_ID}`, {
            privacy_url: PRIVACY_URL,
            terms_of_service_url: TOS_URL,
            contact_email: CONTACT_EMAIL,
            access_token: appAccessToken
        });
        console.log("FB App Update Success:", response.data);
    } catch (error) {
        console.error("FB App Update Error:", error.response?.data || error.message);
    }
}

async function main() {
    await updateFacebookPage();
    await updateFacebookApp();
}

main();
