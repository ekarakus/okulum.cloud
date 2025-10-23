import { Injectable } from '@angular/core';

// Lightweight IndexedDB wrapper for small JSON blobs.
@Injectable({ providedIn: 'root' })
export class CacheService {
  private dbName = 'screen-app-cache';
  private storeName = 'kv';

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB not supported'));
      const req = indexedDB.open(this.dbName, 1);
      req.onupgradeneeded = (ev: any) => {
        const db: IDBDatabase = ev.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async set(schoolId: number | string | undefined, type: string, value: any): Promise<void> {
    try {
      // avoid unnecessary writes: read existing value and compare
      const existing = await this.get(schoolId, type);
      try {
        const same = existing && JSON.stringify(existing) === JSON.stringify(value);
        if (same) return Promise.resolve();
      } catch (e) {
        // if stringify fails, continue and overwrite
      }

      const db = await this.openDb();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const key = `${schoolId ?? 'global'}:${type}`;
      store.put({ key, value, updatedAt: Date.now() });
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      });
    } catch (err) {
      // silently ignore cache failures
      return Promise.resolve();
    }
  }

  async get(schoolId: number | string | undefined, type: string): Promise<any | null> {
    try {
      const db = await this.openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const key = `${schoolId ?? 'global'}:${type}`;
        const req = store.get(key);
        req.onsuccess = () => { db.close(); resolve(req.result ? req.result.value : null); };
        req.onerror = () => { db.close(); reject(req.error); };
      });
    } catch (err) {
      return null;
    }
  }

  // Optional helper to clear a cached key
  async delete(schoolId: number | string | undefined, type: string): Promise<void> {
    try {
      const db = await this.openDb();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const key = `${schoolId ?? 'global'}:${type}`;
      store.delete(key);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      });
    } catch (err) {
      return Promise.resolve();
    }
  }
}
