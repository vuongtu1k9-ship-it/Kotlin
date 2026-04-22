import { logger } from '../../logger.mjs';

export function registerEntityHandlers(io, socket) {
  socket.on('entity:join', async ({ type, id } = {}, ack) => {
    try {
      if (!type || !id) {
        if (typeof ack === 'function') ack({ ok: false, error: 'BAD_PARAMS' });
        return;
      }
      const room = `comments:${type}:${id}`;
      socket.join(room);
      logger.debug(`[Socket] User joined entity room: ${room}`);
      if (typeof ack === 'function') ack({ ok: true });
    } catch (e) {
      logger.error('[ENTITY_HANDLERS] entity:join exception:', e.message);
      if (typeof ack === 'function') ack({ ok: false, error: 'JOIN_FAILED' });
    }
  });

  socket.on('entity:leave', async ({ type, id } = {}, ack) => {
    try {
      if (type && id) {
        const room = `comments:${type}:${id}`;
        socket.leave(room);
      }
      if (typeof ack === 'function') ack({ ok: true });
    } catch (e) {
      if (typeof ack === 'function') ack({ ok: false });
    }
  });
}
