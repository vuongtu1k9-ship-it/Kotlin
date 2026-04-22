import express from 'express';
export const router = express.Router();

router.post('/push/received-callback', (req, res) => {
  const { status, timestamp, url } = req.body;
  // Using console.log so we can see it in [PUSH_AUDIT] grep or server logs
  console.log(`[PUSH_AUDIT] [CLIENT_RECEIVED] STATUS: ${status} | URL: ${url} | Time: ${new Date(timestamp).toISOString()}`);
  res.json({ ok: true });
});
