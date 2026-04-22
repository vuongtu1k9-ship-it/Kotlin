
import 'dotenv/config';
import { getPuzzlesCol } from '../server/mongo.mjs';
import { safeString, safeNumber } from '../server/utils/security.mjs';
import { formatPuzzleSummary } from '../server/utils/puzzleHelpers.mjs';

async function test(query = {}) {
    try {
        const limit = Math.max(1, Math.min(200, safeNumber(query?.limit, 50)));
        const q = safeString(query?.q);
        const level = query?.level != null && query.level !== '' ? safeNumber(query.level, null) : null;
        const page = Math.max(1, safeNumber(query?.page, 1));
        const skip = (page - 1) * limit;
        const pieceCountStr = safeString(query?.pieceCount, null);
        const piecesStr = safeString(query?.pieces, null);
        const sort = safeString(query?.sort, 'newest');
        const timeRange = safeString(query?.timeRange, 'all');
        const materialStr = safeString(query?.material);
        const source = safeString(query?.source, 'all');
        const ids = safeString(query?.ids).split(',').filter(Boolean);

        let filter = {};
        if (ids.length > 0) {
          // ... ids logic ...
        } else {
          if (source === 'import') filter.createdByUid = 'import';
          else if (source === 'user') filter.createdByUid = { $ne: 'import' };
          
          const creatorUid = safeString(query?.creatorUid);
          if (creatorUid) filter.createdByUid = creatorUid;
          
          if (level != null && Number.isFinite(level)) filter.level = level;
          // ... more filters ...
        }

        console.log('Using filter:', JSON.stringify(filter, null, 2));

        const sortConfig = {};
        if (sort === 'popular') sortConfig.likeCount = -1;
        else if (sort === 'solved') sortConfig.solveCount = -1;
        sortConfig.createdAt = -1;

        const col = await getPuzzlesCol();
        const docs = await col
          .find(filter, { projection: { uid: 1, name: 1, description: 1, level: 1, createdAt: 1, updatedAt: 1, createdByName: 1, fen: 1, board: 1, pieceCount: 1, likeCount: 1, solveCount: 1 } })
          .sort(sortConfig)
          .skip(skip)
          .limit(limit)
          .toArray();

        console.log(`Found ${docs.length} docs`);
        if (docs.length > 0) {
            console.log('Sample summary:', JSON.stringify(formatPuzzleSummary(docs[0], 'vi'), null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}

console.log('--- TEST 1: default (source=all) ---');
await test({ limit: 12, source: 'all' });

console.log('\n--- TEST 2: source=import ---');
await test({ limit: 12, source: 'import' });

console.log('\n--- TEST 3: source=user ---');
await test({ limit: 12, source: 'user' });

process.exit(0);
