import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PieceSide, LobbyRoomSummary, Piece } from '../types';
import { Confirm } from './ui/Dialog';
import { ExportButtons } from './ExportButtons';

interface BoardControlsProps {
  gameOver: boolean;
  winner: PieceSide | null;
  endedBy: string | null;
  started: boolean;
  serverFinished: boolean;
  socketConnected: { red: boolean; black: boolean };
  mySide: PieceSide | null;
  handleRequestDraw: () => void;
  handleResign: () => Promise<any> | void;
  handleLeaveRoom: () => void;
  handleNewGame: () => void;
  handleUndo: () => void;
  handleSwap: () => void;
  roomId: string;
  onlineHistoryLength: number;
  moveHistoryLength: number;
  hideLobby?: boolean;
  lobbyRooms: LobbyRoomSummary[];
  onRefreshLobby: () => void;
  isAiGame?: boolean;
  board?: (Piece | null)[][];
  currentPlayer?: PieceSide;
  boardRef?: React.RefObject<HTMLDivElement>;
}

export const BoardControls: React.FC<BoardControlsProps> = ({
  gameOver, winner, endedBy, started, serverFinished,
  socketConnected, mySide, roomId, onlineHistoryLength, moveHistoryLength,
  lobbyRooms, hideLobby, onRefreshLobby, handleRequestDraw, handleResign,
  handleLeaveRoom, handleNewGame, handleUndo, handleSwap, board, currentPlayer, boardRef
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'warning' | 'danger' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: () => {}
  });

  const btnWide = 'inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-[11px] font-black uppercase tracking-wider text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-10 transition-all active:scale-95';

  return (
    <div className="flex flex-col gap-0 bg-[#0B0F19]/50">
      {/* ── Status row ── */}
      <div className="px-4 pt-4 pb-2">
        {gameOver ? (
          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-xq-gold/10 border border-xq-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.05)] animate-in zoom-in-95 duration-500">
            <div className="flex items-center gap-2">
              <span className="text-xl rotate-12" aria-hidden="true">{winner ? '🏆' : '🤝'}</span>
              <span className="text-xs font-black text-xq-gold uppercase tracking-widest">
                {winner ? t(`game.status.${winner}Win`) : t('game.status.draw')}
              </span>
            </div>
            <div className="text-[10px] text-white/70 font-bold uppercase tracking-[0.2em] border-t border-white/5 pt-2">
              {t([`game.panel.reasons.${endedBy}`, 'game.panel.reasons.default'])}
            </div>
          </div>
        ) : (
          <div className="text-xs min-h-[28px] flex items-center gap-2 px-1">
            {started && !serverFinished && roomId && mySide && !socketConnected[mySide === 'red' ? 'black' : 'red'] && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 font-black text-[10px] uppercase tracking-wider border border-orange-500/20 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)]" /> {t('match.opponentDisconnected')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Action buttons row ── */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-2 mt-2">
        {roomId && mySide && (
          <>
            <button 
              onClick={() => {
                if (!started || serverFinished) return;
                setConfirmDialog({
                  isOpen: true,
                  title: t('game.confirm.drawTitle'),
                  message: t('game.confirm.drawMsg'),
                  variant: 'info',
                  onConfirm: handleRequestDraw
                });
              }}
              disabled={!started || serverFinished}
              className="h-10 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase border border-blue-500/20 transition-all disabled:opacity-10 active:scale-95 flex items-center justify-center gap-2"
            >
              <span aria-hidden="true">🤝</span> {t('game.actions.draw')}
            </button>
            <button
              onClick={() => {
                if (!started || serverFinished) return;
                setConfirmDialog({
                  isOpen: true,
                  title: t('game.confirm.resignTitle'),
                  message: t('game.confirm.resignMsg'),
                  variant: 'danger',
                  onConfirm: () => { handleResign(); }
                });
              }}
              disabled={!started || serverFinished}
              className="h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase border border-red-500/20 transition-all disabled:opacity-10 active:scale-95 flex items-center justify-center gap-2"
            >
              <span aria-hidden="true">🏳️</span> {t('game.actions.resign')}
            </button>
          </>
        )}

        {roomId && (
          <button
            className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
            onClick={() => {
              const isPlayer = mySide !== null;
              const activeGame = started && !serverFinished && isPlayer && onlineHistoryLength > 0;
              
              if (activeGame) {
                setConfirmDialog({
                  isOpen: true,
                  title: t('game.confirm.leaveTitle'),
                  message: t('game.confirm.leaveMsg'),
                  variant: 'danger',
                  onConfirm: () => {
                    const res = handleResign();
                    if (res instanceof Promise) res.then(() => handleLeaveRoom());
                    else handleLeaveRoom();
                  }
                });
              } else {
                setConfirmDialog({
                  isOpen: true,
                  title: t('game.actions.leave'),
                  message: isPlayer ? t('game.confirm.leaveMsg_casual', { defaultValue: 'Bạn muốn rời phòng chơi?' }) : t('game.confirm.leaveMsg_spectator', { defaultValue: 'Bấm xác nhận để ngừng xem ván đấu này.' }),
                  variant: 'info',
                  onConfirm: () => handleLeaveRoom()
                });
              }
            }}
            disabled={serverFinished && !gameOver}
          >
            <span aria-hidden="true">🚪</span> {t('game.actions.leave')}
          </button>
        )}

        {roomId && mySide !== null && (!started || onlineHistoryLength === 0) && socketConnected.red && socketConnected.black && !serverFinished && (
           <button className={btnWide} type="button" onClick={handleSwap}>
             <span aria-hidden="true">🔄</span> {t('game.actions.swap')}
           </button>
        )}
        
        {((!roomId) || (roomId && mySide !== null && serverFinished)) && (
          <button className="h-10 px-5 rounded-xl bg-xq-gold text-black text-[10px] font-black uppercase shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:bg-white transition-all active:scale-95" type="button" onClick={handleNewGame}>{t('game.actions.newGame')}</button>
        )}

        {!roomId && (
          <button 
            className={btnWide} 
            type="button" 
            onClick={() => {
              if (moveHistoryLength === 0) return;
              setConfirmDialog({
                isOpen: true,
                title: t('game.actions.undo'),
                message: t('game.confirm.undoMsg', { defaultValue: 'Bạn có chắc chắn muốn quay lại nước đi trước đó?' }),
                variant: 'info',
                onConfirm: handleUndo
              });
            }} 
            disabled={moveHistoryLength === 0}
          >
            ↩️ {t('game.actions.undo')}
          </button>
        )}
      </div>

      {board && currentPlayer && boardRef && (
        <div className="px-4 pb-4 border-t border-white/5 pt-4">
           <ExportButtons board={board} currentPlayer={currentPlayer} boardRef={boardRef} />
        </div>
      )}

      {/* Lobby - Re-styled cards */}
      {!hideLobby && !roomId && (
        <div className="mx-4 mb-4 mt-2 rounded-[24px] bg-white/[0.03] border border-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">{t('game.lobbyTitle')}</h3>
            <button className="text-[10px] font-black text-xq-gold hover:text-white transition-colors uppercase tracking-widest" type="button" onClick={onRefreshLobby}>{t('common.refresh')}</button>
          </div>
          <div className="space-y-2.5">
            {lobbyRooms.slice(0, 5).map((r) => (
              <div key={r.roomId} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-xq-gold/30 hover:bg-white/[0.06] transition-all group cursor-pointer" onClick={() => navigate(`/game/${r.roomId}`)}>
                <div className="w-9 h-9 rounded-xl bg-xq-gold/10 border border-xq-gold/20 flex items-center justify-center text-xq-gold font-mono text-[10px] shadow-inner font-black">#</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-black text-white/90 uppercase truncate tracking-tight">{r.roomId}</div>
                  <div className="text-[9px] text-white/60 font-bold flex items-center gap-2 mt-0.5 uppercase tracking-tighter">
                     <span className={r.players.red && r.players.black ? 'text-red-500' : 'text-emerald-500'}>{r.status}</span>
                     <span className="opacity-40">•</span>
                     <span>{r.spectators?.length ?? 0} {t('game.spectators.label_short')}</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-xq-gold/10 flex items-center justify-center translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-xq-gold">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            ))}
            {lobbyRooms.length === 0 && <div className="text-center py-6 text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">{t('lobby.waiting')}</div>}
          </div>
        </div>
      )}

      <Confirm
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
      />
    </div>
  );
};
