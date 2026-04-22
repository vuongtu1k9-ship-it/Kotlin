import { getSocket } from './socket';

export type PresenceItem = {
  uid: string;
  online: boolean;
  playingRoomId: string | null;
};

export function requestPresenceList(): Promise<{ ok: true; presence: PresenceItem[] } | { ok: false; error: string }> {
  const s = getSocket();
  return new Promise((resolve) => s.emit('presence:list', (ack: any) => resolve(ack)));
}

export function onPresenceUpdate(cb: (p: PresenceItem) => void) {
  const s = getSocket();
  s.on('presence:update', cb);
  return () => s.off('presence:update', cb);
}
