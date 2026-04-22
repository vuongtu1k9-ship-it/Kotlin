import { getBotsCol } from '../mongo.mjs';
import { logger } from '../logger.mjs';

async function cleanupBots() {
  try {
    const botsCol = await getBotsCol();
    console.log('Fetching bots for cleanup...');
    const allBots = await botsCol.find({}).toArray();

    const encounteredNames = new Set();
    const toDelete = [];

    // Sort by presence of elo/rank and updatedAt descending
    const sortedBots = allBots.sort((a, b) => {
      const scoreA = (a.elo ? 2 : 0) + (a.rank ? 2 : 0);
      const scoreB = (b.elo ? 2 : 0) + (b.rank ? 2 : 0);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });

    for (const bot of sortedBots) {
      if (encounteredNames.has(bot.name)) {
        console.log(`Duplicate found: ${bot.name} (id: ${bot._id}). Marking for deletion.`);
        toDelete.push(bot._id);
      } else {
        encounteredNames.add(bot.name);
      }
    }

    if (toDelete.length > 0) {
      const res = await botsCol.deleteMany({ _id: { $in: toDelete } });
      console.log(`Deleted ${res.deletedCount} duplicate bots.`);
    } else {
      console.log('No duplicates found.');
    }

    // Ensure all remaining bots have at least level and personality
    const remaining = await botsCol.find({}).toArray();
    for (const bot of remaining) {
      const updates = {};
      if (bot.level === undefined) updates.level = 4;
      if (!bot.personality) updates.personality = 'balanced';
      
      if (Object.keys(updates).length > 0) {
        await botsCol.updateOne({ _id: bot._id }, { $set: updates });
        console.log(`Fixed missing technical props for: ${bot.name}`);
      }
    }

    console.log('Cleanup complete.');
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
}

cleanupBots();
