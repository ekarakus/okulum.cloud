import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ViewChild, AfterViewInit } from '@angular/core';
import { SubscriptionLike } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { EmployeeTypeService } from '../services/employee-type.service';
import { ChangeDetectorRef } from '@angular/core';
import { apiBase } from '../runtime-config';
import { SchoolEmployeeService } from '../services/school-employee.service';
import { SchoolEmployeeDialogComponent } from '../school-employee-dialog/school-employee-dialog.component';
import { EmployeeTypeListComponent } from '../employee-type-list/employee-type-list.component';

/* Styles (kept in component file since standalone) */
// Note: The project often defines styles inline in other list components; keep consistent small rules
const _styles = `
.container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
.header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; gap:1rem; }
.header-left { display:flex; align-items:center; gap:1rem; }
.header h1 { margin:0; display:flex; align-items:center; gap:0.5rem; font-size:1.6rem; font-weight:600; color:#2c3e50; }
.header-actions { display:flex; gap:0.5rem; align-items:center; }
.table-card { border-radius:12px; overflow:hidden; padding:0.5rem 1rem 1rem 1rem; position: relative; }
.loading-overlay { position: absolute; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.75); z-index: 20; }
.table-header { padding: 12px 0; display:flex; align-items:center; justify-content:space-between; }
.employees-table { width:100%; border-collapse:collapse; }
.employees-table th, .employees-table td { border-bottom:1px solid #eee; }
.add-btn { display:inline-flex; align-items:center; gap:0.5rem; }
.types-btn { display:inline-flex; align-items:center; gap:0.5rem; }
.empty-state { text-align:center; padding: 2rem 1rem; color:#666; }
`;

