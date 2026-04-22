import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';

// Connection details
const SOURCE_URI = 'mongodb://192.168.9.167:27017';
const SOURCE_DB = 'cotuong';
const TARGET_URI = 'mongodb://127.0.0.1:27017';
const TARGET_DB = 'xiangqi';

const mapFenToType = {
  k: 'general', a: 'advisor', b: 'elephant', n: 'horse', r: 'chariot', c: 'cannon', p: 'soldier',
  K: 'general', A: 'advisor', B: 'elephant', N: 'horse', R: 'chariot', C: 'cannon', P: 'soldier'
};

function getPuzzlesMetadata(fen) {
  const parts = fen.trim().split(/\s+/);
  const boardStr = parts[0];
  const ranks = boardStr.split('/');
  
  const board = Array.from({ length: 10 }, () => Array(9).fill(null));
  const material = {};
  const piecesSet = new Set();
  let pieceCount = 0;
  let idCounter = 0;

  for (let r = 0; r < Math.min(ranks.length, 10); r++) {
    const rankStr = ranks[r];
    let c = 0;
    for (let i = 0; i < rankStr.length && c < 9; i++) {
      const char = rankStr[i];
      if (/[1-9]/.test(char)) {
        c += parseInt(char, 10);
      } else {
        const side = char === char.toUpperCase() ? 'red' : 'black';
        const type = mapFenToType[char];
        if (type) {
          const key = `${side}-${type}`;
          material[key] = (material[key] || 0) + 1;
          piecesSet.add(key);
          pieceCount++;
          
          board[r][c] = {
            id: `${side}-${type}-${Date.now()}-${idCounter++}`,
            side,
            type,
            position: { row: r, col: c },
            hasMoved: true
          };
        }
        c++;
      }
    }
  }

  return { 
    board, 
    material, 
    pieces: Array.from(piecesSet).sort(), 
    pieceCount 
  };
}

