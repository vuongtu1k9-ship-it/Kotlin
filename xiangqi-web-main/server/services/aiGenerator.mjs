import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { getDb, getPuzzlesCol } from '../mongo.mjs';
import { logger } from '../logger.mjs';
import { getIo } from '../socket/presence.mjs';
import { AiResourceManager } from './aiResourceManager.mjs';

const TASK_ID = 'puzzles_seo_v3';

export class AiGeneratorService {
  static instance = null;
  
  constructor() {
    this.status = 'idle';
    this.errorDetails = null;
    this.progress = null;
    this.interrupt = false;
  }

  static getInstance() {
    if (!AiGeneratorService.instance) {
      AiGeneratorService.instance = new AiGeneratorService();
    }
    return AiGeneratorService.instance;
  }

  async getProgress() {
    const db = await getDb();
    const task = await db.collection('ai_tasks').findOne({ id: TASK_ID });
    const aiRes = await AiResourceManager.getConfig();
    
    const defaultPrompt = `Bạn là một ĐẠI SƯ CỜ TƯỚNG (Xiangqi Master) Việt Nam. 
Hãy đặt 1 tiêu đề (title) và 1 mô tả (description) chuẩn SEO và cực kỳ hấp dẫn cho thế cờ này.

LƯU Ý QUAN TRỌNG: 
- Đây là CỜ TƯỚNG (Xiangqi), KHÔNG PHẢI CỜ VUA. Sử dụng đúng thuật ngữ: Xe, Pháo, Mã, Tướng, Sĩ, Tượng, Chốt.
- Phân tích FEN để tìm các đòn sát pháp: Ngọa Tào, Pháo Lãn Câu, Thiết Môn Ninh, Muộn Cung, Song Xe Đâm Diệt...

THÔNG TIN THẾ CỜ:
- Vị trí (FEN): {{fen}}
- Lực lượng bên Đỏ (Viết hoa trong FEN): {{redPieces}}
- Lực lượng bên Đen (Viết thường trong FEN): {{blackPieces}}
- Cấp độ: {{level}}

YÊU CẦU ĐẦU RA:
1. Tiêu đề (title): Dưới 60 ký tự. Viết chữ thường tự nhiên (chỉ viết hoa đầu dòng hoặc danh từ riêng), không viết hoa toàn bộ. Phải chứa từ khóa "Cờ Thế" hoặc "Sát Pháp" và tên đòn đánh nếu có.
2. Mô tả (description): 2-3 câu khơi gợi sự tò mò. Bình luận về sự hiểm hóc của các quân cờ đang chiếm vị trí yếu điểm.
3. Trả về định dạng JSON: {"title": "...", "description": "...", "tags": ["...", "..."]}

Hãy sáng tạo như một người bình luận cờ chuyên nghiệp. Trả về tiếng Việt.`;

    const initialData = {
      id: TASK_ID,
      status: 'idle',
      total: 0,
      processed: 0,
      errors: 0,
      tokens: 0,
      currentModel: aiRes.defaultModel || 'gemini-1.5-flash',
      promptTemplate: defaultPrompt,
      apiKeys: aiRes.apiKeys.gemini,
      groqKeys: aiRes.apiKeys.groq,
      openrouterKeys: aiRes.apiKeys.openrouter,
      cerebrasKeys: aiRes.apiKeys.cerebras,
      sambanovaKeys: aiRes.apiKeys.sambanova,
      mistralKeys: aiRes.apiKeys.mistral,
      lastUpdated: Date.now()
    };

    if (!task) {
      const puzzlesCol = await getPuzzlesCol();
      initialData.total = await puzzlesCol.countDocuments({ 'importedFrom.legacy13CharId': { $exists: true } });
      await db.collection('ai_tasks').insertOne(initialData);
      return initialData;
    }

    // Merge with defaults for display - SSOT keys take priority
    return {
      ...initialData,
      ...task,
      apiKeys: aiRes.apiKeys.gemini,
      groqKeys: aiRes.apiKeys.groq,
      openrouterKeys: aiRes.apiKeys.openrouter,
      cerebrasKeys: aiRes.apiKeys.cerebras,
      sambanovaKeys: aiRes.apiKeys.sambanova,
      mistralKeys: aiRes.apiKeys.mistral,
    };
  }

  async updateProgress(update) {
    const db = await getDb();
    await db.collection('ai_tasks').updateOne({ id: TASK_ID }, { $set: { ...update, lastUpdated: Date.now() } });
    
    const io = getIo();
    if (io) {
      const fullProgress = await this.getProgress();
      io.emit('ai:status', { ok: true, progress: fullProgress });
    }
  }

  async start() {
    if (this.status === 'running') return;
    
    logger.info('[AI_GEN] Service starting...');
    this.status = 'running';
    this.errorDetails = null;
    this.interrupt = false;
    this.runWorker().catch(err => {
      logger.error('[AI_GEN] Worker failed critically:', err.message);
      this.status = 'error';
      this.errorDetails = err.message;
    });
  }

