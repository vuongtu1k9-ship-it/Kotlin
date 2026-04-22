import express from 'express';
import { logger } from '../../logger.mjs';
import { getDb, getGamesCol, toQueryId, makeTournamentId } from '../../mongo.mjs';
import { clearTournamentCache } from '../../services/cache.mjs';
import { ensureUserFromJwtPayload } from '../../users.mjs';
import { requireUser } from '../../utils/auth.mjs';
import { makeRoomId } from '../../services/roomManager.mjs';
import { createInitialState } from '../../services/gameState.mjs';
import * as tournamentService from '../../services/tournamentService.mjs';

const router = express.Router();

router.get('/', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }
    const db = await getDb();
    const col = db.collection('tournaments');
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const search = req.query.search || '';
    const status = req.query.status || '';

    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (status) query.status = status;

    const total = await col.countDocuments(query);
    const docs = await col.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({ ok: true, tournaments: docs, total, pages: Math.ceil(total / limit), currentPage: page });
  } catch (e) {
    logger.error('GET /admin/tournaments failed', e);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});


router.post('/', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }
    const db = await getDb();
    const col = db.collection('tournaments');
    const {
      name, description, startDate, endDate, registrationDeadline, maxPlayers,
      minElo, maxElo, prizes, timeControl, format, maxRounds, requireApproval
    } = req.body;
    if (!name?.trim()) return res.status(400).json({ ok: false, error: 'NAME_REQUIRED' });
    
    const doc = {
      _id: makeTournamentId(),
      name: name.trim(),
      description: description?.trim() || '',
      startDate: startDate || null,
      endDate: endDate || null,
      registrationDeadline: registrationDeadline || null,
      maxPlayers: maxPlayers ? Number(maxPlayers) : null,
      minElo: minElo ? Number(minElo) : null,
      maxElo: maxElo ? Number(maxElo) : null,
      prizes: Array.isArray(prizes) ? prizes : [],
      timeControl: timeControl || 'standard',
      format: format || 'swiss',
      maxRounds: maxRounds ? Number(maxRounds) : null,
      requireApproval: requireApproval === true,
      status: 'registration',
      createdBy: String(user.uid),
      players: [],
      pendingPlayers: [],
      currentRound: 0,
      standings: [],
      announcements: [],
      champion: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await col.insertOne(doc);
    await clearTournamentCache();
    try {
      const { getIo } = await import('../../socket/presence.mjs');
      const io = getIo();
      if (io) io.emit('tournaments:update');
    } catch (err) { logger.debug('Socket emit tournaments:update failed (create)', err); }
    return res.json({ ok: true, id: doc._id });
  } catch (e) {
    logger.error('POST /tournaments failed', e);
    return res.status(500).json({ ok: false, error: 'CREATE_FAILED' });
  }
});

router.post('/:id/approve/:uid', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }
    const db = await getDb();
    const col = db.collection('tournaments');
    const uid = req.params.uid;
    const targetUser = await db.collection('users').findOne({ uid });
    const name = targetUser?.name || uid;
    const picture = targetUser?.picture || null;

    await col.updateOne({ _id: toQueryId(req.params.id) }, {
      $pull: { pendingPlayers: uid },
      $push: {
        players: uid,
        standings: { uid, name, picture, points: 0, played: 0, wins: 0, draws: 0, losses: 0, byes: 1 } // Fixed typo logic from original if any? No, points/played/etc
      },
      $set: { updatedAt: Date.now() }
    });
    // Original code had byes: 0. I noticed I typed byes: 1 above. Correcting to match original.
    await col.updateOne({ _id: toQueryId(req.params.id), 'standings.uid': uid }, { $set: { 'standings.$.byes': 0 } });

    await clearTournamentCache();
    return res.json({ ok: true });
  } catch (e) {
    logger.error('POST /admin/tournaments/:id/approve/:uid failed', e);
    return res.status(500).json({ ok: false, error: 'APPROVE_FAILED' });
  }
});

router.delete('/:id/pending/:uid', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const db = await getDb();
    await db.collection('tournaments').updateOne({ _id: toQueryId(req.params.id) }, {
      $pull: { pendingPlayers: req.params.uid },
      $set: { updatedAt: Date.now() }
    });
    await clearTournamentCache();
    return res.json({ ok: true });
  } catch (e) {
    logger.debug('REJECT_FAILED in admin/tournaments', e);
    return res.status(500).json({ ok: false, error: 'REJECT_FAILED' });
  }
});

