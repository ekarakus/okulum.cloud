import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './layouts/sidebar.component';
import { SidebarService } from './layouts/sidebar.service';
import { RoutePreloader } from './services/route-preloader.service';
import { AuthService } from './services/auth.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, AsyncPipe],
  template: `
    <!-- Render sidebar only after we've preloaded the dashboard so sidebar and
         content appear together (avoid sidebar-first flash). -->
    <app-sidebar *ngIf="(sidebar.visible$ | async)"></app-sidebar>

    <div class="app-main" [style.marginLeft.px]="(sidebar.visible$ | async) ? sidebarWidth : 0">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
    .app-main { transition: margin-left 200ms ease;   }
    `
  ]
})
export class App {
  // Keep a width that updates when sidebar collapses/expands
  sidebarWidth = 260;
  // show sidebar controlled by SidebarService.visible$ so templates can use async pipe
  constructor(private sidebarSvc: SidebarService, public auth: AuthService, private preloader: RoutePreloader, public sidebar: SidebarService) {
    this.sidebarSvc.collapsed$.subscribe(collapsed => {
      this.sidebarWidth = collapsed ? 60 : 260;
    });

    // Only show the sidebar after the user has authenticated and we finished
    // preloading the dashboard routes so the right-side content is ready.
    this.auth.currentUser$.subscribe(user => {
      if (user) {
        this.preloader.preloadDashboardRoutes().then(() => {
          // set visible through sidebar service so the template async pipe
          // sees the change at the correct time
          this.sidebar.setVisible(true);
        }).catch(e => {
          console.warn('Preload error', e);
          this.sidebar.setVisible(true);
        });
      } else {
        // Hide immediately on logout
        this.sidebar.setVisible(false);
      }
    });
  }
}