async function main() {
  console.log('Connecting to Source DB...');
  const sourceClient = new MongoClient(SOURCE_URI, { enableUtf8Validation: false, connectTimeoutMS: 30000 });
  try {
    await sourceClient.connect();
  } catch (e) {
    console.error('Failed to connect to source DB. Re-trying with longer timeout?');
    process.exit(1);
  }
  const sourceDb = sourceClient.db(SOURCE_DB);

  console.log('Connecting to Target DB...');
  const targetClient = new MongoClient(TARGET_URI);
  await targetClient.connect();
  const targetDb = targetClient.db(TARGET_DB);

  console.log('--- CLEANING TARGET DB ---');
  await targetDb.collection('users').deleteMany({});
  await targetDb.collection('puzzles').deleteMany({});
  await targetDb.collection('setups').deleteMany({}); // Clean up old setups table if any

  const generateUid = () => Math.random().toString(36).substring(2, 7);

  console.log('--- STARTING USERS IMPORT ---');
  let userCount = 0;
  let userSpamCount = 0;
  const legacyUsers = sourceDb.collection('chess.user');
  const targetUsers = targetDb.collection('users');

  const curU = legacyUsers.find({});
  const userOps = [];
  while (await curU.hasNext()) {
    const u = await curU.next();
    const name = (u.name || u.username || '').trim();
    const win = Number(u.win || 0);
    const lose = Number(u.lose || 0);
    const draw = Number(u.draw || 0);
    const gamesPlayed = win + lose + draw;
    const isBot = name.match(/bot|admin/i) || name.length > 50;
    const isSpam = gamesPlayed === 0 && (!name || name.length < 3 || isBot);
    
    if (isSpam) {
      userSpamCount++;
      continue;
    }

    let sub = `legacy:${u._id}`;
    if (u.oauthservice === 'google' && u.guid) {
      sub = `google:${u.guid}`;
    }

    const regtime = u.regtime ? new Date(u.regtime).getTime() : Date.now();
    let elo = Number(u.score || 1200);
    if (elo < 1200) elo = 1200;
    const uid = generateUid();

    userOps.push({
      updateOne: {
        filter: { sub },
        update: {
          $set: {
            sub,
            uid,
            name: name || 'Guest user',
            picture: u.image || null,
            elo,
            gamesPlayed,
            updatedAt: Date.now(),
          },
          $setOnInsert: { createdAt: regtime }
        },
        upsert: true
      }
    });

    if (userOps.length === 500) {
      await targetUsers.bulkWrite(userOps, { ordered: false });
      userCount += userOps.length;
      userOps.length = 0;
    }
  }
  if (userOps.length > 0) {
    await targetUsers.bulkWrite(userOps, { ordered: false });
    userCount += userOps.length;
  }
  console.log(`Imported ${userCount} users. Ignored ${userSpamCount} spam/invalid users.`);

  console.log('--- STARTING PUZZLES IMPORT ---');
  let puzzleCount = 0;
  let puzzleErrorCount = 0;
  const legacyPuzzles = sourceDb.collection('chess.puzzle');
  const targetPuzzles = targetDb.collection('puzzles');
  let mapLines = [];

  const curP = legacyPuzzles.find({});
  const puzzleOps = [];
  while (await curP.hasNext()) {
    const c = await curP.next();
    if (!c.fen) {
      puzzleErrorCount++;
      continue;
    }

    // ENRICHED METADATA EXTRACTION
    const { board, material, pieces, pieceCount } = getPuzzlesMetadata(c.fen);
    
    // Safety check for kings
    if (!pieces.includes('red-general') || !pieces.includes('black-general')) {
       puzzleErrorCount++;
       continue;
    }

    // ENRICHED NAME EXTRACTION (Vietnamese accents)
    const rawName = c.name || c.title || c.uid || 'Thế cờ';
    const cleanName = rawName.trim().replace(/\s+/g, ' ');

    // ENRICHED DESCRIPTION (Tag merging)
    const combinedDesc = [c.tag, c.description, c.desc]
      .filter(Boolean)
      .map(s => String(s).trim())
      .filter(s => s.length > 0)
      .join('. ')
      .replace(/\s+/g, ' ');

    const legacyId = String(c._id);
    const shortLegacyId = c.id; 
    const uid = generateUid(); 

    puzzleOps.push({
      updateOne: {
        filter: { uid },
        update: {
          $set: {
            uid,
            name: cleanName,
            description: combinedDesc || null,
            fen: c.fen,
            level: c.level != null ? Number(c.level) : null,
            board,
            material,
            pieces,
            pieceCount,
            updatedAt: Date.now(),
            createdBySub: 'import',
            createdByName: 'import',
            importedFrom: { collection: 'legacy_chess_puzzle', id: legacyId, legacy13CharId: shortLegacyId },
          },
          $setOnInsert: { createdAt: Date.now() }
        },
        upsert: true
      }
    });

    if (shortLegacyId) {
      mapLines.push(`  "${shortLegacyId}" "${uid}";`);
    }

    if (puzzleOps.length === 50) {
      await targetPuzzles.bulkWrite(puzzleOps, { ordered: false });
      puzzleCount += puzzleOps.length;
      puzzleOps.length = 0;
    }
  }
  if (puzzleOps.length > 0) {
    await targetPuzzles.bulkWrite(puzzleOps, { ordered: false });
    puzzleCount += puzzleOps.length;
  }
  console.log(`Imported ${puzzleCount} puzzles. Ignored ${puzzleErrorCount} invalid/error puzzles.`);

  console.log('--- GENERATING NGINX MAP ---');
  let mapContent = 'map $legacy_puzzle_id $new_uid {\n';
  mapContent += mapLines.join('\n');
  mapContent += '\n}\n';

  fs.writeFileSync('/tmp/legacy-puzzle-map.conf', mapContent);
  console.log('Wrote map file to /tmp/legacy-puzzle-map.conf.');

  await sourceClient.close();
  await targetClient.close();
  console.log('DONE!');
}

main().catch(console.error);
