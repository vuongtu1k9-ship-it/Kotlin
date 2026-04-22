import { getGamesCol } from './mongo.mjs';
import { ObjectId } from 'mongodb';

async function test() {
  const u1 = '912f20'; // From my earlier check
  const u2 = '864da3';
  const games = await getGamesCol();
  
  const uids1 = [u1];
  const uids2 = [u2];

  const filter = {
    $or: [
      { status: 'finished' },
      { 'state.finished': true }
    ],
    $and: [
      {
        $or: [
          { 'playerUids.red': { $in: uids1 }, 'playerUids.black': { $in: uids2 } },
          { 'playerUids.red': { $in: uids2 }, 'playerUids.black': { $in: uids1 } },
          { 'state.playerUids.red': { $in: uids1 }, 'state.playerUids.black': { $in: uids2 } },
          { 'state.playerUids.red': { $in: uids2 }, 'state.playerUids.black': { $in: uids1 } },
        ]
      }
    ]
  };

  const docs = await games.find(filter).toArray();
  console.log('Matches found:', docs.length);
  process.exit(0);
}

test();
