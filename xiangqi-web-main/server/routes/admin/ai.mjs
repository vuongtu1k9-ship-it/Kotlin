import express from 'express';
import { AiGeneratorService } from '../../services/aiGenerator.mjs';
import { AiResourceManager } from '../../services/aiResourceManager.mjs';
import { requireAdmin } from '../../utils/auth.mjs';

const router = express.Router();
const aiService = AiGeneratorService.getInstance();

// All AI admin routes require admin privileges
router.use(requireAdmin);

// Global AI Resources (SSOT)
router.get('/resources', async (req, res) => {
  try {
    const config = await AiResourceManager.getConfig();
    res.json({ ok: true, config });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/resources', async (req, res) => {
  try {
    const { apiKeys, defaultModel, autoSwitch } = req.body;
    await AiResourceManager.updateConfig({ apiKeys, defaultModel, autoSwitch });
    
    // Sync puzzle worker if running
    await aiService.updateProgress({ 
      currentModel: defaultModel,
      autoSwitch: autoSwitch 
    });

    res.json({ ok: true, message: 'AI_RESOURCES_UPDATED' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/status', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  try {
    const progress = await aiService.getProgress();
    res.json({
      ok: true,
      progress: {
        ...progress,
        status: aiService.status, // Use memory status for real-time UI
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/start', async (req, res) => {
  try {
    aiService.start();
    res.json({ ok: true, message: 'AI_STARTED' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/pause', async (req, res) => {
  try {
    await aiService.pause();
    res.json({ ok: true, message: 'AI_PAUSED' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/config', async (req, res) => {
  try {
    const { 
      model, key, keys, 
      groqKeys, openrouterKeys, 
      cerebrasKeys, sambanovaKeys, mistralKeys,
      autoSwitch, promptTemplate 
    } = req.body;
    
    // For Backward Compatibility and Worker Specific Config
    const update = {};
    
    // If updating keys via legacy endpoint, also update SSOT
    const aiKeys = {};
    if (keys && Array.isArray(keys)) aiKeys.gemini = keys;
    else if (key) aiKeys.gemini = [key];

    if (groqKeys) aiKeys.groq = groqKeys;
    if (openrouterKeys) aiKeys.openrouter = openrouterKeys;
    if (cerebrasKeys) aiKeys.cerebras = cerebrasKeys;
    if (sambanovaKeys) aiKeys.sambanova = sambanovaKeys;
    if (mistralKeys) aiKeys.mistral = mistralKeys;

    if (Object.keys(aiKeys).length > 0) {
      await AiResourceManager.updateConfig({ apiKeys: aiKeys });
    }

    if (model) update.currentModel = model;
    if (autoSwitch !== undefined) update.autoSwitch = autoSwitch;
    if (promptTemplate !== undefined) update.promptTemplate = promptTemplate;
    
    await aiService.updateProgress(update);
    res.json({ ok: true, message: 'CONFIG_UPDATED' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/resume', async (req, res) => {
  try {
    aiService.start();
    res.json({ ok: true, message: 'AI_RESUMED' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * Execute a general AI command (e.g. content optimization)
 */
router.post('/command', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) return res.status(400).json({ ok: false, error: 'MISSING_COMMAND' });

    const result = await aiService.generateSimpleCompletion(command);
    res.json({ ok: true, response: result });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
