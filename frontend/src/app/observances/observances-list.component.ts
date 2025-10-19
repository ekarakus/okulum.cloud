import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { ObservanceService } from '../services/observance.service';
import { AuthService } from '../services/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin, Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ObservanceFormDialogComponent } from './observance-form-dialog.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-observances-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule, FormsModule, MatTableModule, MatIconModule, MatPaginatorModule, MatSortModule, MatDialogModule, MatCheckboxModule, MatToolbarModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <div class="container">
      <button #refreshTrigger type="button" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;" aria-hidden="true"></button>
      <div class="header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()" class="back-btn" aria-label="Geri">
            <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
          </button>
          <h1>
            <mat-icon fontSet="material-symbols-outlined">event</mat-icon>
            Belirli Gün ve Haftalar
          </h1>
        </div>
      </div>

      <div class="sub-controls" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:12px">
          <mat-form-field appearance="fill" style="width:240px">
            <mat-label>Ara ( ad / açıklama )</mat-label>
            <input matInput [(ngModel)]="searchText" (ngModelChange)="onSearchInput($event)" placeholder="Arama metni yazın">
          </mat-form-field>

          <mat-form-field appearance="fill" style="width:180px">
            <mat-label>Yıl</mat-label>
            <mat-select [(ngModel)]="selectedYear" (selectionChange)="loadList()">
              <mat-option *ngFor="let y of yearOptions" [value]="y">{{ y }}</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-stroked-button color="accent" (click)="importStandardCalendar()" [disabled]="isLoading">MEB Yükle</button>
        </div>

        <div style="display:flex;gap:8px;align-items:center">
          <button mat-stroked-button color="primary" (click)="onCreate()">Yeni Gün veya Hafta </button>
          <button mat-stroked-button color="warn" (click)="bulkDelete()">Seçili Sil</button>
        </div>
      </div>

      <mat-card class="table-card">
        <div class="table-header">
          <h2>
            <mat-icon fontSet="material-symbols-outlined">format_list_bulleted</mat-icon>
              Belirli Gün ve Haftalar  Listesi
          </h2>
        </div>

        <div class="table-container">
          <table style="width:100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; width:64px">
                  <mat-checkbox (change)="$event ? toggleSelectAll($event.checked) : null"></mat-checkbox>
                </th>
                <th class="sortable" style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;" (click)="sort('name')">
                  Ad
                  <mat-icon *ngIf="sortBy==='name'" fontSet="material-symbols-outlined" class="sort-icon">{{ sortDir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                <th class="sortable" style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;" (click)="sort('start_date')">
                  Başlangıç
                  <mat-icon *ngIf="sortBy==='start_date'" fontSet="material-symbols-outlined" class="sort-icon">{{ sortDir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                <th class="sortable" style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;" (click)="sort('end_date')">
                  Bitiş
                  <mat-icon *ngIf="sortBy==='end_date'" fontSet="material-symbols-outlined" class="sort-icon">{{ sortDir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="data.length === 0">
                <td colspan="5" style="padding: 20px; text-align: center; color: #666;">Henüz kayıt yok.</td>
              </tr>
              <tr *ngFor="let row of data; let i = index" style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">
                  <mat-checkbox (change)="$event ? toggleSelect(row.id, $event.checked) : null" [checked]="selectedIds.has(row.id)"></mat-checkbox>
                </td>
                <td style="padding: 8px;">{{ row.name }}</td>
                <td style="padding: 8px;">{{ row.start_date ? (row.start_date | date:'dd-MM-yyyy') : '-' }}</td>
                <td style="padding: 8px;">{{ row.end_date ? (row.end_date | date:'dd-MM-yyyy') : '-' }}</td>
                <td style="padding: 8px;">
                  <button mat-button (click)="onEdit(row)"><mat-icon fontSet="material-symbols-outlined">edit</mat-icon> Düzenle</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-controls">
          <button mat-button (click)="prevPage()" [disabled]="page <= 1">
            <mat-icon fontSet="material-symbols-outlined">chevron_left</mat-icon>
            Önceki
          </button>
          <span class="page-info">Sayfa {{ page }} / {{ totalPages }}</span>
          <div style="display:flex;align-items:center;gap:8px;margin-left:12px">
            <mat-form-field appearance="outline" style="width:140px;margin-left:8px">
              <mat-label>Sayfa başına</mat-label>
              <mat-select [(value)]="pageSize" (selectionChange)="onPageSizeChange($event.value)">
                <mat-option *ngFor="let s of pageSizeOptions" [value]="s">{{ s }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <button mat-button (click)="nextPage()" [disabled]="page >= totalPages">
            Sonraki
            <mat-icon fontSet="material-symbols-outlined">chevron_right</mat-icon>
          </button>
        </div>
      </mat-card>
    </div>
  `
  ,
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

  /* Make sortable headers show pointer and a hover state */
  th.sortable { cursor: pointer; user-select: none; }
  th.sortable:hover { background: rgba(0,0,0,0.02); }
  .sort-icon { font-size: 14px; vertical-align: middle; margin-left: 6px; color: rgba(0,0,0,0.6); }

    @media (max-width: 768px) { .container { padding: 1rem; } .header { flex-direction: column; gap: 1rem; align-items: stretch; } .table-container { font-size: 0.9rem; } }
    .inactive-row { background-color: rgba(255, 200, 200, 0.45); }
    `
  ]
})
export class ObservancesListComponent implements OnInit, OnDestroy {
  isImporting: boolean = false;
  isLoading: boolean = false;
  yearOptions: number[] = [];
  selectedYear: number | null = null;
  data: any[] = [];
  page = 1;
  pageSize = 10;
  total = 0;
  pageSizeOptions = [10, 25, 50];
  totalPages = 1;
  searchText: string = '';
  // selection checkbox column is rendered in template
  selectedIds = new Set<number>();
  sortBy = 'start_date';
  sortDir: 'asc'|'desc' = 'asc';
  // removed duplicate constructor - single constructor with ChangeDetectorRef below
  private subs: Subscription[] = [];
  private searchSubject: Subject<string> = new Subject<string>();
  // a hidden button to focus when we want to force keyboard/focus update after list refresh
  @ViewChild('refreshTrigger', { read: ElementRef }) refreshTrigger?: ElementRef;
  constructor(private router: Router, private snack: MatSnackBar, private obsSvc: ObservanceService, private auth: AuthService, private dialog: MatDialog, private cdr: ChangeDetectorRef, private ngZone: NgZone) {
    // initialize year options (current year, next year)
    this.updateYearOptions(false);
  }
  ngOnInit(): void {
    // Subscribe to selectedSchool changes so the list reloads whenever the user selects a school
    const s = this.auth.selectedSchool$.subscribe(school => {
      // when a school is selected or changes, reload
      if (school) {
        this.page = 1;
        this.loadList();
      }
    });
    this.subs.push(s);

    // subscribe to searchSubject to perform debounced dynamic search
    const searchSub = this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(q => {
      this.page = 1;
      // searchText is already bound by ngModel; just call loadList
      this.loadList();
    });
    this.subs.push(searchSub);

    // If selected school isn't ready yet, wait a short time for AuthService to initialize
    // This avoids needing user to click/focus to trigger the first load.
    (async () => {
      const school = await this.getOrSelectSchool();
      if (school) {
        this.page = 1;
        await this.loadList();
      }
    })();
  }

  private updateYearOptions(preserveSelected: boolean) {
    const now = new Date();
    const y = now.getFullYear();
    const opts = [y, y + 1];
    this.yearOptions = opts;
    if (preserveSelected && this.selectedYear && opts.includes(this.selectedYear)) {
      // keep current selection
      return;
    }
    // default to current year
    this.selectedYear = opts[0];
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  onSearchInput(value: string) {
    // push into subject for debounced handling
    this.searchSubject.next(value || '');
  }
  create() { alert('Yeni gözlem oluşturma formu henüz uygulanmadı.'); }
  goBack() { this.router.navigate(['/dashboard']); }

  async importStandardCalendar() {
    const school = await this.getOrSelectSchool();
    if (!school) { this.snack.open('Okul seçili değil. Lütfen üst menüden bir okul seçin.', 'Kapat'); return; }
    const schoolId = school.id;
    const year = this.selectedYear || undefined;
    this.isLoading = true;
    this.obsSvc.importStandardObservances(schoolId, year).subscribe({ next: async (res:any) => {
      this.isLoading = false;
      this.snack.open('Takvim başarıyla yüklendi!', 'Kapat', { duration: 3000 });
      try { await this.loadList(); } catch(e) { console.error('refresh after import failed', e); }
    }, error: (err) => {
      this.isLoading = false;
      console.error('import error', err);
      const e = err?.error;
      if (err?.status === 409) this.snack.open('Bu yılın takvimi zaten mevcut.', 'Kapat', { duration: 4000 });
      else this.snack.open(e?.error || e?.message || 'Yükleme hatası', 'Kapat', { duration: 5000 });
    } });
  }

  // load list
  async loadList(): Promise<void> {
    // refresh year options each time we load the list so options are always current
    this.updateYearOptions(true);
    // Use getOrSelectSchool for initial selection fallback, but prefer selectedSchool$ subscription for changes.
    const school = this.auth.getSelectedSchool() || await this.getOrSelectSchool();
    if (!school) return;
    this.isLoading = true;
    return new Promise<void>((resolve, reject) => {
      this.obsSvc.list(school.id, this.page, this.pageSize, this.sortBy, this.sortDir, this.selectedYear || undefined, this.searchText || undefined).subscribe({ next: (res:any) => {
        this.isLoading = false;
        this.data = res.data || res;
        // clear selection after reload
        try { this.selectedIds.clear(); } catch(e) {}
        this.total = res.total || (this.data||[]).length;
        this.totalPages = Math.max(1, Math.ceil((this.total || 0) / this.pageSize));
        // ensure Angular updates and optionally focus hidden trigger to wake UI focus if needed
        try {
          this.ngZone.run(() => {
            this.cdr.detectChanges();
            if (this.refreshTrigger && this.refreshTrigger.nativeElement && typeof this.refreshTrigger.nativeElement.focus === 'function') {
              this.refreshTrigger.nativeElement.focus();
            }
          });
        } catch(e) { /* ignore */ }
        resolve();
      }, error: (err) => {
        this.isLoading = false; console.error(err); this.snack.open('Listeleme hatası', 'Kapat');
        reject(err);
      }});
    });
  }

  async onCreate(): Promise<void> {
    const school = await this.getOrSelectSchool();
    if (!school) return;
    const ref = this.dialog.open(ObservanceFormDialogComponent, { data: { source_year: this.selectedYear } });
    ref.afterClosed().subscribe((res:any) => {
      if (!res) return;
      this.obsSvc.createObservance(school.id, res).subscribe({ next: async _ => { this.snack.open('Oluşturuldu','Kapat'); try { await this.loadList(); } catch(e){} }, error: e=>{console.error(e); this.snack.open('Oluşturma hatası','Kapat'); } });
    });
  }

  async onEdit(row:any): Promise<void> {
    const school = await this.getOrSelectSchool();
    if (!school) return;
    const ref = this.dialog.open(ObservanceFormDialogComponent, { data: row });
    ref.afterClosed().subscribe((res:any) => {
      if (!res) return;
      this.obsSvc.updateObservance(school.id, row.id, res).subscribe({ next: async _ => { this.snack.open('Güncellendi','Kapat'); try { await this.loadList(); } catch(e){} }, error: e=>{console.error(e); this.snack.open('Güncelleme hatası','Kapat'); } });
    });
  }

  // single delete removed; support bulk delete below

  toggleSelect(id: number, checked: boolean) {
    if (checked) this.selectedIds.add(id); else this.selectedIds.delete(id);
  }

  toggleSelectAll(checked: boolean) {
    if (checked) this.data.forEach((r:any)=>this.selectedIds.add(r.id)); else this.selectedIds.clear();
  }

  async bulkDelete(): Promise<void> {
    if (this.selectedIds.size === 0) { this.snack.open('Silinecek kayıt seçili değil','Kapat'); return; }
    if (!confirm(`Seçili ${this.selectedIds.size} kaydı silmek istediğinizden emin misiniz?`)) return;
    const school = await this.getOrSelectSchool(); if (!school) return;
  const ids = Array.from(this.selectedIds);
  this.obsSvc.bulkDeleteObservances(school.id, ids).subscribe({ next: async (res:any) => { this.snack.open(`Seçili ${res.deleted||ids.length} kayıt silindi`,'Kapat'); this.selectedIds.clear(); try { await this.loadList(); } catch(e){} }, error: e=>{ console.error(e); this.snack.open('Silme hatası','Kapat'); } });
  }

  onPage(event: any) {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadList();
  }

  prevPage(){ if (this.page>1) { this.page--; this.loadList(); } }
  nextPage(){ if (this.page < this.totalPages) { this.page++; this.loadList(); } }

  onPageSizeChange(size: number){ this.pageSize = size; this.page = 1; this.loadList(); }

  onSort(event: Sort) {
    this.sortBy = event.active || 'start_date';
    this.sortDir = (event.direction as any) || 'asc';
    this.loadList();
  }

  onFilterChange(){ this.page = 1; this.loadList(); }

  sort(col: string) {
    if (this.sortBy === col) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortBy = col; this.sortDir = 'asc'; }
    this.loadList();
  }

  // Try to get selected school; if none selected and user has schools, auto-select the first one
  // Ensure there's a selected school. If none is selected yet, try to pick the first school from the current user.
  // If still none, wait briefly for selectedSchool$ (useful when AuthService initializes from localStorage).
  private async getOrSelectSchool(): Promise<any|null> {
    let school = this.auth.getSelectedSchool();
    if (school) return school;

    const user = this.auth.getCurrentUser();
    if (user && (user.schools || []).length > 0) {
      const first = user.schools[0];
      this.auth.setSelectedSchool(first);
      return first;
    }

    // wait up to 2 seconds for selectedSchool$ to emit (AuthService may be restoring state)
    return new Promise(resolve => {
      const sub = this.auth.selectedSchool$.subscribe(s => {
        sub.unsubscribe();
        resolve(s || null);
      });
      setTimeout(() => { try { sub.unsubscribe(); } catch(e){}; resolve(null); }, 2000);
    });
  }
}