@Component({
  selector: 'app-school-employees',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSortModule, MatTooltipModule, MatCheckboxModule, MatProgressSpinnerModule],
  styles: [_styles],
  template: `
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <button mat-icon-button (click)="goToDashboard()" matTooltip="Dashboard'a Dön" class="back-btn">
            <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
          </button>
          <h1>
            <mat-icon fontSet="material-symbols-outlined">people</mat-icon>
            Personel Yönetimi
          </h1>
        </div>
          <div class="header-actions">
            <button mat-stroked-button (click)="openTypes()" class="types-btn">
              <mat-icon fontSet="material-symbols-outlined">list</mat-icon>
              Personel Tipleri
            </button>
            <button mat-stroked-button (click)="openUpload()" class="types-btn">
              <mat-icon fontSet="material-symbols-outlined">file_upload</mat-icon>
              XLS
            </button>
              <button mat-raised-button color="primary" (click)="openAdd()" class="add-btn" [disabled]="!auth.getSelectedSchool()">
                <mat-icon fontSet="material-symbols-outlined">person_add</mat-icon>
                Yeni Personel
              </button>
              <button mat-raised-button color="warn" (click)="bulkRemove()" [disabled]="selectedIds.size === 0" style="margin-left:8px;">
                <mat-icon fontSet="material-symbols-outlined">delete</mat-icon>
                Seçilenleri Sil ({{selectedIds.size}})
              </button>
            </div>
        </div>

        <mat-card class="table-card">
          <div *ngIf="isLoading" class="loading-overlay">
            <mat-progress-spinner mode="indeterminate" diameter="60" color="primary"></mat-progress-spinner>
          </div>
          <div class="table-container">
            <div style="display:flex; gap:8px; align-items:center; margin-bottom:12px; flex-wrap:wrap;">
              <mat-form-field appearance="outline" style="width:520px;">
                <input matInput placeholder="Ara (Ad/Görev/Branş/E-mail)" (input)="applyGlobalFilter($any($event.target).value)" />
              </mat-form-field>
              <mat-form-field appearance="outline" style="width:220px;">
                <mat-select placeholder="Görevi filtre" (selectionChange)="applyFieldFilter('type', $any($event.value))">
                  <mat-option [value]="''">Tümü</mat-option>
                  <mat-option *ngFor="let t of types" [value]="t.name">{{ t.name }}</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

          <table mat-table [dataSource]="dataSource" class="employees-table" matSort *ngIf="(dataSource.data?.length || 0) > 0; else emptyState">
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef style="padding:4px 12px; width:40px; text-align:center;">
                <mat-checkbox [checked]="isAllSelected()" (change)="toggleSelectAll($event)"></mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let e" style="padding:4px 12px; text-align:center;">
                <mat-checkbox [checked]="selectedIds.has(e.id)" (change)="toggleSelect(e)"></mat-checkbox>
              </td>
            </ng-container>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header style="padding: 4px 12px; text-align: left;">Ad Soyad</th>
              <td mat-cell *matCellDef="let e" style="padding: 4px 12px;">{{ e.name }}</td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef mat-sort-header style="padding: 4px 12px; text-align: left;">Görevi</th>
              <td mat-cell *matCellDef="let e" style="padding: 4px 12px;">{{ e.EmployeeType?.name || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="branch">
              <th mat-header-cell *matHeaderCellDef mat-sort-header style="padding: 4px 12px; text-align: left;">Branş</th>
              <td mat-cell *matCellDef="let e" style="padding: 4px 12px;">{{ e.branch || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef mat-sort-header style="padding: 4px 12px; text-align: left;">E-mail</th>
              <td mat-cell *matCellDef="let e" style="padding: 4px 12px;">{{ e.email || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef style="padding: 4px 12px; text-align: left;">işlem</th>
              <td mat-cell *matCellDef="let e" style="padding: 4px 12px;">
                <button mat-button color="accent" (click)="edit(e)" style="margin-right:6px;">
                  <span class="material-symbols-outlined" style="font-size:18px;">edit</span>
                  Düzenle
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>

          <ng-template #emptyState>
            <div class="empty-state">
              <div class="empty-icon">
                <mat-icon style="font-size:48px;">people_outline</mat-icon>
              </div>
              <h3>Henüz personel eklenmemiş</h3>
              <p>Okulunuza personel ekleyerek başlayın.</p>
            </div>
          </ng-template>
        </div>
      </mat-card>
    </div>
  `
})
export class SchoolEmployeesComponent implements OnInit, OnDestroy {
  employees: any[] = [];
  types: any[] = [];
  isLoading: boolean = false;
  displayedColumns = ['select','name','type','branch','email','actions'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  // selection state for bulk delete
  selectedIds: Set<number> = new Set<number>();
  private sub?: Subscription;
  private sortSub?: Subscription;
  // internal MatSort holder used by ViewChild setter
  private _matSort?: MatSort;
  // filters
  filterValues: any = { global: '', name: '', type: '', branch: '' };
  @ViewChild(MatSort) set matSort(ms: MatSort | undefined) {
    this._matSort = ms;
    if (this._matSort) {
      // attach the MatSort to the data source and ensure subscription
      try { this.dataSource.sort = this._matSort; } catch (e) { /* ignore */ }
      this.attachSortSubscription();
      this.cdr.detectChanges();
    }
  }
  get sort(): MatSort | undefined { return this._matSort; }
  constructor(private http: HttpClient, public auth: AuthService, private dialog: MatDialog, private empSvc: SchoolEmployeeService, private empTypeSvc: EmployeeTypeService, private router: Router, @Inject(PLATFORM_ID) private platformId: Object, private cdr: ChangeDetectorRef) {
    // custom filter predicate: filter is JSON string of filterValues
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      try {
        const f = JSON.parse(filter);
        const global = (f.global || '').toString().toLowerCase();
        const nameFilter = (f.name || '').toString().toLowerCase();
        const typeFilter = (f.type || '').toString().toLowerCase();
        const branchFilter = (f.branch || '').toString().toLowerCase();

        const name = (data.name || '').toString().toLowerCase();
        const type = (data.EmployeeType?.name || '').toString().toLowerCase();
        const branch = (data.branch || '').toString().toLowerCase();

        const globalMatch = !global || name.indexOf(global) !== -1 || type.indexOf(global) !== -1 || branch.indexOf(global) !== -1 || (data.email || '').toString().toLowerCase().indexOf(global) !== -1;
        const nameMatch = !nameFilter || name.indexOf(nameFilter) !== -1;
  const typeMatch = !typeFilter || type === typeFilter;
        const branchMatch = !branchFilter || branch.indexOf(branchFilter) !== -1;

        return globalMatch && nameMatch && typeMatch && branchMatch;
      } catch (e) {
        return true;
      }
    };
  }
  private getToken(): string | null { if (isPlatformBrowser(this.platformId)) return localStorage.getItem('token'); return null; }

