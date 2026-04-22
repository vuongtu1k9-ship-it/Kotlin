import { getDb } from '../mongo.mjs';

const pieceMap = {
  'red-chariot': 'Xe', 'red-horse': 'Mã', 'red-cannon': 'Pháo', 'red-soldier': 'Chốt', 'red-advisor': 'Sĩ', 'red-elephant': 'Tượng',
  'black-chariot': 'Xe', 'black-horse': 'Mã', 'black-cannon': 'Pháo', 'black-soldier': 'Chốt', 'black-advisor': 'Sĩ', 'black-elephant': 'Tượng'
};

const prefixes = [
  "Tuyệt chiêu cờ tàn", "Sát cục kinh điển", "Thế cờ hiểm hóc", "Cờ thế giang hồ", "Bí kíp cờ tướng",
  "Bài tập sát pháp", "Tàn cuộc đấu trí", "Thế cờ tàn hay", "Giải mã thế cờ", "Tuyệt kỹ cờ tướng",
  "Cờ tàn nghệ thuật", "Sát chiêu thực dụng", "Thế cờ giang hồ khó", "Đỉnh cao cờ tàn"
];

const connectors = [
  "đại chiến", "giao phong", "khắc chế", "thắng", "đối cục", "vs", "chống", "quyết chiến", "phá"
];

const suffixes = [
  "- Full đáp án AI", "- Cách giải chi tiết", "- Pikafish phân tích", "- Thử thách trí tuệ",
  "- Cực kỳ sâu sắc", "- Nước đi thần sầu", "- Tinh hoa cờ thế", "- Học cờ cùng máy"
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatMaterial(material, side) {
  const parts = [];
  const order = ['chariot', 'cannon', 'horse', 'soldier', 'advisor', 'elephant'];
  for (const p of order) {
    const key = `${side}-${p}`;
    const count = material[key];
    if (count > 0) parts.push(`${count > 1 ? count : ''}${pieceMap[key]}`);
  }
  return parts.join(' ');
}

async function run() {
  const db = await getDb();
  const col = db.collection('puzzles');

  console.log('Starting Randomized AI Title Generation (SEO V2)...');

  const query = { 'importedFrom.legacy13CharId': { $exists: true } };
  const cursor = col.find(query);
  let count = 0;
  const batchSize = 1000;
  let bulkOps = [];

  while (await cursor.hasNext()) {
    const puzzle = await cursor.next();
    
    // SKIP if it already has a specific name that is NOT from our pattern or numeric
    const currentName = puzzle.name || '';
    const isNumeric = /^[0-9]+$/.test(currentName);
    const isPattern1 = currentName.startsWith('Thế cờ ') && isNumeric; // from my 1st run
    const isPattern2 = currentName.includes(' vs ') && currentName.includes('(#'); // from my 2nd run
    
    // If it has a real name (not numeric and not my patterns), skip it
    if (!isNumeric && !isPattern1 && !isPattern2 && currentName.length > 3) {
      continue; 
    }

    const material = puzzle.material || {};
    const red = formatMaterial(material, 'red');
    const black = formatMaterial(material, 'black');
    if (!red && !black) continue;

    const hash = puzzle.importedFrom.legacy13CharId.substring(puzzle.importedFrom.legacy13CharId.length - 4);
    
    // Construct Randomized Title
    const prefix = getRandom(prefixes);
    const connector = getRandom(connectors);
    const suffix = getRandom(suffixes);
    
    const newName = `${prefix}: ${red} ${connector} ${black} (#${hash}) ${suffix}`;
    const newDescription = `Giải mã ${prefix} giữa quân Đỏ (${red}) và quân Đen (${black}). Thế cờ hay mã số ${hash} được phân tích chi tiết bởi engine Pikafish cực mạnh. Không quảng cáo, luyện tập cờ tướng đỉnh cao tại cotuong.xyz.`;

    bulkOps.push({
      updateOne: {
        filter: { _id: puzzle._id },
        update: {
          $set: {
            name: newName,
            description: newDescription,
            tags: ['cờ thế', 'giải cờ thế', 'cờ tướng online', 'cờ tàn', 'đáp án cờ thế', 'pikafish']
          }
        }
      }
    });

    if (bulkOps.length >= batchSize) {
      await col.bulkWrite(bulkOps);
      count += bulkOps.length;
      console.log(`Processed ${count} puzzles...`);
      bulkOps = [];
    }
  }

  if (bulkOps.length > 0) {
    await col.bulkWrite(bulkOps);
    count += bulkOps.length;
  }

  console.log(`Finished! Total SEO V2 optimized: ${count}`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
