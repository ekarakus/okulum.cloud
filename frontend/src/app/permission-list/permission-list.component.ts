import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { isPlatformBrowser } from '@angular/common';
import { apiBase } from '../runtime-config';
import { Router } from '@angular/router';
import { PermissionAddEditDialogComponent } from '../permission-add-edit-dialog/permission-add-edit-dialog.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-permission-list',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatCardModule, MatButtonModule, MatTableModule, MatDialogModule, MatIconModule, MatMenuModule, MatTooltipModule],
  host: { 'ngSkipHydration': '' },
  template: `
    <div class="container">
      <!-- Top-level header and actions (filters moved inside table card) -->
      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <button mat-icon-button (click)="goToDashboard()" matTooltip="Dashboard'a Dön" class="back-btn">
            <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
          </button>
          <h1>
            <mat-icon fontSet="material-symbols-outlined">security</mat-icon>
            Yetki Yönetimi
          </h1>
        </div>
        <button mat-raised-button color="primary" (click)="openAddDialog()" class="add-btn">
          <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
          Yeni Yetki Ekle
        </button>
      </div>

      <!-- Permissions Table -->
      <mat-card class="table-card">
        <div class="table-header">
          <h2>
            <mat-icon fontSet="material-symbols-outlined">format_list_bulleted</mat-icon>
            Yetki Listesi
          </h2>
          <div class="perm-count">Toplam Yetki: {{ permissions.length }}</div>
        </div>
        <!-- Filters placed directly above the table headers for visibility -->
        <div class="table-filters" style="padding:12px 16px; border-bottom:1px solid #eee; display:flex; gap:1rem; align-items:center;">
          <mat-form-field appearance="outline" style="width:320px; margin:0;">
            <input matInput placeholder="Ara (Yetki adı veya açıklama)" [(ngModel)]="filterText" (ngModelChange)="onFilterChange($event)">
          </mat-form-field>
          <div style="flex:1 1 auto"></div>
        </div>
        <div class="table-container">
          <table mat-table [dataSource]="pagedPermissions" class="permissions-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef (click)="onHeaderClick('name')" class="sortable">Yetki Adı
                <mat-icon fontSet="material-symbols-outlined" *ngIf="sort.field==='name'">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <td mat-cell *matCellDef="let p">{{p.name}}</td>
            </ng-container>
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef (click)="onHeaderClick('description')" class="sortable">Açıklama
                <mat-icon fontSet="material-symbols-outlined" *ngIf="sort.field==='description'">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <td mat-cell *matCellDef="let p">{{p.description || '-'}}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="sortable">İşlemler
                <mat-icon fontSet="material-symbols-outlined" *ngIf="sort.field==='actions'">swap_horiz</mat-icon>
              </th>
              <td mat-cell *matCellDef="let p" style="display:flex; gap:8px; align-items:center;">
                <button mat-icon-button color="primary" aria-label="Düzenle" (click)="edit(p)" title="Düzenle">
                  <mat-icon fontSet="material-symbols-outlined">edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" aria-label="Sil" (click)="remove(p)" title="Sil">
                  <mat-icon fontSet="material-symbols-outlined">delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['name','description','actions']" class="header-row"></tr>
            <tr mat-row *matRowDef="let row; columns: ['name','description','actions'];"></tr>
          </table>
        </div>
        <!-- Pagination controls -->
        <div class="pagination-controls" style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-top:1px solid #eee; gap:12px;">
          <div style="display:flex; gap:8px; align-items:center;">
            <button mat-button (click)="prevPage()" [disabled]="pageIndex<=0"><mat-icon fontSet="material-symbols-outlined">chevron_left</mat-icon> Önceki</button>
            <button mat-button (click)="nextPage()" [disabled]="(pageIndex+1) >= totalPages">Sonraki <mat-icon fontSet="material-symbols-outlined">chevron_right</mat-icon></button>
          </div>
          <div style="display:flex; gap:12px; align-items:center; font-size:13px; color:#444;">
            <div>Sayfa {{pageIndex+1}} / {{totalPages}} - Toplam: {{filteredPermissions.length}}</div>
            <div style="display:flex; align-items:center; gap:6px;">
              <label style="font-size:13px; color:#444;">Sayfa boyutu</label>
              <select [(ngModel)]="pageSize" (change)="onPageSizeChange($event)" style="padding:6px; border-radius:4px; border:1px solid #ccc;">
                <option [value]="25">25</option>
                <option [value]="50">50</option>
              </select>
            </div>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .header h1 { margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.8rem; font-weight: 600; color: #2c3e50; }
    .header h1 mat-icon { font-size: 2rem; width: 2rem; height: 2rem; color: #1976d2; }

    .table-card { border-radius: 12px; overflow: hidden; }
    .table-header { padding: 1.5rem; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; }
    .table-header h2 { margin: 0; font-size: 1.2rem; font-weight: 600; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem; }
  .table-header .perm-count { font-weight: 600; color: rgba(0,0,0,0.75); }
    .table-container { overflow-x: auto; }
    .permissions-table { width: 100%; }

  /* Filters placed above headers */
  .table-filters { padding: 12px 16px; display:flex; align-items:center; gap:12px; }
  .table-filters mat-form-field { margin: 0; }

    /* Sortable header look */
  .permissions-table th.mat-header-cell.sortable { cursor: pointer; user-select: none; font-weight: 700; color: #2c3e50; display:flex; align-items:center; gap:6px; }
  .permissions-table th.mat-header-cell.sortable:hover { color: #1e88e5; }
  .permissions-table th.mat-header-cell.sortable mat-icon { font-size:16px; color:#666; margin-left:4px; }

    /* Aggressive condensed table: very small padding and compact row height */
    .permissions-table .mat-header-cell, .permissions-table .mat-cell, .permissions-table th, .permissions-table td {
      padding: 4px 16px !important;
      font-size: 0.86rem;
      line-height: 1.0;
    }
    .permissions-table tr.mat-row { height: 30px; }
    .permissions-table tr.mat-row:hover { background: rgba(0,0,0,0.04); }
    .permissions-table th.mat-header-cell { font-size: 0.88rem; padding: 6px 6px !important; }
    /* Add extra left padding specifically to the permission name column */
    .permissions-table .mat-cell.mat-column-name, .permissions-table .mat-header-cell.mat-column-name {
      padding-left: 14px !important;
    }

    .back-btn { background-color: #f8f9fa; color: #1976d2; border: 2px solid #e3f2fd; transition: all 0.3s ease; }
    .back-btn:hover { background-color: #e3f2fd; transform: scale(1.05); }
    .back-btn mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }

    .add-btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); border: none; box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3); transition: all 0.3s ease; }
    .add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4); }
    .add-btn mat-icon { font-size: 1.2rem; width: 1.2rem; height: 1.2rem; margin-right: 0.5rem; }

    @media (max-width: 768px) { .container { padding: 1rem; } .header { flex-direction: column; gap: 1rem; align-items: stretch; } .table-container { font-size: 0.9rem; } }
  `]
})
export class PermissionListComponent implements OnInit {
  permissions: any[] = [];
  filteredPermissions: any[] = [];
  pagedPermissions: any[] = [];
  filterText: string = '';
  sort: { field: string | null, dir: 'asc' | 'desc' } = { field: 'name', dir: 'asc' };
  pageIndex = 0; pageSize = 25; totalPages = 1;