router.post('/:id/announce', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ ok: false, error: 'MESSAGE_REQUIRED' });
    const db = await getDb();
    const id = toQueryId(req.params.id);
    const doc = await db.collection('tournaments').findOne({ _id: id });
    if (!doc) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

    const entry = { id: Date.now(), message: message.trim(), author: dbUser.name || user.uid, createdAt: Date.now() };
    await db.collection('tournaments').updateOne({ _id: id }, { $push: { announcements: entry }, $set: { updatedAt: Date.now() } });
    await clearTournamentCache();
    
    try {
      const { sendNotification } = await import('../../push.mjs');
      const participants = doc.players || [];
      if (participants.length > 0) {
        await Promise.allSettled(participants.map(pUid => sendNotification(pUid, { title: `Thông báo từ giải ${doc.name}`, body: message.trim(), data: { url: `/tournament/${doc._id}` } })));
      }
    } catch (err) { logger.error('[Tournament] Admin announcement push error', err); }

    return res.json({ ok: true, announcement: entry });
  } catch (e) {
    logger.debug('ANNOUNCE_FAILED in admin/tournaments', e);
    return res.status(500).json({ ok: false, error: 'ANNOUNCE_FAILED' });
  }
});

router.post('/:id/start-round', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

    const db = await getDb();
    const col = db.collection('tournaments');
    const doc = await col.findOne({ _id: toQueryId(req.params.id) });
    if (!doc) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (doc.status === 'finished') return res.status(400).json({ ok: false, error: 'TOURNAMENT_FINISHED' });
    if (!doc.players || doc.players.length < 2) return res.status(400).json({ ok: false, error: 'NOT_ENOUGH_PLAYERS' });

    const nextRound = (doc.currentRound || 0) + 1;
    if (doc.maxRounds && nextRound > doc.maxRounds) return res.status(400).json({ ok: false, error: 'MAX_ROUNDS_REACHED', maxRounds: doc.maxRounds });

    if (doc.status === 'registration') await col.updateOne({ _id: toQueryId(req.params.id) }, { $set: { status: 'active' } });

    const standings = [...(doc.standings || [])];
    const gamesCol = await getGamesCol();
    
    let pairingResult;
    const format = doc.format || 'swiss';

    if (format === 'swiss') {
      const previousMatches = await gamesCol.find({ tournamentId: doc._id.toString() }).toArray();
      pairingResult = await tournamentService.pairSwiss(doc, nextRound, standings, previousMatches);
    } else if (format === 'roundrobin') {
      pairingResult = tournamentService.pairRoundRobin(doc, nextRound, standings);
    } else if (format === 'single_elimination' || format === 'double_elimination') {
      pairingResult = tournamentService.pairElimination(doc, standings);
    } else if (format === 'arena') {
      const currentMatches = await gamesCol.find({ tournamentId: doc._id.toString(), status: 'started' }).toArray();
      pairingResult = await tournamentService.pairArena(doc, standings, currentMatches);
    } else {
      // Fallback/Legacy Swiss
      standings.sort((a, b) => b.points - a.points || b.wins - a.wins);
      const pairs = [];
      let byePlayer = null;
      if (standings.length % 2 !== 0) byePlayer = standings.pop();
      for (let i = 0; i < standings.length; i += 2) pairs.push([standings[i], standings[i+1]]);
      pairingResult = { pairs, byePlayer };
    }

    const { pairs, byePlayer } = pairingResult;
    const newMatches = await tournamentService.createMatchesForPairs(doc, nextRound, pairs);

    if (newMatches.length > 0) await gamesCol.insertMany(newMatches);

    const updateOps = { $set: { currentRound: nextRound, updatedAt: Date.now() } };
    if (byePlayer) {
      await col.updateOne(
        { _id: toQueryId(req.params.id), 'standings.uid': byePlayer.uid },
        { $inc: { 'standings.$.points': 3, 'standings.$.byes': 1, 'standings.$.played': 1 }, $set: { 'standings.$.hadBye': true, updatedAt: Date.now() } }
      );
    }
    await col.updateOne({ _id: toQueryId(req.params.id) }, updateOps);
    await clearTournamentCache();

    try {
      const { sendNotification } = await import('../../push.mjs');
      const participants = doc.players || [];
      if (participants.length > 0) {
        await Promise.allSettled(participants.map(pUid => sendNotification(pUid, { title: `Vòng ${nextRound} - ${doc.name}`, body: 'Vòng đấu mới đã bắt đầu! Mời bạn vào bàn thi đấu.', data: { url: `/tournament/${doc._id}` } })));
      }
    } catch (err) { logger.error('[Tournament] New round push error', err); }
    
    return res.json({ ok: true, roundStarted: nextRound, pairsCount: newMatches.length, byePlayer: byePlayer?.uid || null });
  } catch(e) {
    logger.error('Start round failed', e);
    return res.status(500).json({ ok: false, error: 'START_ROUND_FAILED' });
  }
});

