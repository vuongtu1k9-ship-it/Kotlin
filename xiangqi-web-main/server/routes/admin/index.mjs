import express from 'express';
import usersRouter from './users.mjs';
import contentRouter from './content.mjs';
import systemRouter from './system.mjs';
import puzzlesRouter from './puzzles.mjs';
import tournamentsRouter from './tournaments.mjs';
import botsRouter from './bots.mjs';
import aiRouter from './ai.mjs';
import analyticsRouter from './analytics.mjs';
import socialRouter from './social.mjs';
import serverRouter from './server.mjs';

const router = express.Router();

// All these routers are mounted under /admin in the main app
// Specific routers first
router.use('/users', usersRouter);
router.use('/puzzles', puzzlesRouter);
router.use('/tournaments', tournamentsRouter);
router.use('/bots', botsRouter);
router.use('/ai', aiRouter);
router.use('/analytics', analyticsRouter);
router.use('/social', socialRouter);
router.use('/server', serverRouter);

// Generic routers mounted at / last
router.use('/', contentRouter); // content.mjs handles /matches, /practice/lessons, /comments, etc.
router.use('/', systemRouter);  // system.mjs handles /settings, /cache, /push

export default router;
