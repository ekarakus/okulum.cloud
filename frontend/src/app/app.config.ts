import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, isDevMode, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { isPlatformBrowser } from '@angular/common';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import '@angular/common/locales/global/tr';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()),
    provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }),
    {
      provide: 'IS_BROWSER',
      useFactory: () => isPlatformBrowser
    },
    { provide: LOCALE_ID, useValue: 'tr' },
    { provide: MAT_DATE_LOCALE, useValue: 'tr' }
  ]
};
