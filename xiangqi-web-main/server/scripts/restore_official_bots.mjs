import { getBotsCol, getDb } from '../mongo.mjs';

const OFFICIAL_BOTS = [
  { name: 'Lão Nông', personality: 'steady', icon: '🤖' },
  { name: 'Bà Năm Bán Trà', personality: 'defensive', icon: '🤖' },
  { name: 'Chú Cuội', personality: 'chaotic', icon: '🤖' },
  { name: 'Tiểu Ma Đầu', personality: 'aggressive', icon: '⚔️' },
  { name: 'Hùng Râu', personality: 'balanced', icon: '⚖️' },
  { name: 'Lính Chì', personality: 'steady', icon: '🛡️' },
  { name: 'Lãng Tử Kiếm', personality: 'aggressive', icon: '🤖' },
  { name: 'Quái Kiệt Phương Nam', personality: 'chaotic', icon: '🤖' },
  { name: 'Mộc Miên', personality: 'defensive', icon: '🤖' },
  { name: 'Chiến Binh Thép', personality: 'steady', icon: '🛡️' },
  { name: 'Ẩn Sĩ Giao Châu', personality: 'balanced', icon: '🤖' },
  { name: 'Thanh Long', personality: 'aggressive', icon: '⚔️' },
  { name: 'Sát Thủ Vô Danh', personality: 'chaotic', icon: '⚔️' },
  { name: 'Phù Thủy Cờ', personality: 'balanced', icon: '🤖' },
  { name: 'Tuyệt Thế', personality: 'balanced', icon: '⚖️' },
];

async function restore() {
  console.log('🚀 Restoring 15 Official Bots...');
  const botsCol = await getBotsCol();
  const db = await getDb();
  const usersCol = db.collection('users');

  // Clear any existing (just to be safe and clean)
  await botsCol.deleteMany({});
  console.log('🗑️  Cleared bots collection.');

  const botsToInsert = OFFICIAL_BOTS.map((ob, i) => {
    const uid = `bot_${i + 1}`;
    const email = `${uid}@cotuong.xyz`;
    return {
      uid,
      name: ob.name,
      email,
      level: (i % 10) + 1, // Distribute levels 1-10
      personality: ob.personality,
      status: 'running', // Make them live immediately
      activeMinutes: 1440, // Always active for simplicity in this restore
      restMinutes: 0,
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const res = await botsCol.insertMany(botsToInsert);
  console.log(`✅ Inserted ${res.insertedCount} bots into 'bots' collection.`);

  // Sync users collection
  for (const bot of botsToInsert) {
    await usersCol.updateOne(
      { email: bot.email },
      {
        $set: {
          uid: bot.uid,
          name: bot.name,
          role: 'bot',
          picture: null,
          updatedAt: Date.now(),
        },
        $setOnInsert: { createdAt: Date.now() },
      },
      { upsert: true }
    );
  }
  console.log('✅ Synchronized 15 bot user records.');

  console.log('✨ Restoration complete. Restarting synchronization service is recommended.');
  process.exit(0);
}

restore().catch(err => {
  console.error('❌ Restoration failed:', err);
  process.exit(1);
});
