import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBotsCol, toQueryId } from '../mongo.mjs';
import { logger } from '../logger.mjs';
import { getConfig } from './siteConfig.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOT_SCRIPT_PATH = path.join(__dirname, '../bot/index.mjs');

class BotManager {
  constructor() {
    this.processes = new Map(); // id -> child process
    this.checkInterval = null;
    this.isSyncing = false;
  }

  async init() {
    logger.info('[BOT_MGR] Background synchronization service initialized (60s interval)');
    await this.syncBots();
    
    // Check every minute for active/rest schedules
    this.checkInterval = setInterval(() => this.syncBots(), 60 * 1000);
  }

  async syncBots() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const botsCol = await getBotsCol();

      // ─── BUG FIX: cũng cần kill process của bots đã bị STOP trong admin ───
      // Query tất cả bots để detect stopped bots còn process đang chạy
      const allBots = await botsCol.find({}).toArray();
      const stoppedWithProcess = allBots.filter(
        b => b.status === 'stopped' && this.processes.has(b._id.toString())
      );
      for (const bot of stoppedWithProcess) {
        logger.warn(`[BOT_MGR] Bot "${bot.name}" (${bot._id}) has status=stopped but process is still alive. Killing now.`);
        this.stopBotProcess(bot._id);
      }

      const bots = allBots.filter(b => b.status === 'running' || b.status === 'resting');
      if (bots.length === 0 && this.processes.size === 0) {
        // Nothing to do
        return;
      }

      const now = new Date();
      // Đọc giới hạn bot từ cấu hình admin (mặc định 6 nếu chưa cài đặt)
      const MAX_ACTIVE_BOTS = (await getConfig('bot.maxConcurrent')) ?? 6;

      // 1. Process bots that should STOP (exceeded active time)
      for (const bot of bots) {
        if (bot.status === 'running') {
          const lastStatusChange = bot.lastStatusChange || bot.updatedAt || now;
          const diffMinutes = (now - new Date(lastStatusChange)) / (1000 * 60);

          if (bot.activeMinutes && diffMinutes >= (bot.activeMinutes + (bot.jitterActive || 0))) {
            logger.info(`[BOT_MGR] Bot "${bot.name}" exceeded active time (${diffMinutes.toFixed(1)}m >= ${bot.activeMinutes + (bot.jitterActive || 0)}m). Moving to resting.`);
            this.stopBotProcess(bot._id);
            await this.updateBotStatus(bot._id, 'resting');
            bot.status = 'resting';
          }
        }
      }

      // 2. Count current active processes
      const runningBots = bots.filter(b => b.status === 'running' && this.processes.has(b._id.toString()));
      let activeCount = runningBots.length;

      // 3. Process bots that should START (rested enough)
      const waitlist = bots
        .filter(b => b.status === 'resting')
        .filter(b => {
          const lastStatusChange = b.lastStatusChange || b.updatedAt || now;
          const diffMinutes = (now - new Date(lastStatusChange)) / (1000 * 60);
          const threshold = (b.restMinutes || 0) + (b.jitterRest || 0);
          return diffMinutes >= threshold;
        })
        .sort((a, b) => {
          const lastChangeA = new Date(a.lastStatusChange || 0).getTime();
          const lastChangeB = new Date(b.lastStatusChange || 0).getTime();
          return lastChangeA - lastChangeB; // Longest resting first
        });

      for (const bot of waitlist) {
        if (activeCount < MAX_ACTIVE_BOTS) {
          logger.info(`[BOT_MGR] Bot "${bot.name}" finished resting. Starting process (slot ${activeCount + 1}/${MAX_ACTIVE_BOTS}).`);
          await this.updateBotStatus(bot._id, 'running');
          bot.status = 'running'; // UPDATE LOCAL STATUS
          this.startBotProcess(bot);
          activeCount++;
        } else {
          logger.info(`[BOT_MGR] Bot "${bot.name}" ready to run but pool full (${activeCount}/${MAX_ACTIVE_BOTS}). Will retry next cycle.`);
          break;
        }
      }

      // 4. Ensure running bots have processes (protection against crashes)
      const shouldRun = bots.filter(b => b.status === 'running');
      for (const bot of shouldRun) {
        if (!this.processes.has(bot._id.toString())) {
          if (activeCount < MAX_ACTIVE_BOTS) {
            logger.warn(`[BOT_MGR] Bot "${bot.name}" status=running but no process found. Restarting... (slot ${activeCount + 1}/${MAX_ACTIVE_BOTS})`);
            this.startBotProcess(bot);
            activeCount++;
          } else {
            logger.info(`[BOT_MGR] Bot "${bot.name}" status=running but pool full (${activeCount}/${MAX_ACTIVE_BOTS}). Moving to resting.`);
            await this.updateBotStatus(bot._id, 'resting');
            bot.status = 'resting';
          }
        }
      }
      
