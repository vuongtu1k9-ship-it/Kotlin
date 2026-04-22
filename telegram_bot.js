const { Telegraf } = require("telegraf");
const { readFileSync, existsSync } = require("fs");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const DIARY_PATH = "/root/.openclaw/workspace/Diary.md";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "-1003647318348";

// Read last N lines from Diary.md
function getDiarySlice(lines = 30) {
  try {
    if (!existsSync(DIARY_PATH)) return "Diary.md not found";
    const content = readFileSync(DIARY_PATH, "utf8");
    const all = content.split("\n").filter(l => l.trim());
    return all.slice(-lines).join("\n");
  } catch (e) {
    return "Error reading Diary: " + e.message;
  }
}

// Send Diary snapshot every 5 minutes
setInterval(() => {
  const diary = getDiarySlice(40);
  bot.telegram.sendMessage(CHAT_ID, "📅 Agent Diary (last 40 lines):\n\n" + diary);
}, 5 * 60 * 1000);

// Command handlers
bot.start((ctx) => ctx.reply("Flutter Agent System running. Use /diary to see latest logs."));
bot.help((ctx) => ctx.reply("Commands: /diary - show logs, /spec - show SPEC, /status - project status"));

bot.command("diary", (ctx) => {
  const diary = getDiarySlice(50);
  ctx.reply("📋 DIARY:\n\n" + diary);
});

bot.command("spec", (ctx) => {
  const spec = existsSync("/root/.openclaw/workspace/SPEC.md") 
    ? readFileSync("/root/.openclaw/workspace/SPEC.md", "utf8").slice(0, 3000)
    : "SPEC.md not found";
  ctx.reply("📐 SPEC:\n\n" + spec);
});

bot.command("status", (ctx) => {
  const status = `Flutter Project Status:
  
✅ SDK: Installed
⚠️  Build: Blocked (root user)
📝 Diary: ${existsSync(DIARY_PATH) ? "Active" : "Missing"}
📊 SPEC: ${existsSync("/root/.openclaw/workspace/SPEC.md") ? "Defined" : "Pending"}`;
  ctx.reply(status);
});

bot.launch().then(() => console.log("Telegram Bot (Diary) running..."));
