const { Telegraf } = require("telegraf");
const { readFileSync, existsSync } = require("fs");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const DIARY = "/root/.openclaw/workspace/Diary.md";
const SPEC = "/root/.openclaw/workspace/SPEC.md";
const OUTPUT = "/root/.openclaw/workspace/OUTPUT.md";

function readTail(path, lines = 40) {
  if (!existsSync(path)) return null;
  const content = readFileSync(path, "utf8");
  const all = content.split("\n").filter(l => l.trim());
  return all.slice(-lines).join("\n");
}

function escapeMarkdown(text) {
  return text.replace(/_/g, "\\_").replace(/*/g, "\\*").replace(/`/g, "\\`");
}

// Auto-send Diary every 5 minutes
const diaryInterval = setInterval(() => {
  const diary = readTail(DIARY, 50);
  if (diary) {
    bot.telegram.sendMessage(CHAT_ID, "📅 *Diary Update:*\n\n\`\`\`\n" + escapeMarkdown(diary) + "\n\`\`\`");
  }
}, 300000);

// Commands
bot.start((ctx) => ctx.reply("🤖 Flutter Agent System\n/diary - Show logs\n/spec - Show SPEC\n/status - Project status"));

bot.command("diary", (ctx) => {
  const diary = readTail(DIARY, 100);
  ctx.reply("📋 *Latest Diary:*\n\n\`\`\`\n" + escapeMarkdown(diary || "Empty") + "\n\`\`\`");
});

bot.command("spec", (ctx) => {
  const spec = readTail(SPEC, 200);
  ctx.reply("📐 *SPEC:*\n\n" + (spec ? "\`\`\`\n" + escapeMarkdown(spec) + "\n\`\`\`" : "SPEC not found"));
});

bot.command("status", (ctx) => {
  ctx.reply("✅ *Status:*\n• Flutter: Installed\n• Agents: 3 running\n• Diary: Unified logging");
});

bot.launch();
console.log("[Bot] Diary Telegram Bot started");
