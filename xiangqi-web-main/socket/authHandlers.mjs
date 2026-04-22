import { logger } from '../logger.mjs';
import { ensureUser } from '../users.mjs';

export function registerAuthHandlers(io, socket) {
  socket.on('auth:me', async (ack) => {
    try {
      const user = socket.data.user;
      if (!user) {
        if (typeof ack === 'function') ack({ ok: false, error: 'UNAUTHORIZED' });
        return;
      }

      // Re-fetch from DB to ensure latest inventory/stats
      const fullProfile = await ensureUser(user);
      
      if (typeof ack === 'function') {
        ack({ ok: true, user: fullProfile });
      }
    } catch (e) {
      logger.error('[Socket:auth:me] error:', e);
      if (typeof ack === 'function') ack({ ok: false, error: String(e.message || e) });
    }
  });
}