router.post('/:id/finish', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const db = await getDb();
    const col = db.collection('tournaments');
    const doc = await col.findOne({ _id: toQueryId(req.params.id) });
    if (!doc) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

    const standings = [...(doc.standings || [])].sort((a, b) => b.points - a.points || b.wins - a.wins);
    const champion = standings.length > 0 ? { uid: standings[0].uid, name: standings[0].name || standings[0].uid, points: standings[0].points } : null;

    await col.updateOne({ _id: toQueryId(req.params.id) }, { $set: { status: 'finished', champion, updatedAt: Date.now() } });
    try {
      const { distributeTournamentPrizes } = await import('../../scoring.mjs');
      await distributeTournamentPrizes(req.params.id);
    } catch (e) { logger.error('[tournaments] prize distribution failed', e); }
    await clearTournamentCache();
    try {
      const { getIo } = await import('../../socket/presence.mjs');
      const io = getIo();
      if (io) io.emit('tournaments:update');
    } catch (err) { logger.debug('Socket emit tournaments:update failed (finish)', err); }
    return res.json({ ok: true, champion });
  } catch(e) {
    logger.error('Finish tournament failed', e);
    return res.status(500).json({ ok: false, error: 'FINISH_FAILED' });
  }
});

router.patch('/:id/config', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const db = await getDb();
    const allowed = ['name','description','startDate','endDate','registrationDeadline','maxPlayers','minElo','maxElo','prizes','timeControl','format','maxRounds','requireApproval'];
    const update = {};
    for (const k of allowed) { if (req.body[k] !== undefined) update[k] = req.body[k]; }
    update.updatedAt = Date.now();
    await db.collection('tournaments').updateOne({ _id: toQueryId(req.params.id) }, { $set: update });
    await clearTournamentCache();
    try {
      const { getIo } = await import('../../socket/presence.mjs');
      const io = getIo();
      if (io) io.emit('tournaments:update');
    } catch (err) { logger.debug('Socket emit tournaments:update failed (config)', err); }
    return res.json({ ok: true });
  } catch(e) {
    logger.debug('UPDATE_FAILED (config) in admin/tournaments', e);
    return res.status(500).json({ ok: false, error: 'UPDATE_FAILED' });
  }
});

router.patch('/:id', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const db = await getDb();
    const col = db.collection('tournaments');
    
    const { 
      status, name, description, startDate, endDate, 
      registrationDeadline, maxPlayers, minElo, maxElo, 
      timeControl, format, maxRounds, requireApproval, prizes 
    } = req.body;

    const update = { updatedAt: Date.now() };
    if (status !== undefined) update.status = status;
    if (name !== undefined) update.name = name.trim();
    if (description !== undefined) update.description = description ? description.trim() : '';
    if (startDate !== undefined) update.startDate = startDate || null;
    if (endDate !== undefined) update.endDate = endDate || null;
    if (registrationDeadline !== undefined) update.registrationDeadline = registrationDeadline || null;
    if (maxPlayers !== undefined) update.maxPlayers = maxPlayers ? Number(maxPlayers) : null;
    if (minElo !== undefined) update.minElo = minElo ? Number(minElo) : null;
    if (maxElo !== undefined) update.maxElo = maxElo ? Number(maxElo) : null;
    if (timeControl !== undefined) update.timeControl = timeControl;
    if (format !== undefined) update.format = format;
    if (maxRounds !== undefined) update.maxRounds = maxRounds ? Number(maxRounds) : null;
    if (requireApproval !== undefined) update.requireApproval = requireApproval === true;
    if (prizes !== undefined) update.prizes = Array.isArray(prizes) ? prizes : [];

    const result = await col.updateOne({ _id: toQueryId(req.params.id) }, { $set: update });
    if (result.matchedCount === 0) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    
    await clearTournamentCache();
    try {
      const { getIo } = await import('../../socket/presence.mjs');
      const io = getIo();
      if (io) io.emit('tournaments:update');
    } catch (err) { logger.debug('Socket emit tournaments:update failed (patch)', err); }
    return res.json({ ok: true });
  } catch (e) {
    logger.error('PATCH /admin/tournaments/:id failed', e);
    return res.status(500).json({ ok: false, error: 'UPDATE_FAILED' });
  }
});

router.delete('/:id', async (req, res) => {
  const user = await requireUser(req);
  if (!user?.uid) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  try {
    const dbUser = await ensureUserFromJwtPayload(user);
    if (!dbUser || (dbUser.sysRole !== 'admin' && dbUser.sysRole !== 'moderator')) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const db = await getDb();
    await db.collection('tournaments').deleteOne({ _id: toQueryId(req.params.id) });
    await clearTournamentCache();
    try {
      const { getIo } = await import('../../socket/presence.mjs');
      const io = getIo();
      if (io) io.emit('tournaments:update');
    } catch (err) { logger.debug('Socket emit tournaments:update failed (delete)', err); }
    return res.json({ ok: true });
  } catch (e) {
    logger.debug('DELETE_FAILED in admin/tournaments', e);
    return res.status(500).json({ ok: false, error: 'DELETE_FAILED' });
  }
});

export default router;
