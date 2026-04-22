import dotenv from 'dotenv';
dotenv.config();
import { sendEmail } from './server/services/emailService.mjs';

async function test() {
    console.log("Testing Email Integration...");
    try {
        await sendEmail({
            to: 'choicotuongtoday@gmail.com',
            subject: '🔔 Cờ Tướng XYZ - Test Email Integration',
            text: 'Xin chào, đây là email kiểm tra hệ thống tích hợp mới của Cờ Tướng XYZ.',
            html: '<h1>Cờ Tướng XYZ</h1><p>Hệ thống email đã được tích hợp thành công!</p>'
        });
        console.log("✅ Test email sent successfully!");
    } catch (error) {
        console.error("❌ Test email failed:", error.message);
    }
}

test();
