import { getSocket } from './socket';

export type InviteDoc = {
  id: string;
  fromUid: string;
  fromName?: string;
  toUid: string;
  roomId: string;
  timeMode?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
  respondedAt?: number;
};

export function sendInvite(toUid: string, roomId: string) {
  const s = getSocket();
  return new Promise<{ ok: true; invite: InviteDoc } | { ok: false; error: string }>((resolve) =>
    s.emit('invite:send', { toUid, roomId }, (ack: any) => resolve(ack))
  );
}

export function respondInvite(id: string, action: 'accept' | 'decline') {
  const s = getSocket();
  return new Promise<{ ok: true; invite: any } | { ok: false; error: string }>((resolve) =>
    s.emit('invite:respond', { id, action }, (ack: any) => resolve(ack))
  );
}

export function onInviteReceived(cb: (i: InviteDoc) => void) {
  const s = getSocket();
  s.on('invite:received', cb);
  return () => s.off('invite:received', cb);
}
