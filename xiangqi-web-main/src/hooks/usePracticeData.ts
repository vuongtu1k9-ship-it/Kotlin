import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet, apiPost } from '../api';
import { logger } from '../utils/logger';
import { useNavigate } from 'react-router-dom';

export interface PracticeBoard {
  id: string;
  title: string;
  description: string;
  fen: string;
  moves: string; // UCI sequence
}

export type PracticeLesson = {
  id: string;
  category: string;
  title: string;
  description: string;
  content?: string; // HTML from TinyMCE
  difficulty: string;
  reward: number;
  setupId: string;
  thumbBoard?: any;
  boards?: PracticeBoard[]; 
  slug?: string;
  categorySlug?: string;
  mission?: string;
  order?: number;
}

export interface PracticeCategory {
  name: string;
  slug: string;
}

export function usePracticeData(lessonId: string | undefined, authState: any) {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Record<string, PracticeLesson>>({});
  const [categories, setCategories] = useState<PracticeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<PracticeLesson | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // AI & Board State
  const [aiEnabled, setAiEnabled] = useState(true);
  const [humanSide, setHumanSide] = useState<'red' | 'black'>('red');
  const [aiLevel, setAiLevel] = useState<number>(3);
  const [aiEngine, setAiEngine] = useState<'pikafish' | 'web'>('pikafish');
  const [moveHistory, setMoveHistory] = useState<any[]>([]);
  const [historyViewIndex, setHistoryViewIndex] = useState<number | null>(null);

  // Replay State
  const [activeBoardIndex, setActiveBoardIndex] = useState<number>(0);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayTimer = useRef<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [lessonsRes, categoriesRes] = await Promise.all([
          apiGet<{ ok: boolean; lessons: Record<string, PracticeLesson> }>('/practice/lessons', authState.token),
          apiGet<{ ok: boolean; categories: PracticeCategory[] }>('/practice/categories', authState.token)
        ]);
        if (lessonsRes?.ok) setLessons(lessonsRes.lessons);
        if (categoriesRes?.ok) setCategories(categoriesRes.categories);
      } catch (e) {
        logger.error('Failed to load practice data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [authState.token]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (!loading && Object.keys(lessons).length > 0) {
      if (lessonId) {
        // Find by slug or ID
        const lesson = Object.values(lessons).find(l => l.slug === lessonId || l.id === lessonId);
        if (lesson) {
          setSelectedLesson(lesson);
          setMoveHistory([]);
          setHistoryViewIndex(null);
          setActiveBoardIndex(0);
          setReplayIndex(0);
          setIsAutoPlaying(false);
        } else {
          setSelectedLesson(null);
        }
      } else {
        setSelectedLesson(null);
        setMoveHistory([]);
        setHistoryViewIndex(null);
      }
    }
  }, [lessonId, lessons, loading]);

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayTimer.current = setInterval(() => {
        setReplayIndex(prev => {
          const lessonBoard = selectedLesson?.boards?.[activeBoardIndex];
          if (!lessonBoard) return prev;
          const moves = lessonBoard.moves.split(/\s+/).filter(Boolean);
          if (prev >= moves.length) {
            setIsAutoPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    } else {
      clearInterval(autoPlayTimer.current);
    }
    return () => clearInterval(autoPlayTimer.current);
  }, [isAutoPlaying, selectedLesson, activeBoardIndex]);

  const handleCompleteLesson = useCallback(async (id: string) => {
    if (authState.status !== 'auth') return;
    setCompleting(id);
    
    const lessonListArray = Object.values(lessons).sort((a, b) => {
      const orderA = a.order ?? 9999;
      const orderB = b.order ?? 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });
    const currIdx = lessonListArray.findIndex(l => l.id === id);
    const nextId = (currIdx !== -1 && currIdx < lessonListArray.length - 1) ? lessonListArray[currIdx + 1].id : null;

    try {
      const res = await apiPost<{ ok: boolean; reward?: number; error?: string }>('/practice/complete', { id }, authState.token);
      
      if (res?.ok) {
        setMessage({ text: `Chúc mừng! Bạn đã nhận được ${res.reward} vàng.`, type: 'success' });
        setTimeout(() => {
          if (nextId) { navigate(`/practice/${nextId}`); }
          else navigate('/practice');
        }, 1500);
      } else if (res?.error === 'ALREADY_COMPLETED') {
        setMessage({ text: 'Bạn đã nhận thưởng bài này rồi.', type: 'info' });
        setTimeout(() => {
          if (nextId) { navigate(`/practice/${nextId}`); }
          else navigate('/practice');
        }, 1500);
      } else {
        setMessage({ text: 'Lỗi khi hoàn thành bài học.', type: 'error' });
      }
    } catch (e) {
      logger.error('Complete failed', e);
      setMessage({ text: 'Lỗi mạng khi gửi kết quả.', type: 'error' });
    } finally {
      setCompleting(null);
    }
  }, [authState.status, authState.token, lessons, navigate]);

  return {
    lessons,
    categories,
    loading,
    selectedLesson,
    setSelectedLesson,
    completing,
    message,
    setMessage,
    aiEnabled,
    setAiEnabled,
    humanSide,
    setHumanSide,
    aiLevel,
    setAiLevel,
    aiEngine,
    setAiEngine,
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
  };
}
