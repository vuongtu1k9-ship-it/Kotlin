import { useEffect, useState } from 'react';
import { getSocket } from '../net/socket';

export const useBoardPing = (active: boolean) => {
  const [ping, setPing] = useState<number | null>(null);

  useEffect(() => {
    if (!active) {
      setPing(null);
      return;
    }

    const socket = getSocket();
    let start: number;

    const interval = setInterval(() => {
      start = Date.now();
      socket.emit('heartbeat:ping');
    }, 5000);

    const onPong = () => {
      setPing(Date.now() - start);
    };

    socket.on('heartbeat:pong', onPong);

    return () => {
      clearInterval(interval);
      socket.off('heartbeat:pong', onPong);
    };
  }, [active]);

  return ping;
};
