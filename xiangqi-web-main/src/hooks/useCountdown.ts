import { useState, useEffect } from 'react';

export function useCountdown(deadline?: string | null) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const parseDate = (d?: string | null) => {
      if (!d) return null;
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) return parsed;
      const iso = d.replace(' ', 'T');
      const parsedIso = new Date(iso);
      return isNaN(parsedIso.getTime()) ? null : parsedIso;
    };
    
    const dateObj = parseDate(deadline);
    if (!dateObj) { setRemaining('Hạn chưa xác định'); return; }
    const target = dateObj.getTime();
    
    let timerId: any = null;

    const tick = () => {
      const now = Date.now();
      const diff = target - now;
      
      if (diff <= 0) {
        setRemaining('Đã đóng ghi danh');
        return;
      }
      
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${d > 0 ? d + 'n ' : ''}${h}g ${m}p ${s}s`);
      
      const delay = 1000 - (now % 1000);
      timerId = setTimeout(tick, delay);
    };

    tick();
    return () => { if (timerId) clearTimeout(timerId); };
  }, [deadline]);
  return remaining;
}
