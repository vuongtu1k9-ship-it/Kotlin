import { logger } from '../logger.mjs';
import { getConfig as getSiteConfig, setConfig as setSiteConfig } from './siteConfig.mjs';

/**
 * AI Resource Manager
 * Exclusively reads API keys from .env.
 * Reads/writes mutable AI config (e.g. defaultModel) using siteConfig.
 */
export class AiResourceManager {
  static async getConfig() {
    const defaultModel = await getSiteConfig('ai.defaultModel') || 'gemini-3.1-flash-lite-preview';
    const autoSwitch = await getSiteConfig('ai.autoSwitch') ?? true;
    
    return {
      defaultModel,
      autoSwitch,
      apiKeys: {
        gemini: [process.env.GEMINI_API_KEY].filter(Boolean),
        groq: [process.env.GROQ_API_KEY].filter(Boolean),
        mistral: [process.env.MISTRAL_API_KEY].filter(Boolean),
        cerebras: [process.env.CEREBRAS_API_KEY].filter(Boolean),
        sambanova: [process.env.SAMBANOVA_API_KEY].filter(Boolean),
        openrouter: [process.env.OPENROUTER_API_KEY].filter(Boolean)
      },
      lastUpdated: Date.now()
    };
  }

  static async updateConfig(update) {
    // API Keys are no longer updated via the web API.
    // They are exclusively managed via the physical .env file per user request.
    
    if (update.defaultModel) {
      await setSiteConfig('ai.defaultModel', update.defaultModel);
    }
    if (typeof update.autoSwitch === 'boolean') {
      await setSiteConfig('ai.autoSwitch', update.autoSwitch);
    }
    
    logger.info('[AI_RESOURCES] Mutable configuration updated successfully via Web');
    return true;
  }

  /**
   * Returns a valid API key for a given provider
   */
  static async getApiKey(provider) {
    const config = await this.getConfig();
    const keys = config.apiKeys[provider] || [];
    if (keys.length === 0) return null;
    return keys[0];
  }

  /**
   * Returns all keys for a provider
   */
  static async getAllKeys(provider) {
    const config = await this.getConfig();
    return config.apiKeys[provider] || [];
  }

  static async getDefaultModel() {
    const config = await this.getConfig();
    return config.defaultModel;
  }
}
