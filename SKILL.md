# Telegram Bot Agent

## Mô tả
Agent này sử dụng `communicate.js` để gửi/nhận tin nhắn từ Telegram và xử lý trò chơi **Xiangqi** (Cờ Tướng).

## Cấu hình
1. **Cài đặt dependencies**:
   ```bash
   cd /root/Kotlin/telegram-bot-agent/
   npm install telegraf
   ```

2. **Tạo file `agent.js`**:
   ```javascript
   const { Telegraf } = require('telegraf');
   const { communicate } = require('./communicate');

   const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

   bot.on('text', async (ctx) => {
       const message = ctx.message.text;
       const response = await communicate(message);
       await ctx.reply(response);
   });

   bot.launch().then(() => {
       console.log('Telegram Bot is running...');
   });
   ```

3. **Tạo file `communicate.js`**:
   ```javascript
   async function communicate(message) {
       if (message.toLowerCase().includes("xin chào")) {
           return "Xin chào! Tôi là bot Xiangqi. Gõ /start để bắt đầu trò chơi.";
       } else if (message.toLowerCase().includes("/start")) {
           return "=== CỜ TƯỚNG ===\nNhập nước đi theo định dạng: [hàng nguồn][cột nguồn]-[hàng đích][cột đích]\nVí dụ: 9a-8a";
       } else if (message.match(/^\d[a-i]-\d[a-i]$/)) {
           return `Đã nhận nước đi: ${message}. Đang xử lý...`;
       } else {
           return "Tôi không hiểu. Gõ /start để bắt đầu trò chơi.";
       }
   }

   module.exports = { communicate };
   ```

4. **Chạy agent**:
   ```bash
   TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN" node agent.js
   ```

## Yêu cầu
- **Node.js** (v16+).
- **Telegram Bot Token** (lấy từ [BotFather](https://t.me/BotFather)).