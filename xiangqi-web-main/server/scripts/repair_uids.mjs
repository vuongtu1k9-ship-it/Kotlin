import { MongoClient } from 'mongodb';

const TARGET_URI = 'mongodb://127.0.0.1:27017';
const TARGET_DB = 'xiangqi';

async function main() {
  console.log('Connecting to Production DB...');
  const targetClient = new MongoClient(TARGET_URI);
  await targetClient.connect();
  const targetDb = targetClient.db(TARGET_DB);
  const users = targetDb.collection('users');

  const generateUid = () => Math.random().toString(36).substring(2, 7);

  console.log('Finding users without UID...');
  const cursor = users.find({ $or: [{ uid: { $exists: false } }, { uid: null }, { uid: '' }] });
  const ops = [];
  let count = 0;

  while (await cursor.hasNext()) {
    const u = await cursor.next();
    const uid = generateUid();
    
    ops.push({
      updateOne: {
        filter: { _id: u._id },
        update: { $set: { uid } }
      }
    });

    if (ops.length === 500) {
      await users.bulkWrite(ops);
      count += ops.length;
      ops.length = 0;
      console.log(`Updated ${count} users...`);
    }
  }

  if (ops.length > 0) {
    await users.bulkWrite(ops);
    count += ops.length;
  }

  console.log(`Successfully repaired ${count} users.`);
  await targetClient.close();
  console.log('DONE!');
}

main().catch(console.error);
