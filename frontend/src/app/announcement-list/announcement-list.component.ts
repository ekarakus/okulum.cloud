import { Component, inject, OnDestroy, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AnnouncementService } from '../services/announcement.service';
import { Subscription } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-announcement-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatButtonModule, MatDialogModule, MatIconModule],
  template: `
  <div class="container">
    <div class="header">
      <div class="header-left">
        <button mat-icon-button (click)="goBack()" class="back-btn" matTooltip="Geri">
          <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
        </button>
        <h1>
          <mat-icon fontSet="material-symbols-outlined">badge</mat-icon>
          Duyurular
        </h1>
      </div>
      <div style="display:flex; gap:8px; align-items:center">
        <button mat-raised-button color="primary" (click)="openAdd()" class="add-btn">
          <mat-icon fontSet="material-symbols-outlined">post_add</mat-icon>
          Yeni Duyuru
        </button>
      </div>
    </div>

    <mat-card class="table-card">
      <div class="table-header">
        <h2>
          <mat-icon fontSet="material-symbols-outlined">format_list_bulleted</mat-icon>
          Duyuru Listesi
        </h2>
      </div>

      <div class="table-container">
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 6px 12px; text-align:left; border-bottom:1px solid #ddd; width:60px">#</th>
              <th style="padding: 6px 12px; text-align:left; border-bottom:1px solid #ddd;">Başlık</th>
              <th style="padding: 6px 12px; text-align:left; border-bottom:1px solid #ddd;">Yayın tarihleri</th>
              <th style="padding: 6px 12px; text-align:left; border-bottom:1px solid #ddd;">Yayın saatleri</th>
              <th style="padding: 6px 12px; text-align:left; border-bottom:1px solid #ddd;">Durum</th>
              <th style="padding: 6px 12px; text-align:left; border-bottom:1px solid #ddd;">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="announcements.length === 0">
              <td colspan="6" style="padding:20px; text-align:center; color:#666">Henüz duyuru yok.</td>
            </tr>
            <tr *ngFor="let a of pagedAnnouncements; let i = index" style="border-bottom:1px solid #eee;">
              <td style="padding:6px 12px; text-align:center">{{ pageIndex * pageSize + i + 1 }}</td>
              <td style="padding:6px 12px">{{ a.title }}</td>
              <td style="padding:6px 12px">
                <div>{{ formatDate(a.publish_date) || '-' }}</div>
                <div *ngIf="a.end_date" style="color:#666;font-size:0.9rem;margin-top:4px">Bitiş: {{ formatDate(a.end_date) }}</div>
              </td>
              <td style="padding:6px 12px">
                <div *ngIf="a.publish_start_time">Başlama: {{ a.publish_start_time }}</div>
                <div *ngIf="a.publish_end_time" style="color:#666;font-size:0.9rem;margin-top:4px">Bitiş: {{ a.publish_end_time }}</div>
                <div *ngIf="!a.publish_start_time && !a.publish_end_time">-</div>
              </td>
              <td style="padding:6px 12px">{{ a.is_active ? 'Aktif' : 'Pasif' }}</td>
              <td style="padding:6px 12px">
                <button mat-button color="accent" (click)="edit(a)" style="margin-right:6px">
                  <span class="material-symbols-outlined" style="margin-right:0.3rem; font-size:18px">edit</span>
                  Düzenle
                </button>
                <button mat-button color="warn" (click)="remove(a)">
                  <span class="material-symbols-outlined" style="margin-right:0.3rem; font-size:18px">delete</span>
                  Sil
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-controls">
        <button mat-button (click)="prevPage()" [disabled]="pageIndex === 0">
          <mat-icon fontSet="material-symbols-outlined">chevron_left</mat-icon>
          Önceki
        </button>
        <span class="page-info">Sayfa {{ pageIndex + 1 }} / {{ totalPages }}</span>
        <button mat-button (click)="nextPage()" [disabled]="pageIndex === totalPages - 1">
          Sonraki
          <mat-icon fontSet="material-symbols-outlined">chevron_right</mat-icon>
        </button>
      </div>
    </mat-card>
  </div>
  `,
  styles: [`
    .container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem }
    .header-left { display:flex; align-items:center; gap:1rem }
    .header h1 { margin:0; display:flex; align-items:center; gap:0.5rem; font-size:1.6rem; font-weight:600; color:#2c3e50 }
    .header h1 mat-icon { font-size:2rem; width:2rem; height:2rem; color:#1976d2 }
    .table-card { border-radius: 12px; overflow: hidden }
    .table-header { padding: 1rem; background:#f8f9fa; border-bottom:1px solid #e0e0e0; display:flex; justify-content:space-between; align-items:center }
    .table-header h2 { margin:0; font-size:1.1rem; font-weight:600; color:#2c3e50; display:flex; align-items:center; gap:0.5rem }
    .table-container { overflow-x:auto }
    .back-btn { background-color: #f8f9fa; color:#1976d2; border:2px solid #e3f2fd }
    .add-btn { padding:0.6rem 1.1rem; border-radius:8px }
    .pagination-controls { display:flex; justify-content:center; align-items:center; padding:1rem 0; gap:1rem }
    .page-info { font-size:0.9rem; color:#666 }
    @media (max-width:768px) { .container { padding:1rem } .header { flex-direction:column; gap:1rem; align-items:stretch } .table-container { font-size:0.9rem } }
  `]
})
export class AnnouncementListComponent {
  http = inject(HttpClient);
  dialog = inject(MatDialog);
  router = inject(Router);
  announcementSvc = inject(AnnouncementService);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  announcements: any[] = [];
  pagedAnnouncements: any[] = [];
  loading = false;
  error: string | null = null;
  pageIndex = 0;
  pageSize = 20;
  totalPages = 1;

