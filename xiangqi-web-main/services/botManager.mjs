import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBotsCol, toQueryId } from '../mongo.mjs';
import logger from '../logger.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOT_SCRIPT_PATH = path.join(__dirname, '../bot/index.mjs');

class BotManager {
  constructor() {
    this.processes = new Map(); // id -> child process
    this.checkInterval = null;
    this.isSyncing = false;
  }

  async init() {
    logger.info('[BotManager] Initializing...');
    await this.syncBots();
    
    // Check every minute for active/rest schedules
    this.checkInterval = setInterval(() => this.syncBots(), 60 * 1000);
  }

  async syncBots() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const botsCol = await getBotsCol();
      const bots = await botsCol.find({ status: { $in: ['running', 'resting'] } }).toArray();

      const now = new Date();
      const MAX_ACTIVE_BOTS = 6;

      // 1. Process bots that should STOP (exceeded active time)
      for (const bot of bots) {
        if (bot.status === 'running') {
          const lastStatusChange = bot.lastStatusChange || bot.updatedAt || now;
          const diffMinutes = (now - new Date(lastStatusChange)) / (1000 * 60);

          if (bot.activeMinutes && diffMinutes >= (bot.activeMinutes + (bot.jitterActive || 0))) {
            logger.info(`[BotManager] Bot ${bot.name} exceeded active time. Requesting graceful stop...`);
            await this.updateBotStatus(bot._id, 'resting');
            this.stopBotProcess(bot._id);
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
          logger.info(`[BotManager] Bot ${bot.name} rested enough (${Math.round(bot.restedFor)}m). Slots: ${activeCount}/${MAX_ACTIVE_BOTS}. Resuming...`);
          await this.updateBotStatus(bot._id, 'running');
          this.startBotProcess(bot);
          activeCount++;
        } else {
          // Pool is full, check back next minute
          break;
        }
      }

      // 4. Ensure running bots have processes (protection against crashes)
      const shouldRun = bots.filter(b => b.status === 'running');
      for (const bot of shouldRun) {
        if (!this.processes.has(bot._id.toString())) {
          if (activeCount < MAX_ACTIVE_BOTS) {
            logger.warn(`[BotManager] Bot ${bot.name} should be running but process is missing. Starting...`);
            this.startBotProcess(bot);
            activeCount++;
          } else {
            logger.info(`[BotManager] Bot ${bot.name} should be running but limit reached. Changing to resting.`);
            await this.updateBotStatus(bot._id, 'resting');
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
          logger.warn(`[BotManager] Over limit (${activeCount}/${MAX_ACTIVE_BOTS}). Forcing ${bot.name} to rest.`);
          await this.updateBotStatus(bot._id, 'resting');
          this.stopBotProcess(bot._id);
        }
      }

    } catch (err) {
      logger.error('[BotManager] Sync error:', err.message);
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
      logger.info(`[BotManager] Synchronized user record for: ${bot.name} (${bot.email})`);
    } catch (err) {
      logger.error(`[BotManager] Failed to sync user for bot: ${err.message}`);
    }
  }

  startBotProcess(bot) {
    const idStr = bot._id.toString();
    if (this.processes.has(idStr)) {
      this.stopBotProcess(idStr);
    }

    logger.info(`[BotManager] Starting process for bot: ${bot.name} (${idStr})`);

    const botConfig = {
      email: bot.email,
      password: bot.password || 'bot-password-123',
      level: bot.level || 5,
      baseUrl: process.env.PUBLIC_URL || 'http://localhost:3001',
      pikafishPath: process.env.PIKAFISH_PATH || '/home/hoan/Pikafish/src/pikafish',
      activeMinutes: bot.activeMinutes || 0,
      restMinutes: bot.restMinutes || 0,
      maxGamesPerSession: bot.maxGamesPerSession || 0,
      personality: bot.personality || 'balanced',
      name: bot.name, // PASS THE NAME
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
        NODE_ENV: 'production', // Ensure it doesn't try to use dev-only things if any
      },
      stdio: 'inherit',
    });

    child.on('exit', (code) => {
      logger.info(`[BotManager] Bot ${bot.name} exited with code ${code}`);
      this.processes.delete(idStr);
    });

    child.on('error', (err) => {
      logger.error(`[BotManager] Bot ${bot.name} error:`, err.message);
      this.processes.delete(idStr);
    });

    this.processes.set(idStr, child);
  }

  stopBotProcess(id) {
    const idStr = id.toString();
    const child = this.processes.get(idStr);
    if (child) {
      logger.info(`[BotManager] Requesting graceful stop for bot ID: ${idStr}`);
      try {
          child.send({ type: 'graceful_exit' });
      } catch (err) {
          logger.error(`[BotManager] Failed to send graceful_exit to child: ${err.message}`);
          child.kill('SIGTERM');
      }
      
      // We don't remove from processes immediately. 
      // The 'exit' listener will handle it when the bot actually dies.
      // But we will mark it for force kill if it doesn't die in 12 mins.
      setTimeout(() => {
          if (this.processes.has(idStr)) {
              const stillAlive = this.processes.get(idStr);
              if (stillAlive && stillAlive.connected) {
                   logger.warn(`[BotManager] Bot ${idStr} still alive after 12m. Force killing.`);
                   stillAlive.kill('SIGKILL');
                   this.processes.delete(idStr);
              }
          }
      }, 720000); 
    }
  }

  async toggleBot(id, start) {
    const botsCol = await getBotsCol();
    const bot = await botsCol.findOne({ _id: toQueryId(id) });
    if (!bot) throw new Error('Bot not found');

    if (start) {
      await this.updateBotStatus(id, 'running');
      this.startBotProcess(bot);
    } else {
      await this.updateBotStatus(id, 'stopped');
      this.stopBotProcess(id);
    }
    return { ok: true };
  }

  async getAllBots() {
    const botsCol = await getBotsCol();
    return botsCol.find({}).toArray();
  }

  async createBot(data) {
    const botsCol = await getBotsCol();
    const bot = {
      ...data,
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
    const updateData = { ...data, updatedAt: new Date() };
    delete updateData._id; // Ensure we don't try to update _id

    await botsCol.updateOne({ _id: toQueryId(id) }, { $set: updateData });
    
    // Always sync user record
    const updatedBot = await botsCol.findOne({ _id: toQueryId(id) });
    await this.syncUserForBot(updatedBot);

    // If bot was running, restart it to apply new settings
    if (this.processes.has(id.toString())) {
      this.startBotProcess(updatedBot);
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
