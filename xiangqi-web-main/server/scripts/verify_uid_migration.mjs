import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { logger } from '../logger.mjs';

async function run() {
  const MONGO_URL = process.env.MONGO_URL || 'mongodb://192.168.1.23:27017';
  const MONGO_DB = process.env.MONGO_DB || 'xiangqi';
  
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db(MONGO_DB);
    logger.log('Connected to:', MONGO_URL);
    
    const matchesCol = db.collection('matches');
    const chatMsgsCol = db.collection('chat_messages');
    const msgsCol = db.collection('messages');
    const usersCol = db.collection('users');
    const pushCol = db.collection('user_subscriptions');
    const puzzleCol = db.collection('puzzles');

    logger.log('--- Verification Results ---');

    const matchP = await matchesCol.findOne({ playerUids: { $exists: true } });
    logger.log('Match playerUids found:', matchP?.playerUids ? 'YES' : 'NO');
    if (matchP) logger.log('Sample playerUids:', matchP.playerUids);
    
    const chatMsg = await chatMsgsCol.findOne({ senderUid: { $exists: true } });
    logger.log('Chat message senderUid found:', chatMsg?.senderUid ? 'YES' : 'NO');
    if (chatMsg) logger.log('Sample senderUid:', chatMsg.senderUid);
    
    const msg = await msgsCol.findOne({ fromUid: { $exists: true } });
    logger.log('DM fromUid found:', msg?.fromUid ? 'YES' : 'NO');
    if (msg) logger.log('Sample fromUid:', msg.fromUid);

    const push = await pushCol.findOne({ userUid: { $exists: true } });
    logger.log('Push userUid found:', push?.userUid ? 'YES' : 'NO');

    const puzzle = await puzzleCol.findOne({ createdByUid: { $exists: true } });
    logger.log('Puzzle createdByUid found:', puzzle?.createdByUid ? 'YES' : 'NO');

    const upperUser = await usersCol.findOne({ uid: /[A-Z]/ });
    logger.log('Any uppercase uids left?:', !!upperUser);
    if (upperUser) logger.log('Found uppercase uid:', upperUser.uid);

    const subMatch = await matchesCol.findOne({ playersSub: { $exists: true } });
    logger.log('Any legacy playersSub left in matches?:', !!subMatch);

  } finally {
    await client.close();
  }
}
run().catch(logger.error);
