import { API_URL as BASE_URL } from './auth/auth';
import { logger } from './utils/logger';

export const API_URL = BASE_URL;

async function handleResponse(res: Response, method: string, path: string, start: number, token: boolean) {
  const duration = Date.now() - start;
  const tag = `[API]`;
  
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const logMsg = `${tag} ❌ ${method} ${path} ${res.status} (${duration}ms)`;
    
    if (res.status === 401 || res.status === 403) {
      logger.warn(`${logMsg} - Auth failure (Token: ${token})`, { errorBody });
    } else {
      logger.error(logMsg, { errorBody });
    }
    return errorBody;
  }
  
  // Success
  const data = await res.json();
  // logger.debug(`${tag} ✅ ${method} ${path} 200 (${duration}ms)`);
  return data;
}

export async function apiGet<T = any>(path: string, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  const start = Date.now();
  try {
    const res = await fetch(`${API_URL}${path}`, { headers, credentials: 'include' });
    return await handleResponse(res, 'GET', path, start, !!token);
  } catch (e: any) {
    logger.error(`[API] 💥 GET ${path} NETWORK ERROR:`, e.message);
    return { ok: false, error: 'NETWORK_ERROR' } as any;
  }
}

export async function apiPost<T = any>(path: string, body: any, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const start = Date.now();
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });
    return await handleResponse(res, 'POST', path, start, !!token);
  } catch (e: any) {
    logger.error(`[API] 💥 POST ${path} NETWORK ERROR:`, e.message);
    return { ok: false, error: 'NETWORK_ERROR' } as any;
  }
}

export async function apiPut<T = any>(path: string, body: any, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const start = Date.now();
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });
    return await handleResponse(res, 'PUT', path, start, !!token);
  } catch (e: any) {
    logger.error(`[API] 💥 PUT ${path} NETWORK ERROR:`, e.message);
    return { ok: false, error: 'NETWORK_ERROR' } as any;
  }
}

export async function apiPatch<T = any>(path: string, body?: any, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  const start = Date.now();
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
    return await handleResponse(res, 'PATCH', path, start, !!token);
  } catch (e: any) {
    logger.error(`[API] 💥 PATCH ${path} NETWORK ERROR:`, e.message);
    return { ok: false, error: 'NETWORK_ERROR' } as any;
  }
}

export async function apiDelete<T = any>(path: string, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  const start = Date.now();
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    return await handleResponse(res, 'DELETE', path, start, !!token);
  } catch (e: any) {
    logger.error(`[API] 💥 DELETE ${path} NETWORK ERROR:`, e.message);
    return { ok: false, error: 'NETWORK_ERROR' } as any;
  }
}
