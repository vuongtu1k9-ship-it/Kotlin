// /root/Kotlin/telegram-bot-agent/agent.js
const { Telegraf } = require('telegraf');
const { communicate } = require('/.openclaw/agents/shared/communicate');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.on('text', async (ctx) => {
    const message = ctx.message.text;
    const response = await communicate(message);
    await ctx.reply(response);
});

bot.launch().then(() => {
    console.log('Telegram Bot is running...');
});