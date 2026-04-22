import { getBotsCol, getUsersCol, getDb } from '../mongo.mjs';

const officialBots = [
  {"name":"Nhập môn Tí","email":"nhap.mon.ti@bot.cotuong.xyz","level":1,"uid":"a7533a"},
  {"name":"Lão Nông","email":"lao.nong@bot.cotuong.xyz","level":1,"uid":"5fd371"},
  {"name":"Kỳ Thủ Tập Sự","email":"ky.thu.tap.su@bot.cotuong.xyz","level":2,"uid":"a2d73b"},
  {"name":"Chú Cuội","email":"chu.cuoi@bot.cotuong.xyz","level":2,"uid":"864da3"},
  {"name":"Cô Ba Trà","email":"co.ba.tra@bot.cotuong.xyz","level":2,"uid":"55985b"},
  {"name":"Hiệp Khách Hành","email":"hiep.khach.hanh@bot.cotuong.xyz","level":3,"uid":"ec3f6b"},
  {"name":"Ẩn Sĩ Mù","email":"an.si.mu@bot.cotuong.xyz","level":3,"uid":"33ea7b"},
  {"name":"Lính Chì","email":"linh.chi@bot.cotuong.xyz","level":3,"uid":"912f20"},
  {"name":"Hổ Xám","email":"ho.xam@bot.cotuong.xyz","level":3,"uid":"38efe6"},
  {"name":"Phi Liệt","email":"phi.liet@bot.cotuong.xyz","level":4,"uid":"e442a2"},
  {"name":"Tĩnh Tâm","email":"tinh.tam@bot.cotuong.xyz","level":4,"uid":"22d22a"},
  {"name":"Lãng Tử","email":"lang.tu@bot.cotuong.xyz","level":4,"uid":"2f6431"},
  {"name":"Mộc Miên","email":"moc.mien@bot.cotuong.xyz","level":4,"uid":"f0185b"},
  {"name":"Bạch Hổ","email":"bach.ho@bot.cotuong.xyz","level":5,"uid":"b0018c"},
  {"name":"Thanh Long","email":"thanh.long@bot.cotuong.xyz","level":5,"uid":"4f8029"},
  {"name":"Huyền Vũ","email":"huyen.vu@bot.cotuong.xyz","level":5,"uid":"163785"},
  {"name":"Chu Tước","email":"chu.tuoc@bot.cotuong.xyz","level":5,"uid":"abcb37"},
  {"name":"Thiên Sát","email":"thien.sat@bot.cotuong.xyz","level":6,"uid":"fb32a5"},
  {"name":"Tuyệt Thế","email":"tuyet.the@bot.cotuong.xyz","level":6,"uid":"67da82"},
  {"name":"Vô Nhai","email":"vo.nhai@bot.cotuong.xyz","level":6,"uid":"dcdbfa"},
  {"name":"Tiểu Ma Đầu","email":"bot-f82a1b@cotuong.xyz","level":2,"uid":"f82a1b"},
  {"name":"Sát Thủ Vô Danh","email":"bot-c9d2e3@cotuong.xyz","level":5,"uid":"c9d2e3"},
  {"name":"Ẩn Sĩ Giao Châu","email":"bot-b5e6f7@cotuong.xyz","level":4,"uid":"b5e6f7"},
  {"name":"Lãng Tử Kiếm","email":"bot-a4b5c6@cotuong.xyz","level":3,"uid":"a4b5c6"},
  {"name":"Bà Năm Bán Trà","email":"bot-d3e4f5@cotuong.xyz","level":1,"uid":"d3e4f5"},
  {"name":"Hùng Râu","email":"bot-e2f3a4@cotuong.xyz","level":2,"uid":"e2f3a4"},
  {"name":"Phù Thủy Cờ","email":"bot-fb1c2d@cotuong.xyz","level":6,"uid":"fb1c2d"},
  {"name":"Chiến Binh Thép","email":"bot-1a2b3c@cotuong.xyz","level":4,"uid":"1a2b3c"},
  {"name":"Quái Kiệt Phương Nam","email":"bot-bc4d5e@cotuong.xyz","level":3,"uid":"bc4d5e"}
];

async function run() {
  const botsCol = await getBotsCol();
  const usersCol = await getUsersCol();
  const db = await getDb();
  const matchesCol = db.collection('matches');

  console.log('--- 1. Overwriting Bots Collection with Official Data ---');
  // Clear existing bots to remove "bot_N" entries
  await botsCol.deleteMany({});
  
  for (const bData of officialBots) {
    const { name, email, level, uid } = bData;
    await botsCol.insertOne({
      name, email, level, uid,
      status: 'stopped',
      isBot: true,
      role: 'bot',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`Inserted Bot: ${name} (${uid})`);
  }

  console.log('\n--- 2. Recalculating Elo for All participants ---');
  const eloMap = new Map();
  const matchCounts = new Map();

  const matches = await matchesCol.find({ 
    status: 'finished',
    'state.winner': { $exists: true }
  }).sort({ scoredAt: 1 }).toArray();

  console.log(`Found ${matches.length} decisive matches.`);

  const K = 20;
  for (const match of matches) {
    const redUid = match.playerUids?.red || match.state?.playerUids?.red;
    const blackUid = match.playerUids?.black || match.state?.playerUids?.black;
    const winner = match.state?.winner;
    
    if (!redUid || !blackUid) continue;

    if (!eloMap.has(redUid)) eloMap.set(redUid, 1200);
    if (!eloMap.has(blackUid)) eloMap.set(blackUid, 1200);

    const rElo = eloMap.get(redUid);
    const bElo = eloMap.get(blackUid);

    matchCounts.set(redUid, (matchCounts.get(redUid) || 0) + 1);
    matchCounts.set(blackUid, (matchCounts.get(blackUid) || 0) + 1);

    const expR = 1 / (1 + Math.pow(10, (bElo - rElo) / 400));
    const expB = 1 / (1 + Math.pow(10, (rElo - bElo) / 400));

    let sR = 0.5, sB = 0.5;
    if (winner === 'red') { sR = 1; sB = 0; }
    else if (winner === 'black') { sR = 0; sB = 1; }

    eloMap.set(redUid, Math.round(rElo + K * (sR - expR)));
    eloMap.set(blackUid, Math.round(bElo + K * (sB - expB)));
  }

  const officialUids = new Set(officialBots.map(b => b.uid));

  for (const [uid, elo] of eloMap.entries()) {
    const games = matchCounts.get(uid) || 0;
    await usersCol.updateOne({ uid }, { $set: { elo, gamesPlayed: games } });
    if (officialUids.has(uid)) {
       console.log(`[BOT] ${uid} -> Elo: ${elo}, Games: ${games}`);
    }
  }

  console.log('\n--- Done! ---');
  process.exit(0);
}
run();