  private _subs: Subscription[] = [];

  constructor() {
    // don't call load here — use ngOnInit to ensure Angular lifecycle is initialized
  }

  ngOnInit() {
    // initial load inside Angular zone
    this.zone.run(() => this.load());
    // subscribe to changes and run load inside the zone so change detection triggers
    const s = this.announcementSvc.onChange$.subscribe(() => this.zone.run(() => this.load()));
    this._subs.push(s);
  }

  load() {
    this.loading = true; this.error = null;
    this.http.get<any[]>('/api/announcements').subscribe({ next: r => {
      this.announcements = r || [];
      this.pageIndex = 0;
      this.updatePagedAnnouncements();
      this.loading = false;
      try { this.cdr.detectChanges(); } catch (e) {}
    }, error: err => {
      this.error = err?.message || 'Listeleme hatası';
      this.loading = false;
      try { this.cdr.detectChanges(); } catch (e) {}
    } });
  }

  private updatePagedAnnouncements() {
    this.totalPages = Math.max(1, Math.ceil(this.announcements.length / this.pageSize));
    const start = this.pageIndex * this.pageSize;
    this.pagedAnnouncements = this.announcements.slice(start, start + this.pageSize);
  }

  nextPage() { if (this.pageIndex < this.totalPages - 1) { this.pageIndex++; this.updatePagedAnnouncements(); } }
  prevPage() { if (this.pageIndex > 0) { this.pageIndex--; this.updatePagedAnnouncements(); } }

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
    this.http.delete('/api/announcements/' + a.id).subscribe({ next: () => {
      try { this.announcementSvc.notifyChange(); } catch (e) {}
    }, error: err => {
      console.error('Error deleting announcement:', err);
      alert('Duyuru silinirken hata oluştu. Konsolu kontrol edin.');
    } });
  }

  formatDate(value: any) {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleString();
    } catch (e) {
      return '';
    }
  }

  snippet(html: string, max = 180) {
    if (!html) return '';
    // strip tags and trim
    const stripped = (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (stripped.length <= max) return stripped;
    return stripped.slice(0, max) + '...';
  }

  goBack() { try { this.router.navigate(['/dashboard']); } catch (e) { window.history.back(); } }
  ngOnDestroy() { this._subs.forEach(s => s.unsubscribe()); }
}
