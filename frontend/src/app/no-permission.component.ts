import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-no-permission',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  styles: [
    `:host { display:block; }
     .np-card { background: white; }
     .mat-symbol { font-family: 'Material Symbols Outlined', 'Material Icons', sans-serif !important; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48; line-height:1; }
     button[mat-raised-button] { background:#1976d2; color:#fff; border:none; padding:8px 12px; border-radius:6px; }
     button[mat-button] { color:#1976d2; }
    `
  ],
  template: `
    <div style="padding:24px; max-width:720px; margin:48px auto; text-align:center;">
      <div class="np-card" style="display:inline-block; padding:24px 32px; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.08);">
        <div style="font-size:72px; color:#f44336; display:flex; align-items:center; justify-content:center;">
          <!-- Inline SVG lock icon as a fallback so it always renders -->
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="false" role="img" aria-label="Yetki yok ikonu">
            <rect width="24" height="24" rx="4" fill="#f44336" />
            <path d="M12 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="#fff"/>
            <path d="M8 11v-1a4 4 0 118 0v1h1a1 1 0 011 1v6a1 1 0 01-1 1H7a1 1 0 01-1-1v-6a1 1 0 011-1h1zm2 0h4v-1a2 2 0 00-4 0v1z" fill="#fff"/>
          </svg>
        </div>
        <h2 style="margin:12px 0 8px;">Yetkiniz yok</h2>
        <p style="margin:0 0 12px; color:#555;">
          <ng-container *ngIf="!missingPerm">Bu sayfayı görüntüleme yetkiniz bulunmamaktadır. Lütfen yöneticinizle iletişime geçin veya ana sayfaya dönün.</ng-container>
          <ng-container *ngIf="missingPerm">Bu sayfayı görüntülemek için gerekli yetki: <strong>{{ missingPerm }}</strong>. Lütfen yöneticinizle iletişime geçin.</ng-container>
        </p>
        <div style="display:flex; gap:8px; justify-content:center; margin-top:16px;">
          <button mat-raised-button color="primary" (click)="goHome()" aria-label="Ana sayfaya dön">
            <mat-icon class="mat-symbol" fontSet="material-symbols-outlined">home</mat-icon>
            &nbsp;Ana Sayfaya Dön
          </button>

        </div>
      </div>
    </div>
  `
})
export class NoPermissionComponent {
  missingPerm: string | null = null;
  constructor(private router: Router, private route: ActivatedRoute) {
    const q = this.route.snapshot.queryParamMap.get('perm');
    this.missingPerm = q ? decodeURIComponent(q) : null;
  }
  goHome() { this.router.navigate(['/']); }
}
