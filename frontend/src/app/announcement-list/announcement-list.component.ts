import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-announcement-list',
  standalone: true,
  imports: [CommonModule, MatListModule, MatButtonModule, MatDialogModule],
  template: `
  <div class="announcement-page">
    <div class="page-header">
      <button mat-stroked-button (click)="goBack()" class="back-btn">Geri</button>
      <h2>Duyurular</h2>
      <span class="spacer"></span>
      <button mat-raised-button color="primary" (click)="openAdd()">Yeni Duyuru</button>
    </div>

    <div class="page-container">
      <div *ngIf="loading" class="loading">Yükleniyor...</div>
      <div *ngIf="error" class="error">{{ error }}</div>

      <div *ngIf="!loading && !error">
        <mat-list *ngIf="announcements.length > 0">
          <mat-list-item *ngFor="let a of announcements">
            <div class="item-main">
              <div class="item-title">{{ a.title }}</div>
              <div class="item-meta">{{ a.publish_date | date:'short' }} - {{ a.end_date | date:'short' }} • {{ a.is_active ? 'Aktif' : 'Pasif' }}</div>
            </div>
            <div class="item-actions">
              <button mat-icon-button color="primary" (click)="edit(a)">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button mat-icon-button color="warn" (click)="remove(a)">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </mat-list-item>
        </mat-list>
        <div *ngIf="announcements.length === 0" class="no-data">
          <span class="material-symbols-outlined">info</span>
          <p>Henüz duyuru yok.</p>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .announcement-page { padding: 16px; display:flex; flex-direction:column; align-items:center; }
    .page-header { width:100%; max-width:1000px; display:flex; align-items:center; gap:12px; }
    .page-header h2 { margin:0; flex:0 0 auto; }
    .spacer { flex:1 1 auto; }
    .back-btn { margin-right:8px; }
    .page-container { width:100%; max-width:1000px; margin-top:12px; }
    .item-main { display:flex; flex-direction:column; }
    .item-title { font-weight:600; }
    .item-meta { font-size:12px; color:#666; }
    .item-actions { margin-left:auto; display:flex; gap:8px; align-items:center; }
    .no-data { text-align:center; color:#666; padding:28px; }
    .loading { text-align:center; padding:16px; }
    .error { color:crimson; padding:12px; }
    @media (max-width:600px) { .page-header, .page-container { padding:0 8px; } }
  `]
})
export class AnnouncementListComponent {
  http = inject(HttpClient);
  dialog = inject(MatDialog);
  router = inject(Router);
  announcements: any[] = [];
  loading = false;
  error: string | null = null;

  constructor() { this.load(); }

  load() {
    this.loading = true; this.error = null;
    this.http.get<any[]>('/api/announcements').subscribe({ next: r => { this.announcements = r || []; this.loading = false; }, error: err => { this.error = err?.message || 'Listeleme hatası'; this.loading = false; } });
  }

  openAdd() {
    import('../announcement-add-edit-dialog/announcement-add-edit-dialog.component').then(m => {
      const ref = this.dialog.open(m.AnnouncementAddEditDialogComponent, { data: {} });
      ref.afterClosed().subscribe(() => this.load());
    });
  }

  edit(a: any) {
    import('../announcement-add-edit-dialog/announcement-add-edit-dialog.component').then(m => {
      const ref = this.dialog.open(m.AnnouncementAddEditDialogComponent, { data: { announcement: a } });
      ref.afterClosed().subscribe(() => this.load());
    });
  }

  remove(a: any) {
    if (!confirm('Duyuruyu silmek istediğinize emin misiniz?')) return;
    this.http.delete('/api/announcements/' + a.id).subscribe(() => this.load());
  }

  goBack() { try { this.router.navigate(['/dashboard']); } catch (e) { window.history.back(); } }
}
