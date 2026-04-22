import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../logger.mjs';
import { AiResourceManager } from './aiResourceManager.mjs';

/**
 * Centered AI Service
 * Supports multi-provider generation with automatic fallback / auto-switch.
 */

const PROVIDERS = {
  GOOGLE: 'google',
  OPENAI_COMPATIBLE: 'openai_compatible',
  MISTRAL: 'mistral'
};

const MODEL_MAP = {
  'gemini-2.5-flash': { provider: PROVIDERS.GOOGLE },
  'gemini-2.5-pro': { provider: PROVIDERS.GOOGLE },
  'gemini-2.0-flash': { provider: PROVIDERS.GOOGLE },
  'gemini-3.1-pro-preview': { provider: PROVIDERS.GOOGLE },
  'gemini-3.1-flash-lite-preview': { provider: PROVIDERS.GOOGLE }, // Removed broken 1.5 alias
  'gemini-flash-latest': { provider: PROVIDERS.GOOGLE },
  'llama-3.3-70b-versatile': { provider: PROVIDERS.OPENAI_COMPATIBLE, endpoint: 'https://api.groq.com/openai/v1/chat/completions', env_key: 'groq' },
  'llama-3.1-8b-instant': { provider: PROVIDERS.OPENAI_COMPATIBLE, endpoint: 'https://api.groq.com/openai/v1/chat/completions', env_key: 'groq' },
  'llama3.1-8b': { provider: PROVIDERS.OPENAI_COMPATIBLE, endpoint: 'https://api.cerebras.ai/v1/chat/completions', env_key: 'cerebras' },
  'Meta-Llama-3.3-70B-Instruct': { provider: PROVIDERS.OPENAI_COMPATIBLE, endpoint: 'https://api.sambanova.ai/v1/chat/completions', env_key: 'sambanova' },
  'mistral-large-latest': { provider: PROVIDERS.MISTRAL, env_key: 'mistral' }
};


// Fallback order for auto-switch
const FALLBACK_ORDER = [
  'gemini-flash-latest',
  'gemini-3.1-pro-preview',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'Meta-Llama-3.3-70B-Instruct'
];

export async function generateContent(prompt, options = {}) {
  const config = await AiResourceManager.getConfig();
  const primaryModel = options.model || config.defaultModel;
  const autoSwitch = options.autoSwitch ?? config.autoSwitch;

  const attemptedModels = new Set();
  let currentModel = primaryModel;

  while (currentModel) {
    attemptedModels.add(currentModel);
    try {
      logger.info(`[AI_SERVICE] Attempting generation with model: ${currentModel}`);
      const result = await callProvider(currentModel, prompt, options);
      return result;
    } catch (err) {
      const isFatal = err.message.includes('403') || err.message.includes('401') || err.message.includes('DISABLED') || err.message.includes('not found');
      logger.warn(`[AI_SERVICE] Model ${currentModel} failed: ${err.message}`);

      if (!autoSwitch) throw err;

      // Find next fallback
      currentModel = FALLBACK_ORDER.find(m => !attemptedModels.has(m));
      if (!currentModel) {
        logger.error('[AI_SERVICE] All fallback models exhausted or unavailable.');
        throw new Error('AI_SERVICE_ALL_MODELS_FAILED');
      }
      logger.info(`[AI_SERVICE] Auto-switching to fallback: ${currentModel}`);
    }
  }
}

async function callProvider(modelId, prompt, options) {
  const spec = MODEL_MAP[modelId];
  if (!spec) {
    // Try to guess if it's a gemini model
    if (modelId.includes('gemini')) return callGoogle(modelId, prompt, options);
    throw new Error(`Unknown model ID: ${modelId}`);
  }

  const apiKey = await AiResourceManager.getApiKey(spec.env_key || 'gemini');
  if (!apiKey) throw new Error(`API Key for ${modelId} not configured`);

  switch (spec.provider) {
    case PROVIDERS.GOOGLE:
      return callGoogle(spec.internal_id || modelId, prompt, options, apiKey);
    case PROVIDERS.OPENAI_COMPATIBLE:
      return callOpenAiCompatible(spec.endpoint, modelId, prompt, options, apiKey);
    case PROVIDERS.MISTRAL:
      return callMistral(modelId, prompt, options, apiKey);
    default:
      throw new Error(`Unsupported provider for model: ${modelId}`);
  }
}

async function callGoogle(modelId, prompt, options, apiKey) {
  // Use OpenAI bridge for Google - often more stable than native SDK in varying environments
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
  try {
    return await callOpenAiCompatible(endpoint, modelId, prompt, options, apiKey);
  } catch (err) {
    if (err.message.includes('404')) {
      // Fallback to native SDK if OpenAI bridge fails
      logger.info(`[AI_SERVICE] Google OpenAI bridge failed (404), trying native SDK for ${modelId}`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(prompt);
      return result.response.text();
    }
    throw err;
  }
}

async function callOpenAiCompatible(endpoint, modelId, prompt, options, apiKey) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2048
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI-Compatible Error (${response.status}): ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callMistral(modelId, prompt, options, apiKey) {
  // Mistral standard API
  return callOpenAiCompatible('https://api.mistral.ai/v1/chat/completions', modelId, prompt, options, apiKey);
}
