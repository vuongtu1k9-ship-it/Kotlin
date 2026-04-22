import { getSocket } from './socket';
import type { ChatMessage } from './socket';

export function sendChat(roomId: string, text: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = getSocket();
  return new Promise((resolve) => s.emit('chat:send', { roomId, text }, (ack: any) => resolve(ack)));
}

export function onChatMessage(cb: (m: ChatMessage) => void) {
  const s = getSocket();
  s.on('chat:message', cb);
  return () => {
    s.off('chat:message', cb);
  };
}
