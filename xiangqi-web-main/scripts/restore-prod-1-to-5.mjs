import fs from 'fs';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const legacyMap = {
  'rgeneral': 'K', 'radvisor': 'A', 'relephant': 'B', 'rhorse': 'N', 'rchariot': 'R', 'rcannon': 'C', 'rsoldier': 'P',
  'bgeneral': 'k', 'badvisor': 'a', 'belephant': 'b', 'bhorse': 'n', 'bchariot': 'r', 'bcannon': 'c', 'bsoldier': 'p'
};

function makeSlug(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function legacyBoardToFen(boardArr) {
  if (!boardArr || !boardArr.length) return 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
  let grid = Array.from({ length: 10 }, () => Array(9).fill(null));
  for (let item of boardArr) {
    const [piece, pos] = item.split(':');
    const r = parseInt(pos[0]);
    const c = parseInt(pos[1]);
    grid[r][c] = legacyMap[piece];
  }
  let fenParts = [];
  for (let r = 0; r < 10; r++) {
    let empty = 0;
    let rowFen = '';
    for (let c = 0; c < 9; c++) {
      if (grid[r][c]) {
        if (empty > 0) rowFen += empty;
        rowFen += grid[r][c];
        empty = 0;
      } else {
        empty += 1;
      }
    }
    if (empty > 0) rowFen += empty;
    fenParts.push(rowFen);
  }
  return fenParts.join('/') + ' w - - 0 1';
}

function legacyMovesToUci(historyArr) {
  if (!historyArr || !historyArr.length) return '';
  const cols = ['a','b','c','d','e','f','g','h','i'];
  // rows in UCI are 9 to 0 from red's perspective (bottom to top). 
  // In legacy, row 0 is top (black), row 9 is bottom (red).
  // So row 0 -> 9, row 9 -> 0
  const rows = ['9','8','7','6','5','4','3','2','1','0'];
  return historyArr.map(h => {
    return cols[h.from.col] + rows[h.from.row] + cols[h.to.col] + rows[h.to.row];
  }).join(' ');
}

async function run() {
  const sourceFile = process.argv[2] || '/tmp/prod_lessons.json';
  if (!fs.existsSync(sourceFile)) {
    console.log("File not found:", sourceFile);
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
  const targets = data.filter(x => ['basic-1', 'basic-2', 'basic-3', 'basic-4', 'basic-5'].includes(x.id));
  
  if (targets.length === 0) {
    console.log("No targets found!");
    return;
  }

  const client = new MongoClient(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db(process.env.MONGO_DB || 'xiangqi');
  const col = db.collection('practice_lessons');

  let count = 0;
  for (const t of targets) {
    const fen = legacyBoardToFen(t.board);
    const moves = legacyMovesToUci(t.history);
    
    // Convert to rich content
    const contentHtml = t.description.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('');

    const newDoc = {
      id: t.id,
      title: t.title,
      category: t.category,
      slug: makeSlug(t.title),
      categorySlug: makeSlug(t.category),
      difficulty: t.difficulty || 'Dễ',
      reward: t.reward || 20,
      content: contentHtml,
      boards: [
        {
          id: 'board-1',
          title: 'Minh hoạ',
          fen: fen,
          moves: moves
        }
      ],
      updatedAt: new Date()
    };

    await col.updateOne({ id: newDoc.id }, { $set: newDoc }, { upsert: true });
    count++;
    console.log(`Restored: ${t.title}`);
  }

  console.log(`\n✅ Restored ${count} lessons successfully`);
  await client.close();
}
run();
