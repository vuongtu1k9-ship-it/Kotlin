import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getSocket, requestSync, sendMove, joinRoom, watchRoom } from '../net/socket';
import { logger } from '../utils/logger';
import { useToast } from '../components/ui/Toast';
import type { Piece, PieceSide, Move, GameMoveBroadcast, RoomPlayersBroadcast, GameOverBroadcast } from '../types/index';

interface UseBoardSocketProps {
  roomId: string;
  mySide: PieceSide | null;
  myUid: string | null;
  serverMoveIndex: number;
  onlineHistoryRef: React.MutableRefObject<Move[]>;
  replayIndexRef: React.MutableRefObject<number>;
  historyViewIndexRef: React.MutableRefObject<number | null>;
  setPlayerUids: (p: any) => void;
  setSocketConnected: (p: any) => void;
  setSpectators: (p: any[]) => void;
  setStarted: (s: boolean) => void;
  setServerFinished: (f: boolean) => void;
  setServerWinner: (w: PieceSide | null) => void;
  setServerEndedBy: (e: any) => void;
  setOnlineHistory: (h: any) => void;
  setReplayIndex: (i: any) => void;
  setServerMoveIndex: (i: number) => void;
  setServerClockOffset: (o: number) => void;
  setRoomSummary: (s: any) => void;
  setDrawRequest: (r: any) => void;
  setSwapRequest: (r: any) => void;
  setMySide: (s: PieceSide | null) => void;
  applyMove: (m: Move, p?: PieceSide) => void;
  replayFromHistory: (h: any[], p: PieceSide, b?: (Piece | null)[][]) => void;
  onGameOver?: (g: GameOverBroadcast) => void;
  onScored?: (s: any) => void;
}

