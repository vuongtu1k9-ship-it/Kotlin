import express from 'express';
import { logger } from '../../logger.mjs';
import { getDb, toQueryId } from '../../mongo.mjs';
import { clearTournamentCache } from '../../services/cache.mjs';
import { requireUser } from '../../utils/auth.mjs';
import { ensureUserFromJwtPayload } from '../../users.mjs';

const router = express.Router();

router.post('/tournaments/:id/join', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const db = await getDb();
    const col = db.collection('tournaments');
    const doc = await col.findOne({ _id: toQueryId(req.params.id) });
    if (!doc) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    
    if (doc.status !== 'registration') return res.status(400).json({ ok: false, error: 'NOT_IN_REGISTRATION' });

    if (doc.registrationDeadline && Date.now() > new Date(doc.registrationDeadline).getTime()) {
      return res.status(400).json({ ok: false, error: 'REGISTRATION_CLOSED', detail: 'Đã hết thời hạn ghi danh.' });
    }
    if (doc.maxPlayers && doc.players.length >= doc.maxPlayers) {
      return res.status(400).json({ ok: false, error: 'TOURNAMENT_FULL', detail: `Giải đã đủ ${doc.maxPlayers} kỳ thủ.` });
    }
    const uid = user.uid;
    if (doc.players.includes(uid)) return res.json({ ok: true, alreadyJoined: true });
    if (doc.pendingPlayers?.includes(uid)) return res.json({ ok: true, pending: true });

    if (doc.minElo || doc.maxElo) {
      const dbUser = await ensureUserFromJwtPayload(user);
      const elo = dbUser?.elo || 1200;
      if (doc.minElo && elo < doc.minElo) {
        return res.status(400).json({ ok: false, error: 'ELO_TOO_LOW', detail: `Yêu cầu ELO tối thiểu ${doc.minElo}. ELO của bạn: ${elo}.` });
      }
      if (doc.maxElo && elo > doc.maxElo) {
        return res.status(400).json({ ok: false, error: 'ELO_TOO_HIGH', detail: `ELO của bạn (${elo}) vượt quá mức tối đa ${doc.maxElo}.` });
      }
    }

    if (doc.requireApproval) {
      await col.updateOne({ _id: toQueryId(req.params.id) }, {
        $push: { pendingPlayers: uid },
        $set: { updatedAt: Date.now() }
      });
      await clearTournamentCache();
      return res.json({ ok: true, pending: true, message: 'Đơn ghi danh đã được gửi, chờ admin duyệt.' });
    }

    const usersCol = db.collection('users');
    const dbUserJoin = await usersCol.findOne({ uid });
    const name = dbUserJoin?.name || user.name || uid;
    const picture = dbUserJoin?.picture || null;

    await col.updateOne(
      { _id: toQueryId(req.params.id) },
      { 
        $push: { 
          players: uid,
          standings: { 
            uid, name, picture,
            points: 0, played: 0, wins: 0, draws: 0, losses: 0, byes: 0, 
          }
        },
        $set: { updatedAt: Date.now() } 
      }
    );
    await clearTournamentCache();
    return res.json({ ok: true });
  } catch (e) {
    logger.error('[TOURNAMENT] POST /tournaments/:id/join failed:', e.message);
    return res.status(500).json({ ok: false, error: 'JOIN_FAILED' });
  }
});

export default router;
