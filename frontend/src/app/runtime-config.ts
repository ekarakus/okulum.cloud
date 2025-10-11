// runtime-config.ts
// Export a runtime-resolved apiBase value. It prefers window.__env.apiUrl when present.
// Otherwise, fallback to compiled environment.apiUrl unless it points to localhost while the page host is not localhost.
import { environment } from '../environments/environment';

function getRuntimeApi(): string | null {
  try {
    const w = (window as any) || {};
    if (w && w.__env && typeof w.__env.apiUrl === 'string' && w.__env.apiUrl.length) {
      return String(w.__env.apiUrl).replace(/\/$/, '');
    }
  } catch (e) { /* ignore */ }
  try {
    const compiled = String(environment.apiUrl || '').replace(/\/$/, '');
    if (compiled && !compiled.includes('localhost')) return compiled;
    // if compiled is localhost but the page hostname is not localhost, prefer the known production railay URL
    if (typeof window !== 'undefined' && window.location) {
      const host = window.location.hostname;
      if (host !== 'localhost' && host !== '127.0.0.1') {
        return 'https://okulapi.up.railway.app';
      }
    }
    return compiled || null;
  } catch (e) { return null; }
}

export const apiBase: string = getRuntimeApi() || '';

export function getApiBase() { return apiBase; }