      // 5. If we somehow have more than MAX_ACTIVE_BOTS (e.g. manual starts), stop oldest
      if (activeCount > MAX_ACTIVE_BOTS) {
        const overLimit = activeCount - MAX_ACTIVE_BOTS;
        const sortedActive = runningBots
          .sort((a, b) => {
            const timeA = new Date(a.lastStatusChange || 0).getTime();
            const timeB = new Date(b.lastStatusChange || 0).getTime();
            return timeA - timeB; // Oldest first
          });
        
        for (let i = 0; i < overLimit && i < sortedActive.length; i++) {
          const bot = sortedActive[i];
          logger.warn(`[BOT_MGR] Over limit (${activeCount}/${MAX_ACTIVE_BOTS}). Forcing "${bot.name}" to rest.`);
          await this.updateBotStatus(bot._id, 'resting');
          bot.status = 'resting';
          this.stopBotProcess(bot._id);
          activeCount--;
        }
      }
      
      const summary = {
        total: allBots.length,
        running: bots.filter(b => b.status === 'running').length,
        resting: bots.filter(b => b.status === 'resting').length,
        stopped: allBots.filter(b => b.status === 'stopped').length,
        processes: this.processes.size,
      };
      
      logger.info(`[BOT_MGR] Sync done — DB: ${summary.running} running, ${summary.resting} resting, ${summary.stopped} stopped | Processes alive: ${summary.processes}/${MAX_ACTIVE_BOTS}`);
    } catch (err) {
      logger.error('[BOT_MGR] Critical synchronization error:', err.message);
    } finally {
      this.isSyncing = false;
    }
  }

  async updateBotStatus(id, status) {
    const botsCol = await getBotsCol();
    await botsCol.updateOne(
      { _id: toQueryId(id) },
      { $set: { status, lastStatusChange: new Date(), updatedAt: new Date() } }
    );
  }


  async syncUserForBot(bot) {
    try {
      const { getDb } = await import('../mongo.mjs');
      const db = await getDb();
      const usersCol = db.collection('users');
      
      // Update user name and possibly avatar to match bot manager config
      const updateData = { name: bot.name, updatedAt: Date.now() };
      if (bot.avatar) updateData.picture = bot.avatar;
      
      const jitterActive = Math.floor(Math.random() * 21) - 10; // ±10m
      const jitterRest = Math.floor(Math.random() * 21) - 10;   // ±10m

      await botsCol.updateOne(
        { _id: toQueryId(bot._id) },
        { $set: { jitterActive, jitterRest } }
      );

      await usersCol.updateOne(
        { email: bot.email },
        { $set: updateData }
      );
      logger.info(`[BOT_MGR] Synchronized user record for: ${bot.name} (${bot.email})`);
    } catch (err) {
      logger.error(`[BOT_MGR] Failed to sync user for bot: ${err.message}`);
    }
  }

  startBotProcess(bot) {
    const idStr = bot._id.toString();
    if (this.processes.has(idStr)) {
      this.stopBotProcess(idStr);
    }

    logger.info(`[BOT_MGR] Starting process for bot: ${bot.name} (${idStr})`);

    if (bot.status !== 'running') {
      logger.warn(`[BOT_MGR] Attempted to start bot ${bot.name} but status is ${bot.status}. Aborting.`);
      return;
    }

    const PORT = process.env.PORT || 3001;
    const botConfig = {
      email: bot.email,
      password: bot.password || 'bot-password-123',
      level: bot.level || 5,
      baseUrl: process.env.BOT_BASE_URL || `http://127.0.0.1:${PORT}`,
      pikafishPath: process.env.PIKAFISH_PATH || '/home/hoan/Pikafish/src/pikafish',
      activeMinutes: bot.activeMinutes || 0,
      restMinutes: bot.restMinutes || 0,
      maxGamesPerSession: bot.maxGamesPerSession || 0,
      personality: bot.personality || 'balanced',
      name: bot.name, 
      botId: idStr, // Traceability
      // Extra settings for the bot to check internally if we implement them
      playWithHumans: bot.playWithHumans ?? true,
      canInvite: bot.canInvite ?? true,
      acceptInvites: bot.acceptInvites ?? true,
      picture: bot.avatar,
    };

    const child = fork(BOT_SCRIPT_PATH, [], {
      env: {
        ...process.env,
        BOT_CONFIG: JSON.stringify(botConfig),
        NODE_ENV: 'production',
      },
      stdio: ['inherit', 'pipe', 'pipe', 'ipc'],
    });

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        logger.info(`[Bot:${bot.name}] ${data.toString().trim()}`);
      });
    }
    if (child.stderr) {
      child.stderr.on('data', (data) => {
        logger.error(`[Bot:${bot.name}] ERR: ${data.toString().trim()}`);
      });
    }

    logger.info(`[BOT_MGR] Spawned bot ${bot.name} with PID: ${child.pid}`);

    child.on('exit', (code) => {
      logger.info(`[BOT_MGR] Bot ${bot.name} (PID: ${child.pid}) exited with code ${code}`);
      this.processes.delete(idStr);
      // Trigger sync to restart if it's supposed to be running (e.g. after update or crash)
      setTimeout(() => this.syncBots(), 1000);
    });

    child.on('error', (err) => {
      logger.error(`[BOT_MGR] Bot ${bot.name} error:`, err.message);
      this.processes.delete(idStr);
    });

    this.processes.set(idStr, child);
  }

  stopBotProcess(id) {
    const idStr = id.toString();
    const child = this.processes.get(idStr);
    if (child) {
      logger.info(`[BOT_MGR] Requesting graceful stop for bot ID: ${idStr}`);
      try {
          child.send({ type: 'graceful_exit' });
      } catch (err) {
          logger.error(`[BOT_MGR] Failed to send graceful_exit to child: ${err.message}`);
          child.kill('SIGTERM');
      }
      
      // We don't remove from processes immediately. 
      // The 'exit' listener will handle it when the bot actually dies.
      // But we will mark it for force kill if it doesn't die in 12 mins.
      setTimeout(() => {
          if (this.processes.has(idStr)) {
              const stillAlive = this.processes.get(idStr);
              if (stillAlive && stillAlive.connected) {
                   logger.warn(`[BOT_MGR] Bot ${idStr} still alive after 12m. Force killing.`);
                   stillAlive.kill('SIGKILL');
                   this.processes.delete(idStr);
              }
          }
      }, 720000); 
    }
  }

  async toggleBot(id, start, adminUser) {
    const botsCol = await getBotsCol();
    const bot = await botsCol.findOne({ _id: toQueryId(id) });
    if (!bot) throw new Error('Bot not found');

    const adminLabel = adminUser ? `admin:${adminUser}` : 'admin:unknown';

    if (start) {
      logger.info(`[BOT_MGR] [${adminLabel}] START request for bot "${bot.name}" (${id}) — current status: ${bot.status}`);
      await this.updateBotStatus(id, 'running');
      // ─── BUG FIX: truyền bot với status đã cập nhật để startBotProcess không bị abort ───
      const updatedBot = { ...bot, status: 'running' };
      this.startBotProcess(updatedBot);
      logger.info(`[BOT_MGR] [${adminLabel}] Bot "${bot.name}" (${id}) STARTED successfully.`);
    } else {
      logger.info(`[BOT_MGR] [${adminLabel}] STOP request for bot "${bot.name}" (${id}) — current status: ${bot.status}`);
      await this.updateBotStatus(id, 'stopped');
      const hadProcess = this.processes.has(id.toString());
      this.stopBotProcess(id);
      if (hadProcess) {
        logger.info(`[BOT_MGR] [${adminLabel}] Bot "${bot.name}" (${id}) STOPPED — graceful_exit sent to process.`);
      } else {
        logger.info(`[BOT_MGR] [${adminLabel}] Bot "${bot.name}" (${id}) STOPPED — no active process found (was already idle).`);
      }
    }
    return { ok: true };
  }

  async getAllBots() {
    const botsCol = await getBotsCol();
    const { getDb } = await import('../mongo.mjs');
    const db = await getDb();
    const usersCol = db.collection('users');

    const bots = await botsCol.find({}).toArray();
    const emails = bots.map(b => b.email).filter(Boolean);
    const users = await usersCol.find({ email: { $in: emails } }).toArray();
    const userMap = new Map(users.map(u => [u.email, u]));

    return bots.map(bot => {
      const user = userMap.get(bot.email);
      // Remove any stale elo/rank/gamesPlayed from the bot document itself to ensure SSOT
      delete bot.elo;
      delete bot.rank;
      delete bot.gamesPlayed;
      
      if (user) {
        return {
          ...bot,
          elo: user.elo,
          gamesPlayed: user.gamesPlayed,
          rank: user.rank,
        };
      }
      return bot;
    });
  }

  async createBot(data) {
    const botsCol = await getBotsCol();
    // Ensure we don't store elo/rank/gamesPlayed in bots collection
    const { elo, rank, gamesPlayed, ...botData } = data;
    const bot = {
      ...botData,
      status: 'stopped',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await botsCol.insertOne(bot);
    const createdBot = { ...bot, _id: res.insertedId };
    await this.syncUserForBot(createdBot);
    return createdBot;
  }

  async updateBot(id, data) {
    const botsCol = await getBotsCol();
    // Ensure we don't store elo/rank/gamesPlayed in bots collection
    const { elo, rank, gamesPlayed, _id, ...botData } = data;
    const updateData = { ...botData, updatedAt: new Date() };

    await botsCol.updateOne({ _id: toQueryId(id) }, { $set: updateData });
    
    // Always sync user record
    const updatedBot = await botsCol.findOne({ _id: toQueryId(id) });
    await this.syncUserForBot(updatedBot);

    // If bot was running, stop it. 
    // The exit handler + syncBots will restart it with new settings if it should still be running.
    if (this.processes.has(id.toString())) {
      this.stopBotProcess(id);
    }
    
    return { ok: true };
  }

  async deleteBot(id) {
    const botsCol = await getBotsCol();
    this.stopBotProcess(id);
    await botsCol.deleteOne({ _id: toQueryId(id) });
    return { ok: true };
  }
}

const botManager = new BotManager();
export default botManager;
