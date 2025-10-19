import { Component, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './layouts/sidebar.component';
import { SidebarService } from './layouts/sidebar.service';
import { AuthService } from './services/auth.service';
import { AsyncPipe, NgIf } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, AsyncPipe, NgIf],
  template: `
    <ng-container *ngIf="(auth.currentUser$ | async) as currentUser">
      <app-sidebar></app-sidebar>
      <div class="app-main" [style.marginLeft.px]="sidebarWidth">
        <router-outlet></router-outlet>
      </div>
    </ng-container>
    <ng-container *ngIf="!(auth.currentUser$ | async)">
      <div class="app-main" style="margin-left:0">
        <router-outlet></router-outlet>
      </div>
    </ng-container>
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
  private subs: Subscription | null = null;
  constructor(private sidebarSvc: SidebarService, public auth: AuthService) {
    this.subs = this.sidebarSvc.collapsed$.subscribe(collapsed => {
      this.sidebarWidth = collapsed ? 60 : 260;
    });
  }
  ngOnDestroy(): void { this.subs?.unsubscribe(); }
}
