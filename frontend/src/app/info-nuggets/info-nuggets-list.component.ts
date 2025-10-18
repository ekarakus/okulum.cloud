import { Component, inject, NgZone, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoNuggetService } from '../services/info-nugget.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-info-nuggets-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule],
  template: `
  <div class="container">
    <div class="header">
      <div class="header-left">
        <button mat-icon-button (click)="goBack()" class="back-btn" aria-label="Geri">
          <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
        </button>
        <h1>
          <mat-icon fontSet="material-symbols-outlined">info</mat-icon>
          Bilgi Kartları
        </h1>
      </div>
    </div>

    <div class="sub-controls" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:12px">
        <mat-form-field appearance="fill" style="width:220px">
          <mat-label>Kategori</mat-label>
          <select matNativeControl [(ngModel)]="filterCategory" (change)="onFilterChange()">
            <option value="">Tümü</option>
            <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
          </select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:320px">
          <mat-label>Ara (başlık ve içerik)</mat-label>
          <input matInput [(ngModel)]="searchText" (keyup.enter)="onFilterChange()" placeholder="Arama metni yazıp Enter'a basın">
        </mat-form-field>
      </div>

      <div style="display:flex;gap:8px;align-items:center">
        <button mat-stroked-button color="primary" (click)="openImport()">
          <mat-icon fontSet="material-symbols-outlined">file_upload</mat-icon>
          XLS ile Yükle
        </button>

        <button mat-stroked-button color="primary" (click)="openCategories()">
          <mat-icon fontSet="material-symbols-outlined">category</mat-icon>
          Kategoriler
        </button>

        <button mat-raised-button color="primary" (click)="openCreate()" class="add-btn">
          <mat-icon fontSet="material-symbols-outlined">add_circle</mat-icon>
          Yeni
        </button>
      </div>
  </div>

    <mat-card class="table-card">
      <div class="table-header">
        <h2>
          <mat-icon fontSet="material-symbols-outlined">format_list_bulleted</mat-icon>
          Bilgi Kartı Listesi
        </h2>
      </div>

      <div class="table-container">
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; width:64px">#</th>
              <th class="sortable" style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;" (click)="sort('title')">
                Başlık
                <mat-icon *ngIf="sortBy==='title'" fontSet="material-symbols-outlined" class="sort-icon">{{ order==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <th class="sortable" style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;" (click)="sort('text_content')">
                İçerik
                <mat-icon *ngIf="sortBy==='text_content'" fontSet="material-symbols-outlined" class="sort-icon">{{ order==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <th class="sortable" style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;" (click)="sort('category')">
                Kategori
                <mat-icon *ngIf="sortBy==='category'" fontSet="material-symbols-outlined" class="sort-icon">{{ order==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <th class="sortable" style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;" (click)="sort('start_date')">
                Başlangıç Tarihi
                <mat-icon *ngIf="sortBy==='start_date'" fontSet="material-symbols-outlined" class="sort-icon">{{ order==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <th class="sortable" style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;" (click)="sort('expiration_date')">
                Bitiş Tarihi
                <mat-icon *ngIf="sortBy==='expiration_date'" fontSet="material-symbols-outlined" class="sort-icon">{{ order==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd">Yayın Saati</th>
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="items.length === 0">
              <td colspan="8" style="padding: 20px; text-align: center; color: #666;">Henüz kayıt yok.</td>
            </tr>
            <tr *ngFor="let it of items; let i = index" [ngClass]="{'inactive-row': !it.is_active}" style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px; text-align: center;">{{ pageIndex * pageSize + i + 1 }}</td>
              <td style="padding: 8px;">{{ it.title }}</td>
              <td style="padding: 8px;">{{ (it.text_content || '') | slice:0:50 }}<span *ngIf="it.text_content && it.text_content.length>50">...</span></td>
              <td style="padding: 8px;">
                <span *ngIf="it.Category" style="display:inline-flex;align-items:center;gap:8px">
                  <span style="width:10px;height:10px;border-radius:50%;display:inline-block;background:{{ it.Category.color_hex || '#999' }}"></span>
                  <span>{{ it.Category.name }}</span>
                </span>
                <span *ngIf="!it.Category">-</span>
              </td>
              <td style="padding: 8px;">{{ it.start_date ? (it.start_date | date:'yyyy-MM-dd') : '-' }}</td>
              <td style="padding: 8px;">{{ it.expiration_date ? (it.expiration_date | date:'yyyy-MM-dd') : '-' }}</td>
              <td style="padding: 8px;">
                <span *ngIf="it.publish_start_time || it.publish_end_time">{{ it.publish_start_time || '-' }} - {{ it.publish_end_time || '-' }}</span>
                <span *ngIf="!it.publish_start_time && !it.publish_end_time">-</span>
              </td>
              <td style="padding: 8px;">
                <button mat-button (click)="edit(it)" style="margin-right: 5px;"><mat-icon fontSet="material-symbols-outlined">edit</mat-icon> Düzenle</button>
                <button mat-button color="warn" (click)="remove(it)"><mat-icon fontSet="material-symbols-outlined">delete</mat-icon> Sil</button>
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
        <div style="display:flex;align-items:center;gap:8px;margin-left:12px">
          <mat-form-field appearance="outline" style="width:140px;margin-left:8px">
            <mat-label>Sayfa başına</mat-label>
            <mat-select [(value)]="pageSize" (selectionChange)="onPageSizeChange($event.value)">
              <mat-option *ngFor="let s of pageSizeOptions" [value]="s">{{ s }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <button mat-button (click)="nextPage()" [disabled]="pageIndex === totalPages - 1">
          Sonraki
          <mat-icon fontSet="material-symbols-outlined">chevron_right</mat-icon>
        </button>
      </div>
    </mat-card>
  </div>
  `,
  styles: [
    `
    .container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .header h1 { margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.8rem; font-weight: 600; color: #2c3e50; }
    .header h1 mat-icon { font-size: 2rem; width: 2rem; height: 2rem; color: #1976d2; }

    .table-card { border-radius: 12px; overflow: hidden; }
    .table-header { padding: 1.5rem; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; }
    .table-header h2 { margin: 0; font-size: 1.2rem; font-weight: 600; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem; }
    .table-container { overflow-x: auto; }

    .back-btn { background-color: #f8f9fa; color: #1976d2; border: 2px solid #e3f2fd; transition: all 0.3s ease; }
    .back-btn:hover { background-color: #e3f2fd; transform: scale(1.05); }
    .back-btn mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }

    .add-btn { padding: 0.6rem 1rem; border-radius: 8px; font-weight: 500; background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); border: none; box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15); transition: all 0.2s ease; }
    .add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(25, 118, 210, 0.25); }

    .pagination-controls { display: flex; justify-content: center; align-items: center; padding: 1rem 0; gap: 1rem; }
    .page-info { font-size: 0.9rem; color: #666; }

    @media (max-width: 768px) { .container { padding: 1rem; } .header { flex-direction: column; gap: 1rem; align-items: stretch; } .table-container { font-size: 0.9rem; } }
    .inactive-row { background-color: rgba(255, 200, 200, 0.45); }
  /* sortable header hover/cursor */
  th.sortable { cursor: pointer; user-select: none; }
  th.sortable:hover { background: rgba(0,0,0,0.02); }
  .sort-icon { font-size: 14px; vertical-align: middle; margin-left: 6px; color: rgba(0,0,0,0.6); }
    `
  ],
})
export class InfoNuggetsListComponent {
  private svc = inject(InfoNuggetService);
  private dialog = inject(MatDialog);
  private zone = inject(NgZone);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  items: any[] = [];
  categories: any[] = [];
  pageIndex = 0;
  pageSize = 10;
  totalPages = 1;
  pageSizeOptions = [10, 25, 50];
  filterCategory: any = '';
  searchText: string = '';
  sortBy = 'created_at';
  order: 'asc' | 'desc' = 'desc';

