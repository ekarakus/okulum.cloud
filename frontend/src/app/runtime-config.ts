import { environment } from '../environments/environment';

// runtime-config.ts
// Export a runtime-resolved apiBase value. It prefers window.__env.apiUrl when present.
// Otherwise, fallback to compiled environment.apiUrl.

function getRuntimeApi(): string | null {
  try {
    const w = (window as any) || {};
    if (w && w.__env && typeof w.__env.apiUrl === 'string' && w.__env.apiUrl.length) {
      return String(w.__env.apiUrl).replace(/\/$/, '');
    }
  } catch (e) { /* ignore */ }

  // Use the compiled environment apiUrl
  return String(environment.apiUrl || '').replace(/\/$/, '');
}

export const apiBase: string = getRuntimeApi() || '';

export function getApiBase() { return apiBase; }