  constructor(private http: HttpClient, private dialog: MatDialog, private cdr: ChangeDetectorRef, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  goToDashboard() { this.router.navigate(['/dashboard']); }

  private getToken(): string | null { if (isPlatformBrowser(this.platformId)) return localStorage.getItem('token'); return null; }

  ngOnInit() { this.load(); }

  load() {
    const token = this.getToken();
    if (!token) return;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>(`${apiBase}/api/permissions`, { headers }).subscribe({
      next: (d: any) => {
        // Ensure we have an array (some APIs wrap results)
        this.permissions = Array.isArray(d) ? d : (d && d.permissions) ? d.permissions : [];
        this.pageIndex = 0;
        // Populate filtered and paged arrays so the table shows immediately
        this.applyFiltersAndSort();
        this.cdr.detectChanges();
      },
      error: e => console.error('Error loading permissions', e)
    });
  }

  onFilterChange(_v?: any) {
    this.pageIndex = 0;
    this.applyFiltersAndSort();
  }

  onPageSizeChange(_e: any) {
    this.pageIndex = 0;
    this.applyFiltersAndSort();
  }

  private applyFiltersAndSort() {
    // filter
    this.filteredPermissions = (this.permissions || []).filter(p => {
      if (!this.filterText || this.filterText.trim() === '') return true;
      const q = this.filterText.toLowerCase();
      return (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    });
    // sort
    if (this.sort.field) {
      const f = this.sort.field;
      const dir = this.sort.dir === 'asc' ? 1 : -1;
      this.filteredPermissions.sort((a,b) => {
        const va = ((a[f]||'') + '').toLowerCase();
        const vb = ((b[f]||'') + '').toLowerCase();
        if (va === vb) return 0; return va > vb ? dir : -dir;
      });
    }
    // pagination
    this.totalPages = Math.max(1, Math.ceil((this.filteredPermissions.length || 0) / this.pageSize));
    const start = this.pageIndex * this.pageSize;
    this.pagedPermissions = (this.filteredPermissions || []).slice(start, start + this.pageSize);
    this.cdr.detectChanges();
  }

  onHeaderClick(field: string) {
    if (this.sort.field === field) this.sort.dir = this.sort.dir === 'asc' ? 'desc' : 'asc';
    else { this.sort.field = field; this.sort.dir = 'asc'; }
    this.applyFiltersAndSort();
  }

  nextPage(){ if ((this.pageIndex+1) < this.totalPages) { this.pageIndex++; this.applyFiltersAndSort(); } }
  prevPage(){ if (this.pageIndex>0) { this.pageIndex--; this.applyFiltersAndSort(); } }

  openAddDialog() {
    const dialogRef = this.dialog.open(PermissionAddEditDialogComponent, {
      width: '400px',
      data: { permission: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const token = this.getToken();
        if (!token) return;
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http.post(`${apiBase}/api/permissions`, result, { headers }).subscribe({
          next: () => this.load(),
          error: e => alert('Hata: ' + (e?.error?.error || e?.message || e))
        });
      }
    });
  }

  edit(p: any) {
    const dialogRef = this.dialog.open(PermissionAddEditDialogComponent, {
      width: '400px',
      data: { permission: p }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const token = this.getToken();
        if (!token) return;
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http.put(`${apiBase}/api/permissions/${p.id}`, result, { headers }).subscribe({
          next: () => this.load(),
          error: e => alert('Hata: ' + (e?.error?.error || e?.message || e))
        });
      }
    });
  }

  remove(p: any) {
    if (!confirm(`"${p.name}" yetkisini silmek istiyor musunuz?`)) return;
    const token = this.getToken(); if (!token) return;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.delete(`${apiBase}/api/permissions/${p.id}`, { headers }).subscribe({ next: () => this.load(), error: e => alert('Hata: ' + (e?.error?.error || e?.message || e)) });
  }
}
