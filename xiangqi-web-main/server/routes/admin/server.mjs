import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '../../logger.mjs';
import { requireAdmin } from '../../utils/auth.mjs';
import { AiGeneratorService } from '../../services/aiGenerator.mjs';

const execAsync = promisify(exec);
const router = express.Router();

router.use(requireAdmin);

/**
 * GET /admin/server/status
 * Get system status, git info, and pm2 processes
 */
let statusCache = null;
let lastStatusFetch = 0;
const STATUS_CACHE_TTL = 10000; // 10 seconds

router.get('/status', async (req, res) => {
  const now = Date.now();
  if (statusCache && (now - lastStatusFetch < STATUS_CACHE_TTL)) {
    return res.json({ ok: true, data: statusCache, cached: true });
  }

  try {
    const data = {
      git: 'unknown',
      gh: 'unknown',
      pm2: [],
      uptime: 'unknown',
      node: 'unknown',
      runner: 'OFFLINE',
      timestamp: Date.now()
    };

    // Sequential for stability
    try {
      const { stdout } = await execAsync('git status -sb');
      data.git = stdout.trim();
    } catch(e) { data.git = 'Git Error: ' + e.message; }

    try {
      const { stdout } = await execAsync('pm2 jlist');
      data.pm2 = JSON.parse(stdout);
    } catch(e) { data.pm2 = []; }

    try {
      const { stdout } = await execAsync('uptime -p');
      data.uptime = stdout.trim();
    } catch(e) {}

    try {
      const { stdout } = await execAsync('node -v');
      data.node = stdout.trim();
    } catch(e) {}

    try {
      const { stdout } = await execAsync('ps aux | grep "[R]unner.Listener"');
      if (stdout.trim()) data.runner = 'ONLINE';
    } catch(e) {}

    try {
      const { stdout } = await execAsync('gh status -R hoanb1/xiangqi-web').catch(e => ({ stdout: e.stdout || 'gh error' }));
      data.gh = stdout.trim();
    } catch(e) {}

    statusCache = data;
    lastStatusFetch = now;
    res.json({ ok: true, data });
  } catch (e) {
    logger.error('[ServerAdmin] Status root failure:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * GET /admin/server/logs
 * Read logs for a specific app
 */
router.get('/logs', async (req, res) => {
  let { lines = 100, app = 'xiangqi' } = req.query;
  try {
    const numLines = Math.min(parseInt(lines) || 100, 1000);
    
    // Find the actual process and its log path
    const { stdout: jlist } = await execAsync('pm2 jlist');
    const list = JSON.parse(jlist);
    const proc = list.find(p => p.name.includes(app));
    
    if (!proc) {
      return res.json({ ok: true, logs: `Process containing "${app}" not found in PM2.` });
    }

    const logPath = proc.pm2_env.pm_out_log_path;
    if (!logPath) {
      return res.json({ ok: true, logs: 'Log path not found for process.' });
    }

    // Use standard 'tail' command - much lighter than 'pm2 logs'
    const { stdout: logs } = await execAsync(`tail -n ${numLines} "${logPath}"`);
    
    res.json({ ok: true, logs });
  } catch (e) {
    logger.error('[ServerAdmin] Logs failed:', e);
    res.json({ ok: false, error: e.message });
  }
});

/**
 * POST /admin/server/git-action
 * Run git tasks (fetch, pull, etc)
 */
router.post('/git-action', async (req, res) => {
  const { action, tool = 'git' } = req.body;
  
  const allowedGit = ['fetch', 'pull', 'status', 'rev-parse HEAD'];
  const allowedGh = ['pr list -R hoanb1/xiangqi-web', 'run list -R hoanb1/xiangqi-web', 'issue list -R hoanb1/xiangqi-web', 'auth status', 'repo view hoanb1/xiangqi-web'];
  const isGh = tool === 'gh';
  const allowed = isGh ? allowedGh : allowedGit;

  if (!allowed.includes(action)) {
    return res.status(400).json({ ok: false, error: 'Invalid action' });
  }

  try {
    const { stdout, stderr } = await execAsync(`${tool} ${action}`);
    res.json({ ok: true, output: stdout, error: stderr });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

/**
 * POST /admin/server/analyze-logs
 * Use AI to analyze logs
 */
router.post('/analyze-logs', async (req, res) => {
  const { logs } = req.body;
  if (!logs) return res.status(400).json({ ok: false, error: 'No logs provided' });

  try {
    const aiService = AiGeneratorService.getInstance();
    const prompt = `You are a system administrator. Analyze the following server logs for the Xiangqi Web application and identify any critical errors, potential security issues, or performance bottlenecks. Provide a concise summary and recommended actions.\n\nLOGS:\n${logs.substring(0, 5000)}`;
    
    const analysis = await aiService.generateSimpleCompletion(prompt);
    res.json({ ok: true, analysis });
  } catch (e) {
    logger.error('[ServerAdmin] AI analysis failed:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * POST /admin/server/gh-create-issue
 * Create a GitHub issue via AI or directly
 */
router.post('/gh-create-issue', async (req, res) => {
  const { title, body, logs } = req.body;
  
  let finalTitle = title;
  let finalBody = body;

  try {
    const aiService = AiGeneratorService.getInstance();
    
    if (logs && !body) {
      // Case 1: Full AI generation from raw logs
      const prompt = `Based on these server logs, generate a GitHub issue title and a detailed markdown body. The body should include the error description and the logs snippet. Output format: TITLE: [title] --- BODY: [body]\n\nLOGS:\n${logs.substring(0, 3000)}`;
      const aiResponse = await aiService.generateSimpleCompletion(prompt);
      const [tPart, bPart] = aiResponse.split('---');
      finalTitle = tPart.replace('TITLE:', '').trim();
      finalBody = bPart.replace('BODY:', '').trim();
    } else if (body && !title) {
      // Case 2: Use provided analysis but generate a title
      const prompt = `Generate a very short, professional GitHub issue title for this technical analysis (max 60 chars):\n\n${body.substring(0, 1000)}`;
      finalTitle = await aiService.generateSimpleCompletion(prompt);
      finalTitle = finalTitle.replace(/^"|"$/g, '').trim(); 
      finalBody = body;
    }

    if (!finalTitle) finalTitle = `System Alert: ${new Date().toISOString()}`;
    if (!finalBody) return res.status(400).json({ ok: false, error: 'Issue content (body) is required' });

    const tempFile = path.join(os.tmpdir(), `gh-issue-${Date.now()}.md`);
    try {
      await fs.promises.writeFile(tempFile, finalBody, 'utf8');

      // Execute gh issue create using the file for the body to avoid shell escape issues
      const { stdout } = await execAsync(`gh issue create -R hoanb1/xiangqi-web --title "${finalTitle.replace(/"/g, '\\"')}" --body-file "${tempFile}"`);
      res.json({ ok: true, output: stdout, title: finalTitle });
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFile)) await fs.promises.unlink(tempFile).catch(() => {});
    }
  } catch (e) {
    let errorMsg = e.message;
    if (errorMsg.includes('gh auth login')) {
      errorMsg = 'Server NOT logged into GitHub. Please run "gh auth login" on the server or provide GH_TOKEN.';
    }
    logger.error('[ServerAdmin] gh issue create failed:', errorMsg);
    res.status(500).json({ ok: false, error: errorMsg });
  }
});

/**
 * POST /admin/server/gh-analyze-issue
 * Use AI to analyze an existing issue and suggest fixes
 */
router.post('/gh-analyze-issue', async (req, res) => {
  const { issueNumber } = req.body;
  if (!issueNumber) return res.status(400).json({ ok: false, error: 'Issue number required' });

  try {
    const { stdout: issueData } = await execAsync(`gh issue view ${issueNumber} -R hoanb1/xiangqi-web --json title,body,comments`);
    const data = JSON.parse(issueData);
    
    const aiService = AiGeneratorService.getInstance();
    const prompt = `Analyze this GitHub issue for Xiangqi Web and suggest a code fix or next steps.\n\nTITLE: ${data.title}\nBODY: ${data.body}\nCOMMENTS: ${JSON.stringify(data.comments)}`;
    
    const suggestion = await aiService.generateSimpleCompletion(prompt);
    res.json({ ok: true, suggestion, issue: data });
  } catch (e) {
    logger.error('[ServerAdmin] gh issue analyze failed:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
