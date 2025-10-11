import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-public-device-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="public-wrapper">
      <div class="content">
        <router-outlet></router-outlet>
      </div>
      <footer class="public-footer">
        <span>© {{year}} Okul Bilgisayar Bakım Sistemi</span>
      </footer>
    </div>
  `,
  styles: [`
    .public-wrapper { min-height: 100vh; display: flex; flex-direction: column; background: #f5f7fa; }
    .content { flex: 1; }
    .public-footer { text-align:center; padding: 1rem; font-size: 0.75rem; color:#777; }
  `]
})
export class PublicDeviceLayoutComponent { year = new Date().getFullYear(); }
