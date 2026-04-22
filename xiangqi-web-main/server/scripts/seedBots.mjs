
import { getBotsCol, toQueryId, getDb } from '../mongo.mjs';
import { ObjectId } from 'mongodb';
function removeAccents(str) {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

async function seedBots() {
  const botsCol = await getBotsCol();
  console.log('Bot seeder is now dynamic. Manage agents via the Admin Dashboard.');
  process.exit(0);
}
        $setOnInsert: {
          status: 'resting',
          activeMinutes: 60,
          restMinutes: 120,
          maxGamesPerSession: 5,
          playWithHumans: true,
          canInvite: true,
          acceptInvites: true,
          createdAt: new Date(),
          lastStatusChange: new Date()
        }
      },
      { upsert: true }
    );
    console.log(`Synced bot: ${def.name} -> ${emailClean}`);
  }

  console.log('Done.');
  process.exit(0);
}

seedBots().catch(err => {
  console.error(err);
  process.exit(1);
});
