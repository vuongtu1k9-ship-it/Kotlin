import { getBotsCol, getUsersCol } from '../mongo.mjs';

async function fix() {
  const b = await getBotsCol();
  const u = await getUsersCol();
  const bots = await b.find({}).toArray();
  for (const bot of bots) {
    const user = await u.findOne({ email: bot.email });
    if (user) {
      await b.updateOne({ _id: bot._id }, { $set: { uid: user.uid } });
      console.log(`Fixed UID for: ${bot.name} -> ${user.uid}`);
      
      // Seed Elo if they are near the default (1000-1500)
      if (!user.elo || (user.elo >= 1000 && user.elo <= 1500)) {
         const simulatedElo = 1000 + (bot.level * 200); // level 1 = 1200, level 10 = 3000
         await u.updateOne({ uid: user.uid }, { $set: { elo: simulatedElo } });
         console.log(`  - Seeded Elo for ${bot.name}: ${simulatedElo}`);
      }
    } else {
      console.log(`No user record found for bot email: ${bot.email}`);
    }
  }
  process.exit(0);
}

fix();
