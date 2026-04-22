import React from 'react';
import { useTranslation } from 'react-i18next';
import { Board } from '../Board';
import { PracticeLesson, PracticeBoard } from '../../hooks/usePracticeData';
import { fenToBoard } from '../../utils/fen';
import { parseUCI } from '../../utils/boardUtils';
import { RichContentRenderer } from '../RichContentRenderer';

interface PracticeBoardSectionProps {
  selectedLesson: PracticeLesson;
  activeBoardIndex: number;
  setActiveBoardIndex: (idx: number) => void;
  replayIndex: number;
  setReplayIndex: (idx: number) => void;
  isAutoPlaying: boolean;
  setIsAutoPlaying: (val: boolean) => void;
  aiConfig: any;
  humanSide: 'red' | 'black';
  historyViewIndex: number | null;
  setHistoryViewIndex: (idx: number | null) => void;
  onStateChange: (state: any) => void;
  handleCellHover: (r: number, c: number, e: React.MouseEvent) => void;
  handleCellLeave: () => void;
  boardContainerRef: React.RefObject<HTMLDivElement>;
  memoBoard?: any;
}

export const PracticeBoardSection: React.FC<PracticeBoardSectionProps> = ({
  selectedLesson,
  activeBoardIndex,
  setActiveBoardIndex,
  replayIndex,
  setReplayIndex,
  isAutoPlaying,
  setIsAutoPlaying,
  aiConfig,
  humanSide,
  historyViewIndex,
  setHistoryViewIndex,
  onStateChange,
  handleCellHover,
  handleCellLeave,
  boardContainerRef,
  memoBoard
}) => {
  const { t } = useTranslation();
  const isMultiBoard = selectedLesson.boards && selectedLesson.boards.length > 0;

  return (
    <div className="flex-1 w-full flex flex-col items-center gap-4 min-w-0 lg:order-2 group">
      <div className="w-full space-y-6">
        {isMultiBoard ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedLesson.boards!.map((b: PracticeBoard, idx: number) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setActiveBoardIndex(idx);
                    setReplayIndex(0);
                    setIsAutoPlaying(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeBoardIndex === idx ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white/[0.03] text-slate-400 border-black/5 hover:bg-white/[0.08]'}`}
                >
                  {t('practice.board.tab', { index: idx + 1, title: b.title || t('practice.board.defaultTitle') })}
                </button>
              ))}
            </div>

            <div ref={boardContainerRef} className="w-full flex justify-center">
              <Board 
                key={`${selectedLesson.id}-${activeBoardIndex}`}
                initialBoard={fenToBoard(selectedLesson.boards![activeBoardIndex].fen).board}
                initialPlayer={fenToBoard(selectedLesson.boards![activeBoardIndex].fen).sideToMove}
                replay={(isAutoPlaying || replayIndex > 0) ? {
                  history: selectedLesson.boards![activeBoardIndex].moves.split(/\s+/).filter(Boolean).map(m => parseUCI(m)).filter(Boolean) as any,
                  index: replayIndex
                } : undefined}
                onReplayIndexChange={(idx) => {
                  setReplayIndex(idx || 0);
                  if (idx === 0) setIsAutoPlaying(false);
                }}
                hideLobby 
                hideSidebar={true}
                moveListBelow={false}
                ai={aiConfig as any}
                side={humanSide}
                onStateChange={onStateChange}
                historyViewIndex={historyViewIndex}
                onHistoryViewIndexChange={setHistoryViewIndex}
                initialHistory={selectedLesson.boards![activeBoardIndex].moves.split(/\s+/).filter(Boolean).map(m => parseUCI(m)).filter(Boolean) as any}
                onCellHover={handleCellHover} 
                onCellLeave={handleCellLeave} 
              />
            </div>
          </div>
        ) : (
          <div ref={boardContainerRef} className="w-full flex justify-center">
            <Board 
              key={selectedLesson?.id || 'none'}
              initialBoard={memoBoard} 
              hideLobby 
              onCellHover={handleCellHover} 
              onCellLeave={handleCellLeave} 
              hideSidebar={true}
              moveListBelow={false}
              ai={aiConfig as any}
              side={humanSide}
              onStateChange={onStateChange}
              historyViewIndex={historyViewIndex}
              onHistoryViewIndexChange={setHistoryViewIndex}
            />
          </div>
        )}

        {selectedLesson.content ? (
          <div className="rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur-xl p-8 lg:p-12 prose prose-slate dark:prose-invert max-w-none shadow-2xl space-y-6">
            <RichContentRenderer content={selectedLesson.content} />
          </div>
        ) : (
          <div className="rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur-xl p-8 lg:p-12 space-y-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-800 dark:text-white/90 uppercase tracking-tight flex items-center gap-3">
               <span className="w-10 h-10 flex items-center justify-center bg-blue-500/10 text-blue-400 rounded-xl text-xl shadow-lg shadow-blue-500/10">💡</span>
               {t('practice.board.supplemental.title')}
             </h3>
            <div className="text-lg text-slate-600 dark:text-white/60 leading-relaxed space-y-4 font-medium">
               <p>
                 {t('practice.board.supplemental.p1')}
               </p>
               <p>
                 {t('practice.board.supplemental.p2', { title: selectedLesson.title })}
               </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
