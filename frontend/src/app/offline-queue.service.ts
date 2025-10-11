// offline-queue.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private queue: any[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  addOperation(operation: any) {
    this.queue.push(operation);
    this.saveQueue();
  }

  getQueue() {
    return this.queue;
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }

  loadQueue() {
    if (isPlatformBrowser(this.platformId)) {
      const data = localStorage.getItem('offlineQueue');
      this.queue = data ? JSON.parse(data) : [];
    }
  }

  saveQueue() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('offlineQueue', JSON.stringify(this.queue));
    }
  }
}
