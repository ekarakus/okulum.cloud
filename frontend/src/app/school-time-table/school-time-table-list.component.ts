import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { apiBase } from '../runtime-config';
import { SchoolTimeTableDialogComponent } from './school-time-table-dialog.component';

interface Entry { id?: number; period_name: string; period_type: 'class'|'break'|'lunch'; start_time: string; duration_minutes: number; is_block?: boolean; block_id?: number | null; day_of_week: number }

@Component({
  selector: 'app-school-time-table',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatMenuModule, MatDividerModule, MatTooltipModule],
  styles: [`
    .container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem; flex-wrap:wrap; gap:1rem; }
    .header-left { display:flex; align-items:center; gap:1rem; }
  .header h1 { margin:0; display:flex; align-items:center; gap:0.5rem; font-size:1.4rem; font-weight:600; color:#2c3e50 }
  .header h1 mat-icon { font-size:1.6rem; color:#1976d2 }
    .stats-section { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem; margin-bottom:2rem }
    .stat-card { padding:1.5rem; border-radius:12px }
    .stat-content { display:flex; align-items:center; gap:1rem }
  .stat-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center }
    .stat-text { flex:1 }
    .stat-number { font-size:1.8rem; font-weight:700 }
  .table-card { border-radius:12px; overflow:visible }
  .table-header { padding:0.9rem; background:#f8f9fa; border-bottom:1px solid #e0e0e0; display:flex; justify-content:space-between; align-items:center }
  .table-container { overflow-x:auto }
  .items-table { width:100%; }
  /* edit button hidden by default; appears when hovering the cell */
  .cell-actions button.edit { display: none; }
  td.cell:hover .cell-actions button.edit { display: inline-flex; opacity: 1; }
  /* period type styles */
  .period-cell { border-radius:6px; padding:2px 4px; display:inline-flex; align-items:center; gap:6px; min-width:80px }
  /* chip backgrounds and left accent per type */
  .type-class { background: linear-gradient(90deg,#e8f5e9,#d0f0d8); border-left:6px solid #43a047; box-shadow: 0 1px 4px rgba(66,165,66,0.08) }
  .type-break { background: linear-gradient(90deg,#eaf4ff,#d7efff); border-left:6px dashed #0288d1; box-shadow: 0 1px 4px rgba(33,150,243,0.06) }
  .type-lunch { background: linear-gradient(90deg,#fff9e6,#fff3cc); border-left:6px solid #fb8c00; box-shadow: 0 1px 4px rgba(251,140,0,0.06) }
  .block-badge { display:inline-block; padding:2px 6px; border-radius:6px; background:#ffe0b2; font-size:12px; margin-left:8px }
  /* circular icon badge (Google Material Symbols) */
  /* icon background colors (stronger for contrast) */
  .type-class .type-icon, .type-icon.type-class { background:#2e7d32 }
  .type-break .type-icon, .type-icon.type-break { background:#1976d2 }
  .type-lunch .type-icon, .type-icon.type-lunch { background:#f57c00 }
  /* period name color per type */
  .type-class .period-name { color:#1b5e20; font-weight:600; font-size:13px }
  .type-break .period-name { color:#0d47a1; font-weight:600; font-size:13px }
  .type-lunch .period-name { color:#e65100; font-weight:600; font-size:13px }
  /* condensed table spacing */
  td.cell { padding:6px 8px 36px 8px }
  .items-table { font-size:13px }
  .block-cell { box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06); border-left:4px solid rgba(255,152,0,0.85); }
  /* show actions below the cell without shifting layout */
  .cell-inner:focus-within .cell-actions, .cell-inner:hover .cell-actions { opacity: 1 }
  td.cell { padding-bottom:48px } /* make room for absolutely positioned actions */
  .cell-actions { pointer-events:auto; box-shadow: 0 6px 18px rgba(0,0,0,0.12); }
  .cell-actions { transition: opacity .12s ease-in-out; }
  .cell-actions .action-backdrop { transition: transform .12s ease, opacity .12s ease }
  .cell-inner:focus-within .action-backdrop, .cell-inner:hover .action-backdrop { transform: translate(-50%,-50%) scale(1.05); opacity:1 }
  /* left column (Ders / Saat) styling */
  .left-column { padding:10px 12px; width:320px; vertical-align:top }
  .left-column .title { font-weight:700; margin-bottom:6px }
  .left-chip { display:flex; gap:8px; align-items:center; color:#444 }
  .left-class { background: linear-gradient(90deg,#e8f5e9,#d0f0d8); border-left:6px solid #43a047; padding:8px; border-radius:8px }
  .left-break { background: linear-gradient(90deg,#eaf4ff,#d7efff); border-left:6px dashed #0288d1; padding:8px; border-radius:8px }
  .left-lunch { background: linear-gradient(90deg,#fff9e6,#fff3cc); border-left:6px solid #fb8c00; padding:8px; border-radius:8px }
  .left-type-label { color:#666; margin-left:6px }
  .empty-state { text-align:center; padding:2rem }
  `],
  template: `
    <div class="container">
      <div class="header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()" matTooltip="Dashboard'a Dön" class="back-btn">
            <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
          </button>
          <h1>
            <mat-icon fontSet="material-symbols-outlined">schedule</mat-icon>
            Ders Saatleri
          </h1>
        </div>
        <div style="display:flex; align-items:center; gap:8px">
          <button mat-raised-button color="primary" (click)="openAdd()" class="add-btn">
            <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
            Yeni Dönem Ekle
          </button>
          <button mat-stroked-button color="warn" [disabled]="selectedIds.size===0" (click)="deleteSelected()">
            <mat-icon fontSet="material-symbols-outlined">delete_forever</mat-icon>
            Seçili Sil ({{ selectedIds.size }})
          </button>
        </div>
      </div>

      <div class="stats-section">
        <mat-card class="stat-card entries">
          <div class="stat-content">
            <div class="stat-icon"><mat-icon fontSet="material-symbols-outlined">schedule</mat-icon></div>
            <div class="stat-text">
              <div class="stat-number">{{ entries.length }}</div>
              <div class="stat-label">Toplam Dönem</div>
            </div>
          </div>
        </mat-card>
      </div>

      <mat-card class="table-card">
        <div class="table-header">
          <h2>
            <mat-icon fontSet="material-symbols-outlined">format_list_bulleted</mat-icon>
            Liste
          </h2>
          <div *ngIf="isLoading" class="header-loading">
            <mat-icon class="loading-icon" fontSet="material-symbols-outlined">autorenew</mat-icon>
            Yükleniyor...
          </div>
        </div>

        <div *ngIf="isLoading" class="loading-state">
          <mat-icon class="loading-icon" fontSet="material-symbols-outlined">cached</mat-icon>
          <p>Veriler yükleniyor...</p>
        </div>

        <div class="table-container" *ngIf="!isLoading && entries.length > 0; else emptyState">
          <table class="items-table" style="width:100%; border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left; padding:8px; border-bottom:1px solid #e0e0e0;">Ders / Saat</th>
                <th *ngFor="let d of daysToShow" style="text-align:center; padding:8px; border-bottom:1px solid #e0e0e0;">{{ dayNames[d] }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of matrix">
                <td [ngClass]="{'left-class': row.period_type==='class','left-break': row.period_type==='break','left-lunch': row.period_type==='lunch'}" class="left-column" style="padding:8px; border-bottom:1px solid #f0f0f0; vertical-align:top; width:320px;">
                  <div class="title">{{ row.displayTime }}</div>
                  <div class="left-chip">
                    <div class="period-name">{{ row.period_name }}</div>
                    <div class="left-type-label">· {{ getTypeLabel(row.period_type) }}</div>
                  </div>
                </td>
                <td *ngFor="let d of daysToShow" class="cell" style="padding:8px; border-bottom:1px solid #f0f0f0; text-align:center; vertical-align:top;">
                  <div *ngIf="row.cells[d]; else emptyCell">
                    <div class="cell-inner" style="display:flex; align-items:flex-start; justify-content:center; gap:8px; position:relative;">
                      <input type="checkbox" [checked]="selectedIds.has(row.cells[d].id)" (change)="toggleSelect(row.cells[d])" />
                      <div style="text-align:left">
                        <div style="display:flex; align-items:center; gap:8px">
                          <span class="period-cell" [ngClass]="getCellClass(row.period_type, row.cells[d])">
                            <span class="period-name">{{ row.cells[d].period_name }}</span>
                          </span>
                          <span *ngIf="row.cells[d].is_block" class="block-badge">Block #{{ row.cells[d].block_id }}</span>
                        </div>
                        <div style="font-size:12px;color:#666">{{ formatTime(row.cells[d].start_time) }} - {{ formatTime(row.cells[d].end_time) || '' }}</div>
                      </div>
                      <div class="cell-actions" style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); display:flex; align-items:center; justify-content:center; gap:4px; opacity:0; transition:opacity .12s; z-index:1000; pointer-events:auto;">
                        <span class="action-backdrop" aria-hidden="true" style="position:absolute; width:56px; height:56px; border-radius:50%; background:rgba(0,0,0,0.06); top:50%; left:50%; transform:translate(-50%,-50%); z-index:1"></span>
                        <button mat-icon-button class="edit" (click)="edit(row.cells[d])" style="position:relative; z-index:2; background:rgba(255,255,255,0.95); border-radius:50%; box-shadow:0 6px 18px rgba(0,0,0,0.12)"><mat-icon fontSet="material-symbols-outlined">edit</mat-icon></button>
                      </div>
                    </div>
                  </div>
                  <ng-template #emptyCell>
                    <div style="color:#999">—</div>
                  </ng-template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #emptyState>
          <div class="empty-state" *ngIf="!isLoading">
            <div class="empty-icon"><mat-icon fontSet="material-symbols-outlined">schedule</mat-icon></div>
            <h3>Henüz dönem eklenmemiş</h3>
            <p>Yeni dönem eklemek için "Yeni Dönem Ekle" butonuna tıklayın.</p>
            <button mat-raised-button color="primary" (click)="openAdd()">Yeni Dönem Oluştur</button>
          </div>
        </ng-template>
      </mat-card>
    </div>
  `
})
export class SchoolTimeTableListComponent implements OnInit {
  entries: Entry[] = [];
  displayedColumns = ['day','name','type','time','actions'];
  isLoading = false;
  sort: { field: string; dir: 'asc'|'desc' } = { field: 'day_of_week', dir: 'asc' };
  // Turkish day names (1 = Monday)
  dayNames: { [k:number]: string } = {1:'Pazartesi',2:'Salı',3:'Çarşamba',4:'Perşembe',5:'Cuma',6:'Cumartesi',7:'Pazar'};
  daysToShow: number[] = [1,2,3,4,5];
  matrix: Array<any> = [];
  selectedIds: Set<number> = new Set();

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef, private dialog: MatDialog) {}

  ngOnInit(): void { this.load(); }

  goBack() { this.router.navigate(['/dashboard']); }

  load() {
    this.isLoading = true;
    this.http.get<Entry[]>(`${apiBase}/api/school-time-table`).subscribe(list => {
      this.entries = list || [];
      this.applySort();
      this.buildMatrix();
      this.isLoading = false;
      this.cdr.detectChanges();
    }, err => { console.error('Failed to load time table', err); this.isLoading = false; });
  }

  buildMatrix() {
    // determine which days exist in entries; default to weekdays if none
    const daySet = new Set<number>();
    for (const e of this.entries) daySet.add(e.day_of_week);
    this.daysToShow = Array.from(daySet).length ? Array.from(daySet).sort((a,b)=>a-b) : [1,2,3,4,5];

    // group by unique period key: start_time|duration|period_type|period_name
    const map = new Map<string, any>();
    for (const e of this.entries) {
      const key = `${e.start_time}|${e.duration_minutes}|${e.period_type}|${e.period_name}`;
      if (!map.has(key)) {
        map.set(key, { start_time: e.start_time, duration_minutes: e.duration_minutes, period_type: e.period_type, period_name: e.period_name, cells: {} });
      }
      const row = map.get(key);
      row.cells[e.day_of_week] = e;
    }

    // convert to array and sort by start_time asc
    this.matrix = Array.from(map.values()).sort((a:any,b:any)=>{
      if (a.start_time < b.start_time) return -1; if (a.start_time > b.start_time) return 1; return 0;
    }).map((r:any) => ({ ...r, displayTime: `${this.formatTime(r.start_time)} (${r.duration_minutes} dk)` }));
  }

  toggleSelect(entry: Entry) {
    if (!entry || !entry.id) return;
    if (this.selectedIds.has(entry.id)) this.selectedIds.delete(entry.id);
    else this.selectedIds.add(entry.id);
  }

  deleteSelected() {
    if (this.selectedIds.size === 0) return;
    if (!confirm(`Seçili ${this.selectedIds.size} kaydı silmek istediğinize emin misiniz?`)) return;
    const calls = Array.from(this.selectedIds).map(id => this.http.delete(`${apiBase}/api/school-time-table/${id}`));
    forkJoin(calls).subscribe(() => { this.selectedIds.clear(); this.load(); }, err => { console.error('Failed to delete selected', err); this.load(); });
  }

  onHeaderClick(field: string) {
    if (this.sort.field === field) this.sort.dir = this.sort.dir === 'asc' ? 'desc' : 'asc';
    else { this.sort.field = field; this.sort.dir = 'asc'; }
    this.applySort();
  }

  applySort() {
    const f = this.sort.field; const d = this.sort.dir === 'asc' ? 1 : -1;
    this.entries.sort((a: any,b: any) => {
      if (a[f] == null) return 1 * d; if (b[f] == null) return -1 * d;
      if (a[f] < b[f]) return -1 * d; if (a[f] > b[f]) return 1 * d; return 0;
    });
  }

  openAdd() {
    const dialogRef = this.dialog.open(SchoolTimeTableDialogComponent, { width: '520px', data: { isNew: true, entry: null } });
    dialogRef.afterClosed().subscribe((res: any) => {
      if (!res) return;
      // If the dialog returned multiple days (array), create one record per day concurrently
      if (Array.isArray(res.day_of_week)) {
        const calls = res.day_of_week.map((d: number) => {
          const payload = { ...res, day_of_week: d };
          return this.http.post<Entry>(`${apiBase}/api/school-time-table`, payload);
        });
        forkJoin(calls).subscribe(() => this.load(), err => { console.error('Failed to create multiple periods', err); this.load(); });
      } else {
        this.http.post<Entry>(`${apiBase}/api/school-time-table`, res).subscribe(() => this.load(), err => { console.error('Failed to create period', err); });
      }
    });
  }

  edit(entry: Entry) {
  const dialogRef = this.dialog.open(SchoolTimeTableDialogComponent, { width: '520px', data: { isNew: false, entry } });
    dialogRef.afterClosed().subscribe((res: any) => {
      if (!res) return;
      this.http.put<Entry>(`${apiBase}/api/school-time-table/${entry.id}`, res).subscribe(() => this.load());
    });
  }
  remove(e: Entry) {
    if (!confirm('Silinsin mi?')) return;
    this.http.delete(`${apiBase}/api/school-time-table/${e.id}`).subscribe(() => this.load());
  }

  removeWithConfirm(e: Entry) {
    if (!confirm('Bu günü silmek istediğinize emin misiniz?')) return;
    this.http.delete(`${apiBase}/api/school-time-table/${e.id}`).subscribe(() => this.load());
  }

  getTypeLabel(t: string) {
    if (!t) return '';
    if (t === 'class') return 'Ders';
    if (t === 'break') return 'Teneffüs';
    if (t === 'lunch') return 'Öğle Arası';
    return t;
  }

  getTypeIcon(t: string) {
    if (!t) return 'schedule';
    switch (t) {
      case 'class': return 'menu_book';
      case 'break': return 'free_breakfast';
      case 'lunch': return 'lunch_dining';
      default: return 'schedule';
    }
  }

  getCellClass(periodType: string, cell?: Entry) {
    const classes: any = {};
    if (periodType === 'class') classes['type-class'] = true;
    else if (periodType === 'break') classes['type-break'] = true;
    else if (periodType === 'lunch') classes['type-lunch'] = true;
    if (cell && cell.is_block) classes['block-cell'] = true;
    return classes;
  }

  formatTime(t?: string) {
    if (!t) return '';
    const parts = (t || '').toString().trim().split(':');
    if (parts.length >= 2) {
      const hh = parts[0].padStart(2, '0');
      const mm = parts[1].padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return t;
  }
}