  constructor(){ }

  ngOnInit(): void {
    // load data on init so the list appears without extra user interaction
    this.reload();
    this.loadCategories();
  }

  goBack() { this.router.navigate(['/dashboard']); }

  reload() {
    const page = this.pageIndex + 1;
    // include searchText as an optional parameter; service will ignore unknown extra params so we pass via list for now
    this.svc.list(page, this.pageSize, this.filterCategory || undefined, this.sortBy, this.order, this.searchText || undefined).subscribe((r:any) => {
      this.items = r.data || [];
      this.totalPages = Math.max(1, Math.ceil((r.total || 0) / this.pageSize));
      // ensure change detection runs immediately so the template shows the items without focus/click
      try { this.cdr.detectChanges(); } catch(e) { /* noop in case change detector not available */ }
    }, err => { console.error(err); });
  }

  onFilterChange(){ this.pageIndex = 0; this.reload(); }

  onPageSizeChange(size: number) { this.pageSize = size; this.pageIndex = 0; this.reload(); }

  loadCategories(){ this.svc.listCategories().subscribe((r:any) => this.categories = r || []); }

  sort(col: string){ if (this.sortBy === col) this.order = this.order === 'asc' ? 'desc' : 'asc'; else { this.sortBy = col; this.order = 'asc'; } this.reload(); }

  prevPage(){ if (this.pageIndex>0){ this.pageIndex--; this.reload(); } }
  nextPage(){ if (this.pageIndex < this.totalPages-1){ this.pageIndex++; this.reload(); } }

  openCreate(){ import('./info-nugget-form.component').then(m => { const ref = this.dialog.open(m.InfoNuggetFormComponent, { data: null, width: '720px' }); ref.afterClosed().subscribe(r => { if (r && r.success) this.reload(); }); }); }

  openImport(){ import('./info-nuggets-import-dialog.component').then(m => { const ref = this.dialog.open(m.InfoNuggetsImportDialogComponent, { width: '720px', data: { categories: this.categories } }); ref.afterClosed().subscribe(r => { if (r && r.success) this.reload(); }); }); }

  openCategories(){ this.router.navigate(['/info-nugget-categories']); }

  edit(it:any){ import('./info-nugget-form.component').then(m => { const ref = this.dialog.open(m.InfoNuggetFormComponent, { data: { nuggetId: it.id }, width: '720px' }); ref.afterClosed().subscribe(r => { if (r && r.success) this.reload(); }); }); }

  remove(it:any){ if (!confirm('Silmek istediğinize emin misiniz?')) return; this.svc.delete(it.id).subscribe(() => this.reload(), err => { alert('Silme hatası'); console.error(err); }); }
}