  goToDashboard() { this.router.navigate(['/']); }

  ngOnInit(): void {
    // Only attempt to load if we have a token (consistent with other list pages)
    const token = this.getToken();
    if (!token) return;

    // If selected school already present, load immediately
    const school = this.auth.getSelectedSchool();
    if (school) {
      this.isLoading = true;
      this.load(school.id);
    }

    // Also subscribe to changes (e.g., selection happens after component init)
    this.sub = this.auth.selectedSchool$.subscribe(s => {
      if (s) {
        this.isLoading = true;
        this.load(s.id);
      } else {
        // clear list when no school selected
        this.employees = [];
        this.isLoading = false;
      }
    });

    // load employee types for filter dropdown (reuse existing token)
    if (token) {
      this.empTypeSvc.list().subscribe({ next: (res) => { this.types = res || []; }, error: () => { this.types = []; } });
    }
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    if (this.sortSub) this.sortSub.unsubscribe();
  }

  ngAfterViewInit(): void {
    // attach sort accessor for client side fallback
    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      if (property === 'type') return item.EmployeeType?.name || '';
      if (property === 'name') return item.name || '';
      if (property === 'branch') return item.branch || '';
      if (property === 'email') return item.email || '';
      return item[property];
    };
    // Use Turkish locale-aware sorting for client-side sorting
    this.dataSource.sortData = (data: any[], sort) => {
      if (!sort || !sort.active) return data;
      const active = sort.active;
      const direction = sort.direction === 'desc' ? -1 : 1;
      return data.sort((a: any, b: any) => {
        let av = this.dataSource.sortingDataAccessor(a, active) || '';
        let bv = this.dataSource.sortingDataAccessor(b, active) || '';
        // Ensure string comparison and fallback for non-string types
        av = (av === null || av === undefined) ? '' : av.toString();
        bv = (bv === null || bv === undefined) ? '' : bv.toString();
        // localeCompare with Turkish locale
        return av.localeCompare(bv, 'tr') * direction;
      });
    };
    // If MatSort is present at this lifecycle hook, subscribe to sort changes.
    if (this.sort) {
      this.attachSortSubscription();
    }
  }

  private attachSortSubscription() {
    if (!this.sort) return;
    if (this.sortSub) return; // already subscribed
    // ensure dataSource has the MatSort reference
    try { this.dataSource.sort = this.sort; } catch (e) { /* ignore */ }
    this.sortSub = this.sort!.sortChange.subscribe((sortEvent) => {
      const school = this.auth.getSelectedSchool();
      if (!school) return;
      const sortField = sortEvent.active;
      const sortDir = sortEvent.direction || 'asc';
      this.load(school.id, { sortField, sortDir, type: this.filterValues.type || '', search: this.filterValues.global || '' });
    });
  }

  load(schoolId: number, params?: any) {
    this.empSvc.listBySchool(schoolId, params).subscribe({ next: (res) => {
      // res may be an array or an HttpEvent/HttpResponse; normalize to array
      const data = Array.isArray(res) ? res : (res && (res as any).body && Array.isArray((res as any).body) ? (res as any).body : []);
      this.employees = data || [];
      this.dataSource.data = this.employees;
      // ensure sort is attached for client-side fallback
        try { this.dataSource.sort = this.sort; } catch (e) { /* ignore */ }
        // if MatSort became available after data loaded, attach subscription
        if (this.sort) this.attachSortSubscription();
        // Apply client-side filter so the UI filters immediately even if server doesn't
        try { this.dataSource.filter = JSON.stringify(this.filterValues); } catch (e) { /* ignore */ }
      this.cdr.detectChanges();
      this.isLoading = false;
    }, error: (err) => console.error(err) });
  }

  // Filter helpers
  applyGlobalFilter(value: string) {
    this.filterValues.global = (value || '').trim();
    // apply client-side filter immediately
    try { this.dataSource.filter = JSON.stringify(this.filterValues); } catch (e) { /* ignore */ }
    // server-side search: reload list (if supported)
    const school = this.auth.getSelectedSchool(); if (school) this.load(school.id, { type: this.filterValues.type || '', search: this.filterValues.global });
  }

  applyFieldFilter(field: string, value: string) {
    this.filterValues[field] = (value || '').trim();
    // apply client-side filter immediately
    try { this.dataSource.filter = JSON.stringify(this.filterValues); } catch (e) { /* ignore */ }
    const school = this.auth.getSelectedSchool(); if (school) this.load(school.id, { type: this.filterValues.type || '', search: this.filterValues.global });
  }

  openAdd() {
    const school = this.auth.getSelectedSchool(); if (!school) return;
    const dialogRef = this.dialog.open(SchoolEmployeeDialogComponent, { width: '600px', data: { mode: 'add', schoolId: school.id } });
    dialogRef.afterClosed().subscribe(r => { if (r && r.saved) this.load(school.id); });
  }

  edit(emp: any) {
    const school = this.auth.getSelectedSchool(); if (!school) return;
    const dialogRef = this.dialog.open(SchoolEmployeeDialogComponent, { width: '600px', data: { mode: 'edit', employee: emp, schoolId: school.id } });
    dialogRef.afterClosed().subscribe(r => { if (r && r.saved) this.load(school.id); });
  }

  remove(emp: any) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    this.empSvc.remove(emp.id).subscribe({ next: () => { const school = this.auth.getSelectedSchool(); if (school) this.load(school.id); }, error: () => alert('Silme başarısız') });
  }

  toggleSelect(emp: any) {
    if (this.selectedIds.has(emp.id)) this.selectedIds.delete(emp.id);
    else this.selectedIds.add(emp.id);
  }

  toggleSelectAll(event: any) {
    const checked = !!event.checked;
    if (checked) {
      this.dataSource.data.forEach((d: any) => this.selectedIds.add(d.id));
    } else {
      this.selectedIds.clear();
    }
  }

  isAllSelected(): boolean {
    const data = this.dataSource.data || [];
    return data.length > 0 && data.every((d: any) => this.selectedIds.has(d.id));
  }

  bulkRemove() {
    if (this.selectedIds.size === 0) return;
    if (!confirm(`Seçili ${this.selectedIds.size} personeli silmek istediğinize emin misiniz?`)) return;
    const headers = { Authorization: `Bearer ${this.getToken()}` } as any;
    const calls = Array.from(this.selectedIds).map(id => this.empSvc.remove(id).pipe(catchError(err => { console.error('bulk delete failed for', id, err); return of({ error: true, id }); })));
    forkJoin(calls).subscribe({ next: (results: any) => {
      // reload list and clear selection
      const school = this.auth.getSelectedSchool(); if (school) this.load(school.id);
      this.selectedIds.clear();
    }, error: (err) => { console.error('bulk remove error', err); alert('Çoklu silme sırasında hata oluştu'); } });
  }

  openTypes() {
    this.router.navigate(['/employee-types']);
  }

  openUpload() {
    import('../school-employees-upload-dialog/school-employees-upload-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.SchoolEmployeesUploadDialogComponent, { width: '700px' });
      dialogRef.afterClosed().subscribe((r: any) => { const school = this.auth.getSelectedSchool(); if (r && r.inserted && school) this.load(school.id); });
    }).catch(err => console.error('Failed to load upload dialog', err));
  }


}
