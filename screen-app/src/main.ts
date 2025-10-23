import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// Load runtime config (assets/config.json) and expose as window globals before bootstrapping
fetch('/assets/config.json').then(res => res.json()).then(cfg => {
  (window as any).__API_BASE__ = cfg.apiBase || (window as any).__API_BASE__ || 'http://localhost:3000/api';
  (window as any).__SCHOOL_ID__ = cfg.schoolId || (window as any).__SCHOOL_ID__;
}).catch(()=>{
  // leave defaults
}).finally(()=>{
  platformBrowserDynamic().bootstrapModule(AppModule)
    .then(() => {
      // Register a lightweight service worker if supported
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js').catch(err => console.debug('SW registration failed', err));
      }
    })
    .catch(err => console.error(err));
});