export const useBoardSocket = (props: UseBoardSocketProps) => {
  const {
    roomId, mySide, myUid, serverMoveIndex, onlineHistoryRef, replayIndexRef, historyViewIndexRef,
    setPlayerUids, setSocketConnected, setSpectators, setStarted, setServerFinished,
    setServerWinner, setServerEndedBy, setOnlineHistory, setReplayIndex,
    setServerMoveIndex, setServerClockOffset, setRoomSummary,
    setDrawRequest, setSwapRequest, setMySide, applyMove, replayFromHistory, onGameOver: onGameOverProp,
    onScored: onScoredProp
  } = props;

  const { t } = useTranslation();
  const { success, warning, info } = useToast();

  const playerUidsRef = useRef<{ red: string | null; black: string | null }>({ red: null, black: null });
  const connectedRef = useRef<{ red: boolean; black: boolean }>({ red: true, black: true });
  const spectatorsCountRef = useRef(0);

  // Stable refs so socket handlers never become stale
  const mySideRef = useRef(mySide);
  useEffect(() => { mySideRef.current = mySide; }, [mySide]);

  const applyMoveRef = useRef(applyMove);
  useEffect(() => { applyMoveRef.current = applyMove; }, [applyMove]);

  const replayFromHistoryRef = useRef(replayFromHistory);
  useEffect(() => { replayFromHistoryRef.current = replayFromHistory; }, [replayFromHistory]);

  // serverMoveIndex is only needed at call-time; read via ref to avoid re-registering listeners
  const serverMoveIndexRef = useRef(serverMoveIndex);
  useEffect(() => { serverMoveIndexRef.current = serverMoveIndex; }, [serverMoveIndex]);

  useEffect(() => {
    if (!roomId) return;
    const s = getSocket();

    const onPlayers = (p: RoomPlayersBroadcast) => {
      if (!p?.roomId || p.roomId !== roomId) return;
      
      const otherSide = mySideRef.current === 'red' ? 'black' : 'red';

      if (p.playerUids) {
        // Welcome notifications
        if (p.playerUids.red && !playerUidsRef.current.red && mySideRef.current !== 'red') success(t('match.redJoined'));
        if (p.playerUids.black && !playerUidsRef.current.black && mySideRef.current !== 'black') success(t('match.blackJoined'));
        
        // Leave notifications
        if (!p.playerUids.red && playerUidsRef.current.red && mySideRef.current !== 'red') warning(t('match.redLeft'));
        if (!p.playerUids.black && playerUidsRef.current.black && mySideRef.current !== 'black') warning(t('match.blackLeft'));

        playerUidsRef.current = p.playerUids;
        setPlayerUids(p.playerUids);
      }

      if (p.started !== undefined) {
        setStarted(p.started);
      }
      
      // Consolidate metadata update - CRITICAL: Don't use fallback if property is present (could be null)
      setRoomSummary((prev: any) => ({
        ...prev,
        playerNames: p.playerNames !== undefined ? p.playerNames : prev?.playerNames,
        playerUids: p.playerUids !== undefined ? p.playerUids : prev?.playerUids,
        players: p.players !== undefined ? p.players : prev?.players,
        started: p.started !== undefined ? p.started : prev?.started,
        finished: p.finished !== undefined ? p.finished : prev?.finished,
        winner: p.winner !== undefined ? p.winner : prev?.winner,
      }));

      if (p.players) {
        if (typeof p.players[otherSide] === 'boolean') {
          const wasConn = connectedRef.current[otherSide];
          const isConn = p.players[otherSide];
          if (wasConn && !isConn) warning(t('match.opponentDisconnected'));
          if (!wasConn && isConn) success(t('match.opponentReconnected'));
          connectedRef.current = { ...p.players };
        }
        setSocketConnected({ red: !!p.players.red, black: !!p.players.black });
      }
      
      if (p.spectators && p.spectators.length > spectatorsCountRef.current) {
        info(t('match.newSpectator', { count: p.spectators.length }));
      }
      spectatorsCountRef.current = p.spectators?.length || 0;
      setSpectators(p.spectators ?? []);
      
      if (p.started === true) setStarted(true);
      if (typeof p.finished === 'boolean') setServerFinished(!!p.finished);
      if (typeof p.winner !== 'undefined') setServerWinner(p.winner ?? null);
      if (typeof p.endedBy !== 'undefined') setServerEndedBy(p.endedBy ?? null);
    };

    const onMove = (m: GameMoveBroadcast) => {
      if (!m?.roomId || m.roomId !== roomId) return;
      console.log('[useBoardSocket DEBUG] game:move received', m);
      const prevLen = onlineHistoryRef.current.length;
      const viewingHistory = historyViewIndexRef.current !== null;
      const atLiveEdge = !viewingHistory || (replayIndexRef.current === prevLen);

      onlineHistoryRef.current = [...onlineHistoryRef.current, { ...m.move, side: m.side } as any];
      if (atLiveEdge) {
        replayIndexRef.current = prevLen + 1;
      }

      setOnlineHistory(onlineHistoryRef.current);
      if (atLiveEdge) setReplayIndex(replayIndexRef.current);
      setServerMoveIndex(m.serverMoveIndex ?? 0);
      if (m.started !== undefined) setStarted(m.started);
      
      if (m.clock) {
        setRoomSummary((prev: any) => ({ ...prev, clock: m.clock, serverTime: m.serverTime }));
      }
      if (m.serverTime) {
        setServerClockOffset(m.serverTime - Date.now());
      }

      if (atLiveEdge) {
        applyMoveRef.current(m.move, m.currentPlayer);
      }
    };

    const onGameState = (payload: any) => {
      if (!payload?.roomId || payload.roomId !== roomId) return;
      
      onlineHistoryRef.current = payload.moveHistory || [];
      replayIndexRef.current = onlineHistoryRef.current.length;
      
      setOnlineHistory(onlineHistoryRef.current);
      setReplayIndex(replayIndexRef.current);
      setServerMoveIndex(payload.serverMoveIndex || 0);
      if (payload.started !== undefined) {
        setStarted(payload.started);
      }
      if (payload.playerUids) {
        setPlayerUids(payload.playerUids);
        setRoomSummary((prev: any) => ({
          ...prev,
          playerUids: payload.playerUids,
          players: payload.players ? { ...prev?.players, ...payload.players } : prev?.players
        }));
      }
      if (typeof payload.started === 'boolean') setStarted(payload.started);
      if (typeof payload.finished === 'boolean') setServerFinished(payload.finished);
      
      replayFromHistoryRef.current(onlineHistoryRef.current, payload.currentPlayer || 'red', payload.board);
    };

    const onGameOver = (g: any) => {
      if (!g?.roomId || g.roomId !== roomId) return;
      logger.info('[useBoardSocket] game:over received', g);
      setServerFinished(true);
      setServerWinner(g.winner);
      setServerEndedBy(g.reason || g.endedBy); // Use detailed reason if available
      
      // Delay the external callback to match the modal delay in Board.tsx
      setTimeout(() => {
        if (onGameOverProp) onGameOverProp(g);
      }, 1200);
    };

    const onRoomUpdate = (u: any) => {
      if (!u?.roomId || u.roomId !== roomId) return;
      if (u.serverTime) setServerClockOffset(u.serverTime - Date.now());
      setRoomSummary(u);
      
      // Update core states from room update
      if (u.started !== undefined) {
        setStarted(u.started);
      }
      if (u.playerUids) {
        setPlayerUids(u.playerUids);
      }
    };
    
    const onStart = (payload: any) => {
      setStarted(true);
      success(t('match.started'));
      if (payload.playerUids) setPlayerUids(payload.playerUids);
    };

    const onDrawReq = (p: { roomId: string, side: PieceSide }) => {
      if (p.roomId !== roomId) return;
      // Don't show draw request to the sender or spectators
      if (!mySideRef.current || mySideRef.current === p.side) return;
      setDrawRequest(p);
    };
    const onDrawDeclined = (p: { roomId: string, side: PieceSide }) => {
      if (p.roomId !== roomId) return;
      // Notify the requester (who is NOT the one who declined)
      if (mySideRef.current && mySideRef.current !== p.side) {
        success(t('match.drawDeclined'));
      }
      setDrawRequest(null);
    };
    const onSwapReq = (p: { roomId: string, side: PieceSide }) => {
      console.log('[useBoardSocket DEBUG] Received game:swap:request (ANY)', p);
      if (!p?.roomId || p.roomId !== roomId) return;
      if (mySideRef.current && p.side !== mySideRef.current) setSwapRequest(p);
    };
    const onSwapDeclined = (p: { roomId: string, side: PieceSide }) => {
      if (p.roomId !== roomId) return;
      if (mySideRef.current && mySideRef.current !== p.side) {
        success(t('match.swapDeclined'));
      }
      setSwapRequest(null);
    };
    const onSwapSuccess = (p: { roomId: string, side: PieceSide, opSide: PieceSide }) => {
      if (p.roomId !== roomId) return;
      
      const prevSide = mySideRef.current;
      if (prevSide === p.side) {
        setMySide(p.opSide);
        success(t('match.swapSuccess', { side: p.opSide === 'red' ? t('common.sides.red') : t('common.sides.black') }));
      } else if (prevSide === p.opSide) {
        setMySide(p.side);
        success(t('match.swapSuccess', { side: p.side === 'red' ? t('common.sides.red') : t('common.sides.black') }));
      }
      
      setSwapRequest(null);
    };



    const performFullSync = async (rid: string) => {
      const sync = await requestSync(rid) as any;
      if (sync?.ok) {
        onlineHistoryRef.current = sync.moveHistory || [];
        replayIndexRef.current = onlineHistoryRef.current.length;
        setOnlineHistory(onlineHistoryRef.current);
        setReplayIndex(replayIndexRef.current);
        setServerMoveIndex(sync.serverMoveIndex || 0);
        setStarted(!!sync.started);
        if (sync.players) setRoomSummary(sync);
        if (typeof sync.finished === 'boolean') setServerFinished(sync.finished);
        if (sync.playerUids) setPlayerUids(sync.playerUids);
        if (sync.winner !== undefined) setServerWinner(sync.winner ?? null);
        if (sync.endedBy !== undefined) setServerEndedBy(sync.endedBy ?? null);
        replayFromHistoryRef.current(onlineHistoryRef.current, sync.currentPlayer || 'red', sync.board);
        
        // Recover mySide from playerUids if we don't know it yet
        if (!mySideRef.current && myUid && sync.playerUids) {
          if (sync.playerUids.red === String(myUid)) {
            logger.info('[useBoardSocket] Recovered mySide=red from sync playerUids');
            setMySide('red');
          } else if (sync.playerUids.black === String(myUid)) {
            logger.info('[useBoardSocket] Recovered mySide=black from sync playerUids');
            setMySide('black');
          }
        }

        // --- CRITICAL: Ensure the socket is joined to the Room for broadcasts ---
        // If we are NOT a player, we must explicitly "watch" the room to get game:move events.
        if (!mySideRef.current) {
          logger.info(`[useBoardSocket] Sync ok but not a player. Watching room ${rid} for updates...`);
          await watchRoom(rid).catch(err => logger.debug('Watch room failed', err));
        }
      } else if (sync?.error === 'ROOM_NOT_FOUND') {
        logger.warn(`[useBoardSocket] Room ${rid} not found during sync. Watching as spectator.`);
        await watchRoom(rid).catch(err => logger.debug('Watch room failed', err));
      } else {
        logger.error(`[useBoardSocket] Sync failed for room ${rid}`, sync);
      }
    };

    const onConnect = () => {
      logger.info(`[useBoardSocket] Socket (re)connected (id: ${s.id}). Syncing room ${roomId}...`);
      
      // Try to join as player first if we were one
      if (mySideRef.current) {
         joinRoom(roomId).then((ack: any) => {
            if (ack.ok) {
              logger.info(`[useBoardSocket] Auto-rejoined room ${roomId} as ${ack.side}.`);
              performFullSync(roomId);
            } else {
              logger.warn(`[useBoardSocket] Auto-rejoin failed: ${ack.error}. Falling back to spectator sync.`);
              performFullSync(roomId);
            }
         });
      } else {
         // Not a player, just sync and it will trigger watchRoom inside performFullSync
         performFullSync(roomId);
      }
    };

    const onScored = (payload: any) => {
      logger.info('[useBoardSocket] game:scored received', payload);
      if (onScoredProp) onScoredProp(payload);
    };

    s.on('room:players', onPlayers);
    s.on('room:update', onRoomUpdate);
    s.on('game:move', onMove);
    s.on('game:over', onGameOver);
    s.on('game:scored', onScored);
    s.on('game:draw:request', onDrawReq);
    s.on('game:draw:declined', onDrawDeclined);
    s.on('game:swap:request', onSwapReq);
    s.on('game:swap:declined', onSwapDeclined);
    s.on('game:swap:success', onSwapSuccess);
    s.on('game:state', onGameState);
    s.on('game:start', onStart);
    s.on('connect', onConnect);

    // ─── CRITICAL: if socket is already connected when this effect runs
    if (s.connected) {
      logger.info(`[useBoardSocket] Socket already connected on mount. Syncing state for room ${roomId}...`);
      performFullSync(roomId).catch(e => logger.error('[useBoardSocket] Mount sync error', e));
    }

    logger.info(`[useBoardSocket] Registered listeners for room: ${roomId}`);

    return () => {
      s.off('connect', onConnect);
      s.off('room:players', onPlayers);
      s.off('room:update', onRoomUpdate);
      s.off('game:move', onMove);
      s.off('game:over', onGameOver);
      s.off('game:scored', onScored);
      s.off('game:draw:request', onDrawReq);
      s.off('game:draw:declined', onDrawDeclined);
      s.off('game:swap:request', onSwapReq);
      s.off('game:swap:declined', onSwapDeclined);
      s.off('game:swap:success', onSwapSuccess);
      s.off('game:state', onGameState);
      s.off('game:start', onStart);
      s.emit('room:leave', { roomId });
      logger.info(`[useBoardSocket] Emitted room:leave for room: ${roomId}`);
      logger.warn(`[useBoardSocket] Unregistered listeners for room: ${roomId}`);
    };
    // ⚠️ Only roomId as dependency. All mutable variables use refs to avoid re-mounting on each state update.
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    handleMove: async (move: Move, clientMoveIndex: number): Promise<any> => {
      const serverMoveIndex = serverMoveIndexRef.current;
      let ack = await sendMove({ roomId, move, clientMoveIndex, lastServerMoveIndex: serverMoveIndex });
      
      if (!ack.ok) {
        logger.warn(`[useBoardSocket] Move rejected by server: ${(ack as any).error}`, { roomId, move, clientMoveIndex, serverMoveIndex });
      }

      // If server forgot our session, re-join and retry
      if (!ack.ok && (ack as any).error === 'NOT_IN_ROOM') {
        logger.info(`[useBoardSocket] Attempting to auto-rejoin room ${roomId} to recover session...`);
        const joinAck = await joinRoom(roomId);
        if ((joinAck as any).ok) {
          logger.info(`[useBoardSocket] Re-joined room successfully. Retrying move...`);
          ack = await sendMove({ roomId, move, clientMoveIndex, lastServerMoveIndex: serverMoveIndex });
          if (!ack.ok) logger.error(`[useBoardSocket] Retry move failed: ${(ack as any).error}`);
        } else {
          logger.error(`[useBoardSocket] Failed to re-join room: ${(joinAck as any).error}`);
        }
      }

      if (!ack.ok && (ack as any).error === 'OUT_OF_SYNC') {
        logger.warn(`[useBoardSocket] Out of sync, requesting full state sync for room ${roomId}...`);
        const sync = await requestSync(roomId);
        if (sync?.ok) {
          replayFromHistoryRef.current(sync.moveHistory ?? [], sync.currentPlayer ?? 'red');
          setServerMoveIndex(sync.serverMoveIndex ?? 0);
          setStarted(!!sync.started);
          logger.info(`[useBoardSocket] State synced. Retrying move with new server index ${sync.serverMoveIndex}...`);
          ack = await sendMove({ roomId, move, clientMoveIndex, lastServerMoveIndex: sync.serverMoveIndex ?? 0 });
          if (!ack.ok) logger.error(`[useBoardSocket] Retry move failed after sync: ${(ack as any).error}`);
        } else {
          logger.error(`[useBoardSocket] State sync failed for room ${roomId}`);
        }
      }
      return ack;
    }
  };
};