  async pause() {
    logger.info('[AI_GEN] Service pausing (interrupt requested)...');
    this.interrupt = true;
    this.status = 'paused';
    await this.updateProgress({ status: 'paused' });
  }

  async runWorker() {
    const progress = await this.getProgress();
    const puzzlesCol = await getPuzzlesCol();
    
    this.currentModel = progress.currentModel || 'gemini-3.1-flash-lite-preview';
    this.autoSwitch = progress.autoSwitch ?? true;

    // Comprehensive fallback strategy across multiple providers
    const FALLBACK_RESOURCES = [
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      { provider: 'cerebras', model: 'llama3.1-8b' },
      { provider: 'gemini', model: 'gemini-1.5-flash' },
      { provider: 'sambanova', model: 'Meta-Llama-3.3-70B-Instruct' },
      { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free' },
      { provider: 'mistral', model: 'mistral-large-latest' },
      { provider: 'gemini', model: 'gemini-2.0-flash-exp' }
    ];

    const query = {
      'importedFrom.legacy13CharId': { $exists: true },
      name: { $not: /AI Master/ } 
    };

    const cursor = puzzlesCol.find(query).batchSize(10);
    let processed = progress.processed || 0;
    let errors = progress.errors || 0;
    let tokens = progress.tokens || 0;

    await this.updateProgress({ status: 'running', error: null });
    logger.info(`[AI_GEN] Worker loop started for ${progress.total - processed} remaining puzzles.`);

    while (await cursor.hasNext() && !this.interrupt) {
      const puzzle = await cursor.next();
      let success = false;
      let resourceIndex = 0;
      
      // Find starting resource based on progress.currentModel
      const startIdx = FALLBACK_RESOURCES.findIndex(r => r.model === this.currentModel);
      if (startIdx !== -1) resourceIndex = startIdx;

      while (!success && resourceIndex < FALLBACK_RESOURCES.length && !this.interrupt) {
        const resource = FALLBACK_RESOURCES[resourceIndex];
        const keys = await this.getKeysForProvider(resource.provider);
        
        if (keys.length === 0) {
          logger.warn(`[AI_GEN] No keys for provider ${resource.provider}. Skipping resource.`);
          resourceIndex++;
          continue;
        }

        for (let kIdx = 0; kIdx < keys.length; kIdx++) {
          const key = keys[kIdx];
          try {
            logger.info(`[AI_GEN] [${resource.provider}] [Key ${kIdx + 1}/${keys.length}] Processing ${puzzle.uid} with ${resource.model}`);
            const result = await this.generateForPuzzle(puzzle, resource.model, resource.provider, key);
            
            logger.info(`[AI_GEN] [${resource.provider}] Success: "${result.title}"`);
            logger.info(`[AI_GEN] Full Description: ${result.description}`);
            if (result.tags) {
              logger.info(`[AI_GEN] Tags: ${result.tags.join(', ')}`);
            }
            
            await puzzlesCol.updateOne({ uid: puzzle.uid }, {
              $set: {
                name: result.title + ' [AI Master]',
                description: result.description,
                tags: result.tags,
                aiGenerated: true
              }
            });

            processed++;
            tokens += (result.promptTokens + result.completionTokens);
            await this.updateProgress({ processed, tokens, errors, currentModel: resource.model });
            success = true;
            await new Promise(r => setTimeout(r, 2000));
            break; // Valid result, break keys loop
          } catch (e) {
            const isRateLimit = e.message.includes('429') || e.message.includes('Quota exceeded');
            logger.warn(`[AI_GEN] [${resource.provider}] Error: ${e.message}`);
            
            if (isRateLimit && kIdx < keys.length - 1) {
              logger.info(`[AI_GEN] [${resource.provider}] Switching to next key...`);
              continue; // Try next key
            }

            // If we are here, it's either not a rate limit, or it's the last key
            if (this.autoSwitch) {
              const nextResource = FALLBACK_RESOURCES[resourceIndex + 1];
              logger.warn(`[AI_GEN] [${resource.provider}] Resource exhausted or failed. Falling back to: ${nextResource?.provider || 'None'} (${nextResource?.model || 'None'})`);
              resourceIndex++;
              this.currentModel = FALLBACK_RESOURCES[resourceIndex]?.model || this.currentModel;
              break; // Break keys loop, continue resource loop
            } else {
              // No autoswitch, sleep and retry same resource
              logger.warn(`[AI_GEN] Rate limited. Sleeping for 1 minute.`);
              await new Promise(r => setTimeout(r, 60000));
              break; 
            }
          }
        }
      }
      
      if (!success && !this.interrupt) {
        logger.error(`[AI_GEN] Failed to process puzzle ${puzzle.uid} after trying all available resources.`);
        errors++;
        await this.updateProgress({ errors });
      }
    }

    this.status = this.interrupt ? 'paused' : 'finished';
    logger.info(`[AI_GEN] Worker loop ${this.status}. Processed: ${processed}, Errors: ${errors}, Final Model: ${this.currentModel}`);
    await this.updateProgress({ status: this.status });
  }

  async getKeysForProvider(provider) {
    const progress = await this.getProgress();
    const map = {
      gemini: progress.apiKeys,
      groq: progress.groqKeys,
      openrouter: progress.openrouterKeys,
      cerebras: progress.cerebrasKeys,
      sambanova: progress.sambanovaKeys,
      mistral: progress.mistralKeys
    };
    return (map[provider] || []).filter(k => k && k.trim());
  }

  async generateForPuzzle(puzzle, modelName, provider, apiKey) {
    const progress = await this.getProgress();
    const promptTemplate = progress.promptTemplate;
    const prompt = this.buildPrompt(puzzle, promptTemplate);
    const text = await this.callAiRaw(prompt, modelName, provider, apiKey);
    return this.parseAiResponse(text);
  }

  /**
   * Raw call to AI provider
   */
  async callAiRaw(prompt, modelName, provider, apiKey) {
    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    }

    const urls = {
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      openrouter: 'https://openrouter.ai/api/v1/chat/completions',
      cerebras: 'https://api.cerebras.ai/v1/chat/completions',
      sambanova: 'https://api.sambanova.ai/v1/chat/completions',
      mistral: 'https://api.mistral.ai/v1/chat/completions'
    };

    if (!urls[provider]) throw new Error(`UNKNOWN_PROVIDER: ${provider}`);

    const resp = await axios.post(urls[provider], {
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://cotuong.xyz',
        'X-Title': 'Xiangqi Web'
      }
    });

