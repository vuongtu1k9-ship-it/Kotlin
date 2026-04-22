import { getMovesCol } from '../mongo.mjs';
import { logger } from '../logger.mjs';

const initialBoard = () => {
  const mk = (side, type, row, col, i) => ({ id: `${side}-${type}-${i}`, side, type, position: { row, col }, hasMoved: true });
  const empty = Array.from({ length: 10 }, () => Array.from({ length: 9 }, () => null));
  let i = 0;
  const back = ['chariot', 'horse', 'elephant', 'advisor', 'general', 'advisor', 'elephant', 'horse', 'chariot'];
  back.forEach((t, c) => (empty[0][c] = mk('black', t, 0, c, i++)));
  empty[2][1] = mk('black', 'cannon', 2, 1, i++);
  empty[2][7] = mk('black', 'cannon', 2, 7, i++);
  [0, 2, 4, 6, 8].forEach((c) => (empty[3][c] = mk('black', 'soldier', 3, c, i++)));
  back.forEach((t, c) => (empty[9][c] = mk('red', t, 9, c, i++)));
  empty[7][1] = mk('red', 'cannon', 7, 1, i++);
  empty[7][7] = mk('red', 'cannon', 7, 7, i++);
  [0, 2, 4, 6, 8].forEach((c) => (empty[6][c] = mk('red', 'soldier', 6, c, i++)));
  return empty;
};

const computeBoardForGame = (moves) => {
  const b = initialBoard();
  for (const m of moves) {
    const mv = m?.move;
    if (!mv?.from || !mv?.to) continue;
    const fr = mv.from.row, fc = mv.from.col, tr = mv.to.row, tc = mv.to.col;
    const piece = b?.[fr]?.[fc];
    if (!piece) continue;
    b[fr][fc] = null;
    b[tr][tc] = { ...piece, position: { row: tr, col: tc }, hasMoved: true };
  }
  return b;
};

export async function attachThumbnailsToGames(docs) {
  const ids = docs.map((d) => String(d._id));
  const legacyThumbById = new Map();
  const thumbBoardById = new Map();

  for (const d of docs) {
    const st = d.state || {};
    const roomId = String(d._id);
    
    // 1. Try to find a full board in the state
    if (Array.isArray(st.board) && st.board.length === 10) {
      thumbBoardById.set(roomId, st.board);
      continue;
    }

    // 2. Fallback to legacy string positions
    const thumbPosition = Array.isArray(d.lastposition)
      ? d.lastposition
      : Array.isArray(d.position)
        ? d.position
        : Array.isArray(st?.position)
          ? st.position
          : null;
    legacyThumbById.set(roomId, thumbPosition);
  }

  const need = ids.filter((id) => !thumbBoardById.has(id) && !legacyThumbById.get(id));
  if (need.length) {
    try {
      const movesCol = await getMovesCol();
      const cur = movesCol
        .find({ gameId: { $in: need } }, { projection: { _id: 0, gameId: 1, ply: 1, move: 1 } })
        .sort({ gameId: 1, ply: 1 });

      let currentId = null;
      let buf = [];
      while (await cur.hasNext()) {
        const row = await cur.next();
        const gid = String(row.gameId);
        if (currentId == null) currentId = gid;
        if (gid !== currentId) {
          thumbBoardById.set(currentId, computeBoardForGame(buf));
          currentId = gid;
          buf = [];
        }
        buf.push(row);
      }
      if (currentId != null) thumbBoardById.set(currentId, computeBoardForGame(buf));
    } catch (e) {
      logger.error('attachThumbnailsToGames compute failed', e);
    }
  }

  // Attach directly back onto the mutable docs array objects so they can be read easily
  for (const d of docs) {
    const roomId = String(d._id);
    d.thumbBoard = thumbBoardById.get(roomId) || null;
    d.thumbPosition = legacyThumbById.get(roomId) || null;
  }
}
