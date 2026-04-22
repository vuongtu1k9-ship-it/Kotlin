import { getBotsCol, getDb } from '../mongo.mjs';

/**
 * Xác định tên hạng dựa trên điểm Elo
 */
function getRankTitle(elo) {
  if (elo <= 1099) return 'ranks.novice';
  if (elo <= 1299) return 'ranks.amateur';
  if (elo <= 1499) return 'ranks.intermediate';
  if (elo <= 1699) return 'ranks.expert';
  if (elo <= 1899) return 'ranks.master';
  if (elo <= 2099) return 'ranks.internationalMaster';
  return 'ranks.grandmaster';
}

async function update() {
  console.log('🚀 Đang đồng bộ và cập nhật Rank cho Bot từ Database...');
  const botsCol = await getBotsCol();
  const db = await getDb();
  const usersCol = db.collection('users');

  const bots = await botsCol.find({}).toArray();
  console.log(`🔍 Tìm thấy ${bots.length} bot trong database.`);

  for (const bot of bots) {
    const userRecord = await usersCol.findOne({ email: bot.email });
    
    // Nếu có user record, chúng ta sẽ cập nhật Rank cho user đó dựa trên Elo hiện tại của họ
    if (userRecord) {
      const currentElo = userRecord.elo ?? 1200;
      const rank = getRankTitle(currentElo);
      
      console.log(`[${bot.name}] User Elo: ${currentElo}, Updating Rank: ${rank}`);
      
      await usersCol.updateOne(
          { _id: userRecord._id },
          { 
              $set: { 
                  rank: rank, 
                  updatedAt: Date.now() 
              } 
          }
      );
    }

    // Xóa các trường elo, rank, gamesPlayed khỏi collection bots để đảm bảo SSOT (chỉ lưu ở users)
    console.log(`[${bot.name}] Removing redundant stats from bots collection.`);
    await botsCol.updateOne(
        { _id: bot._id },
        { 
          $unset: { 
            elo: "", 
            rank: "", 
            gamesPlayed: "" 
          },
          $set: { updatedAt: new Date() }
        }
    );
  }

  console.log('✅ Hoàn tất cập nhật chỉ số thực tế cho Bot.');
  process.exit(0);
}

update().catch(err => {
  console.error('❌ Cập nhật thất bại:', err);
  process.exit(1);
});