    return resp.data.choices[0].message.content;
  }

  buildPrompt(puzzle, template) {
    const pieceMap = { 'king': 'Tướng', 'advisor': 'Sĩ', 'elephant': 'Tịnh', 'horse': 'Mã', 'cannon': 'Pháo', 'rook': 'Xe', 'pawn': 'Chốt' };
    const material = puzzle.material || {};
    const red = Object.entries(material).filter(([k, v]) => k.startsWith('red') && v > 0).map(([k, v]) => `${v} ${pieceMap[k.split('-')[1]] || k.split('-')[1]}`).join(', ');
    const black = Object.entries(material).filter(([k, v]) => k.startsWith('black') && v > 0).map(([k, v]) => `${v} ${pieceMap[k.split('-')[1]] || k.split('-')[1]}`).join(', ');

    return template
      .replace('{{fen}}', puzzle.fen || '')
      .replace('{{redPieces}}', red || 'Không rõ')
      .replace('{{blackPieces}}', black || 'Không rõ')
      .replace('{{level}}', puzzle.level || 'Trung bình');
  }

  parseAiResponse(text) {
    if (!text) throw new Error('EMPTY_AI_RESPONSE');
    
    try {
      // Find JSON block
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('NO_JSON_FOUND');
      
      let jsonStr = jsonMatch[0];
      
      // Clean up common AI formatting issues
      jsonStr = jsonStr
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
        .replace(/\\n/g, " ") // Replace escaped newlines with space
        .replace(/\n/g, " "); // Replace actual newlines with space

      const parsed = JSON.parse(jsonStr);
      return {
        title: parsed.title || 'Thế Cờ Hay',
        description: parsed.description || '',
        tags: parsed.tags || ['cờ thế', 'giải cờ thế'],
        promptTokens: 100,
        completionTokens: 200
      };
    } catch (e) {
      logger.error(`[AI_GEN] JSON Parse failed: ${e.message}`, { rawHeader: text.substring(0, 100) });
      throw new Error(`PARSE_FAILED: ${e.message}`);
    }
  }

  /**
   * Simple one-off completion for general tasks (logs, issues, etc)
   * Now with FULL multi-provider fallback support.
   */
  async generateSimpleCompletion(prompt) {
    const FALLBACK_RESOURCES = [
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      { provider: 'cerebras', model: 'llama3.1-8b' },
      { provider: 'gemini', model: 'gemini-1.5-flash' },
      { provider: 'sambanova', model: 'Meta-Llama-3.3-70B-Instruct' },
      { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free' }
    ];

    for (const res of FALLBACK_RESOURCES) {
      try {
        const keys = await this.getKeysForProvider(res.provider);
        if (keys.length === 0) continue;

        for (const key of keys) {
          try {
            logger.info(`[AI_GEN] Simple completion trying ${res.provider}/${res.model}...`);
            return await this.callAiRaw(prompt, res.model, res.provider, key);
          } catch (innerErr) {
            logger.warn(`[AI_GEN] ${res.provider} with key failed: ${innerErr.message}`);
          }
        }
      } catch (err) {
        logger.warn(`[AI_GEN] Fallback resource ${res.provider} failed: ${err.message}`);
      }
    }

    throw new Error('ALL_AI_PROVIDERS_FAILED_OR_OVERLOADED');
  }
}
