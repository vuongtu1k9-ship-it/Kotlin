import { useCallback, useMemo, useRef, useEffect, useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { usePracticeData, PracticeLesson } from '../hooks/usePracticeData';
import { useActiveBots } from '../hooks/useActiveBots';
import { SEO } from '../components/SEO';
import { getAbsoluteUrl, getSiteOrigin } from '../utils/url';
import { LessonList } from '../components/practice/LessonList';
import { LessonSidebar } from '../components/practice/LessonSidebar';
import { PracticeBoardSection } from '../components/practice/PracticeBoardSection';
import { PracticeControlPanel } from '../components/practice/PracticeControlPanel';
import { PracticeSeoContent } from '../components/practice/PracticeSeoContent';
import { BoardHeader } from '../components/BoardHeader';
import { BotSpeechBubble } from '../components/BotSpeechBubble';
import { subscribeToBotTaunt } from '../net/socket';
import { mapBotToProfile } from '../utils/botUtils';
import { ExportButtons } from '../components/ExportButtons';

const MoveList = lazy(() => import('../components/MoveList').then(m => ({ default: m.MoveList })));

export function PracticePage() {
  const { t } = useTranslation();
  const { lessonId: slugFromUrl } = useParams();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  
  const {
    lessons,
    categories,
    loading,
    selectedLesson,
    setSelectedLesson,
    completing,
    message,
    aiEnabled,
    setAiEnabled,
    humanSide,
    setHumanSide,
    aiLevel,
    moveHistory,
    setMoveHistory,
    historyViewIndex,
    setHistoryViewIndex,
    activeBoardIndex,
    setActiveBoardIndex,
    replayIndex,
    setReplayIndex,
    isAutoPlaying,
    setIsAutoPlaying,
    handleCompleteLesson,
  } = usePracticeData(slugFromUrl, authState);

  const [boardState, setBoardState] = useState<any>(null);
  const [botTaunt, setBotTaunt] = useState<string | null>(null);
  const [showSecondary, setShowSecondary] = useState(false);

  const { bots, loading: botsLoading, selectedBotId, selectBot, selectedBot } = useActiveBots({ autoSelect: true, defaultLevel: 3 });

  // Subscribe to bot taunt events
  useEffect(() => {
    const unsub = subscribeToBotTaunt(({ taunt }) => {
      setBotTaunt(taunt);
      setTimeout(() => setBotTaunt(null), 8000);
    });
    return unsub;
  }, []);

  // Defer move list for performance
  useEffect(() => {
    const timer = setTimeout(() => setShowSecondary(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const boardContainerRef = useRef<HTMLDivElement>(null);

  const handleCellHover = useCallback(() => {
    // Legacy piece-hover logic removed
  }, []);

  const handleCellLeave = useCallback(() => {}, []);

  const handleOpenLesson = useCallback((l: PracticeLesson) => {
    navigate(`/practice/${l.categorySlug || t('leaderboard.lesson')}/${l.slug || l.id}`);
  }, [navigate, t]);

  const handleCloseLesson = useCallback(() => {
    setSelectedLesson(null);
    navigate('/practice');
  }, [navigate, setSelectedLesson]);

  const isCompleted = (id: string) => authState.user?.learningProgress?.[id] === 'completed';
  const lessonList = Object.values(lessons);
  const currentIndex = selectedLesson ? lessonList.findIndex(l => l.id === selectedLesson.id) : -1;
  const nextLesson = currentIndex !== -1 && currentIndex < lessonList.length - 1 ? lessonList[currentIndex + 1] : null;

  const goToNextLesson = useCallback(() => {
    if (nextLesson) {
      navigate(`/practice/${nextLesson.categorySlug || t('leaderboard.lesson')}/${nextLesson.slug || nextLesson.id}`);
    } else {
      setSelectedLesson(null);
      navigate('/practice');
    }
  }, [nextLesson, navigate, setSelectedLesson, t]);

  const aiConfig = useMemo(() => {
    return { 
      enabled: aiEnabled && historyViewIndex === null, 
      side: humanSide === 'red' ? 'black' : 'red', 
      level: selectedBot?.level ?? aiLevel, 
      engine: 'pikafish' as const,
      botId: selectedBotId ?? undefined,
    };
  }, [aiEnabled, humanSide, aiLevel, historyViewIndex, selectedBotId, selectedBot]);

  const idealLessonSlug = useMemo(() => selectedLesson?.slug || selectedLesson?.id || '', [selectedLesson]);
  const idealCategorySlug = useMemo(() => selectedLesson?.categorySlug || t('leaderboard.lesson'), [selectedLesson, t]);
  const canonicalUrl = useMemo(() => {
    if (!selectedLesson) return getAbsoluteUrl('/practice');
    return getAbsoluteUrl(`/practice/${idealCategorySlug}/${idealLessonSlug}`);
  }, [selectedLesson, idealCategorySlug, idealLessonSlug]);

  useEffect(() => {
    if (!selectedLesson || !slugFromUrl) return;
    // If we are on a lesson page, ensure the URL matches the ideal slugs
    const currentPath = window.location.pathname;
    const idealPath = `/practice/${idealCategorySlug}/${idealLessonSlug}`;
    if (currentPath.startsWith('/practice/') && !currentPath.includes(idealPath)) {
      // Only redirect if it's a mismatch (handles legacy /practice/:id without category too)
      navigate(idealPath, { replace: true });
    }
  }, [selectedLesson, slugFromUrl, idealCategorySlug, idealLessonSlug, navigate]);

  if (loading) return <div className="text-center py-20 text-slate-600 dark:text-white/50 animate-pulse font-bold text-base">{t('practice.loading')}</div>;

  return (
    <div className="mx-auto max-w-[1920px] w-full px-4 pt-8 pb-16 space-y-10">
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter mb-1 leading-none">
          <Trans i18nKey="practice.title">
            <span className="text-amber-500">tập</span>
          </Trans>
        </h1>
        <p className="text-xs font-black text-slate-400 dark:text-white/30 ml-1 uppercase tracking-widest">{t('practice.subtitle')}</p>
      </div>

      {!selectedLesson ? (
        <LessonList 
          lessonList={lessonList} 
          categories={categories}
          authState={authState} 
          onOpenLesson={handleOpenLesson} 
        />
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,360px)_1fr_minmax(320px,380px)] 2xl:grid-cols-[minmax(350px,420px)_1fr_minmax(380px,450px)] gap-6 xl:gap-8 items-start">
            
            {/* LEFT: Lesson Info & AI Config */}
            <div className="order-1 lg:col-start-1 space-y-6">
              <LessonSidebar 
                selectedLesson={selectedLesson}
                onClose={handleCloseLesson}
                isCompleted={isCompleted(selectedLesson.id)}
                completing={completing === selectedLesson.id}
                onComplete={() => handleCompleteLesson(selectedLesson.id)}
                nextLessonAvailable={!!nextLesson}
                onNextLesson={goToNextLesson}
              />
              
              <PracticeControlPanel 
                aiEnabled={aiEnabled}
                setAiEnabled={setAiEnabled}
                bots={bots}
                botsLoading={botsLoading}
                selectedBotId={selectedBotId}
                onSelectBot={selectBot}
                humanSide={humanSide as 'red' | 'black'}
                setHumanSide={setHumanSide}
                compactSettings={true}
              />
            </div>

            {/* CENTER: Board */}
            <div className="order-2 lg:col-start-2 w-full flex flex-col items-center gap-6 min-w-0 max-w-[650px] mx-auto">
              <PracticeBoardSection 
                selectedLesson={selectedLesson}
                activeBoardIndex={activeBoardIndex}
                setActiveBoardIndex={setActiveBoardIndex}
                replayIndex={replayIndex}
                setReplayIndex={setReplayIndex}
                isAutoPlaying={isAutoPlaying}
                setIsAutoPlaying={setIsAutoPlaying}
                aiConfig={aiConfig}
                humanSide={humanSide as 'red' | 'black'}
                historyViewIndex={historyViewIndex}
                setHistoryViewIndex={setHistoryViewIndex}
                onStateChange={(s: any) => {
                  setBoardState(s);
                  setMoveHistory(s.moveHistory);
                  if (historyViewIndex === null && s.historyViewIndex !== undefined) {
                    setHistoryViewIndex(s.historyViewIndex);
                  }
                }}
                handleCellHover={handleCellHover}
                handleCellLeave={handleCellLeave}
                boardContainerRef={boardContainerRef}
              />
            </div>

            {/* RIGHT: Cockpit (Header + MoveList + Export) */}
            <div className="order-3 lg:col-start-3 w-full flex flex-col gap-6 lg:sticky lg:top-6">
              <div className="rounded-[32px] border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
                <div className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5 shrink-0 relative">
                  <BotSpeechBubble
                    message={botTaunt}
                    personality={selectedBot?.personality}
                    side={humanSide === 'red' ? 'black' : 'red'}
                    humanSide={humanSide as 'red' | 'black'}
                  />
                  <BoardHeader
                    playerProfiles={{
                      red: humanSide === 'red' 
                        ? { name: authState.user?.name || t('common.you'), picture: authState.user?.picture || null, elo: (authState.user as any)?.elo || 1200, rank: null } 
                        : mapBotToProfile(selectedBot, t),
                      black: humanSide === 'black' 
                        ? { name: authState.user?.name || t('common.you'), picture: authState.user?.picture || null, elo: (authState.user as any)?.elo || 1200, rank: null } 
                        : mapBotToProfile(selectedBot, t)
                    }}
                    currentPlayer={boardState?.currentPlayer || 'red'}
                    serverFinished={boardState?.isGameOver || false}
                    ai={aiConfig as any}
                    roomSummary={{
                       playerUids: {
                         red: humanSide === 'red' ? authState.user?.uid : (selectedBotId || 'bot'),
                         black: humanSide === 'black' ? authState.user?.uid : (selectedBotId || 'bot')
                       }
                    }}
                    presenceMap={new Map()}
                    socketConnected={{ red: true, black: true }}
                    serverClockOffset={0}
                    tick={0}
                  />
                </div>

                <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="flex-1 min-h-[300px] overflow-hidden">
                    {showSecondary && (
                      <Suspense fallback={<div className="h-full w-full bg-slate-50 dark:bg-white/[0.02]" />}>
                        <MoveList
                          history={moveHistory}
                          historyViewIndex={historyViewIndex}
                          setHistoryViewIndex={(fn) => setHistoryViewIndex(fn(historyViewIndex))}
                          exitHistoryView={() => setHistoryViewIndex(null)}
                          replayTotal={moveHistory.length}
                          onSeek={(idx) => setHistoryViewIndex(idx)}
                        />
                      </Suspense>
                    )}
                  </div>
                  <div className="p-4 shrink-0 border-t border-black/5 dark:border-white/5">
                    <ExportButtons
                      board={boardState?.board}
                      currentPlayer={boardState?.currentPlayer}
                      boardRef={boardContainerRef}
                      className="flex gap-2"
                    />
                  </div>
                </div>
              </div>

              {/* Guide/Instructions moved here or kept in ControlPanel */}
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`fixed bottom-8 right-8 z-[100] px-6 py-3 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 ${
          message.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 
          message.type === 'error' ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' :
          message.type === 'warning' ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' :
          'bg-blue-500/20 border-blue-500/30 text-blue-300'
        }`}>
           <div className="flex items-center gap-2 font-bold">
              {message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'} {message.text}
           </div>
        </div>
      )}
      
      <style>{`
        .rich-text-content p { margin-bottom: 1rem; }
        .rich-text-content p:last-child { margin-bottom: 0; }
        .rich-text-content strong { color: #fbbf24; font-weight: 800; }
        .rich-text-content ul, .rich-text-content ol { margin-left: 1.5rem; margin-bottom: 1rem; }
        .rich-text-content li { margin-bottom: 0.5rem; }
        .rich-text-content h1, .rich-text-content h2, .rich-text-content h3 { color: white; font-weight: 900; margin-bottom: 1rem; margin-top: 1.5rem; }
      `}</style>
      
      <SEO 
        title={selectedLesson ? `${selectedLesson.title} - ${t('practice.meta.title')}` : t('practice.meta.title')} 
        description={selectedLesson ? selectedLesson.description : t('practice.meta.description')}
        canonical={canonicalUrl}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": t('practice.meta.home'), "item": getSiteOrigin() },
              { "@type": "ListItem", "position": 2, "name": t('practice.meta.practice'), "item": getAbsoluteUrl('/practice'), "url": canonicalUrl }
            ]
          }
        ]}
      />

      <PracticeSeoContent />
    </div>
  );
}
