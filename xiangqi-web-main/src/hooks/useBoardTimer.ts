import { useState, useEffect } from 'react';

interface UseBoardTimerProps {
  roomId: string;
  serverClockOffset: number;
}

export const useBoardTimer = ({ roomId, serverClockOffset }: UseBoardTimerProps) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!roomId) return;
    
    let timerId: any = null;
    const tickHandler = () => {
      const now = Date.now();
      setTick(prev => prev + 1);
      
      // Calculate delay to next perfect second
      const delay = 1000 - (now % 1000);
      timerId = setTimeout(tickHandler, delay);
    };

    tickHandler();
    return () => { if (timerId) clearTimeout(timerId); };
  }, [roomId]);

  const getRemainingMs = (remainingMs: number, turnSide: 'red' | 'black', currentSide: 'red' | 'black', serverTime?: number) => {
    if (turnSide !== currentSide) return remainingMs;
    if (!serverTime) return remainingMs;
    
    const elapsedSinceServerUpdate = Math.max(0, Date.now() + serverClockOffset - serverTime);
    return remainingMs - elapsedSinceServerUpdate;
  };

  const getDeadlineMs = (deadlineAt: number) => {
    return Math.max(0, deadlineAt - (Date.now() + serverClockOffset));
  };

  return {
    tick,
    getRemainingMs,
    getDeadlineMs,
  };
};
