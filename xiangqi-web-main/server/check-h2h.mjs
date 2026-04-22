import { getGamesCol } from './mongo.mjs';
import { logger } from './logger.mjs';

async function test() {
  const col = await getGamesCol();
  try {
    const games = await col.find({ status: 'finished' }).limit(5).toArray();
    console.log('Sample finished games:');
    games.forEach(g => {
      console.log(` - ID: ${g._id}`);
      console.log(`   playerUids: ${JSON.stringify(g.playerUids)}`);
      console.log(`   state.playerUids: ${JSON.stringify(g.state?.playerUids)}`);
      console.log(`   winner: ${g.state?.winner}`);
    });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

test();
