import { Injectable } from '@angular/core';
import { Router, Routes } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RoutePreloader {
  constructor(private router: Router) {}

  // Preload the dashboard layout route (path '') and its children.
  async preloadDashboardRoutes(): Promise<void> {
    const rootRoutes = this.router.config || [];
    const dashboardRoute = rootRoutes.find(r => r.path === '');
    if (!dashboardRoute) return;
    // Preload the dashboard route itself if it has a component loader
    await this.preloadRoutes([dashboardRoute]);
  }

  // Recursively preload an array of routes (trigger loadComponent where present)
  async preloadRoutes(routeList: Routes | undefined): Promise<void> {
    if (!routeList || routeList.length === 0) return;
    for (const r of routeList) {
      try {
        if (r.loadComponent) {
          // Call the loader to fetch the component bundle
          await (r.loadComponent() as Promise<any>);
        }
      } catch (e) {
        // Ignore failures — preloading should be best-effort
        // eslint-disable-next-line no-console
        console.warn('Preload failed for route', r.path, e);
      }
      if (r.children) {
        await this.preloadRoutes(r.children as Routes);
      }
    }
  }
}
