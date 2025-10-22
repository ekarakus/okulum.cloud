import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { apiBase } from '../runtime-config';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FaultImageDialogComponent } from '../fault-image-dialog/fault-image-dialog.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SnackbarService } from '../services/snackbar.service';
import { FaultAddDialogComponent } from '../fault-add-dialog/fault-add-dialog.component';
import { OperationCreateDialogComponent } from '../operation-create-dialog/operation-create-dialog.component';

@Component({
  selector: 'app-fault-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatDialogModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatCheckboxModule],
  template: `
    <div class="container">
      <div class="header">
        <div class="header-left">
          <button mat-icon-button (click)="goToDashboard()" matTooltip="Dashboard'a Dön" class="back-btn">
            <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
          </button>
          <h1>
            <mat-icon fontSet="material-symbols-outlined">report_problem</mat-icon>
            Destek Talepleri
          </h1>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <button mat-raised-button color="primary" (click)="openAddDialog()" class="add-btn">
            <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
            Destek Talebi Ekle
          </button>
        </div>
      </div>

      <mat-card class="table-card">
        <div *ngIf="isLoading" class="loading-overlay">
          <mat-progress-spinner mode="indeterminate" diameter="60" color="primary"></mat-progress-spinner>
        </div>

        <div class="table-header">
          <h2><mat-icon fontSet="material-symbols-outlined">format_list_bulleted</mat-icon> Destek Talepleri Listesi</h2>
        </div>

        <div class="table-controls" style="padding:12px 16px; border-bottom:1px solid #eee; display:flex; gap:1rem; align-items:start; flex-wrap:wrap;">
          <mat-form-field appearance="outline" style="width:280px;">
            <input matInput placeholder="Ara (detay)" [(ngModel)]="filters.search" (ngModelChange)="onSearchChange($event)">
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:180px;">
            <mat-select placeholder="Durum" [(value)]="filters.status" (selectionChange)="onFilterChange()">
              <mat-option [value]="">Tümü</mat-option>
                <mat-option value="pending">Bekliyor</mat-option>
              <mat-option value="in_progress">İşlemde</mat-option>
              <mat-option value="closed">Kapandı</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:220px;">
            <mat-select placeholder="Oluşturan" [(value)]="filters.creator" (selectionChange)="onCreatorChange()">
              <mat-option [value]="null">Tümü</mat-option>
              <mat-option *ngFor="let c of creators" [value]="c.id">{{c.name}}</mat-option>
            </mat-select>
          </mat-form-field>
          <div style="flex:1 1 auto"></div>
          <mat-form-field appearance="outline" style="width:160px; margin-left:0.25rem;">
            <mat-select placeholder="Durum Değiştir" (selectionChange)="bulkChangeStatus($event.value)">
              <mat-option [value]="''">Durum seç</mat-option>
                  <mat-option value="pending">Bekliyor</mat-option>
              <mat-option value="in_progress">İşlemde</mat-option>
              <mat-option value="closed">Kapandı</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-stroked-button color="warn" (click)="bulkDelete()" [disabled]="selectedIds.length===0" class="google-delete-btn" style="margin-left:12px">
            <mat-icon class="google-icon" fontSet="material-symbols-outlined" aria-hidden="true">delete</mat-icon>
            Seçilenleri Sil
          </button>
        </div>

        <div class="table-container">
          <table style="width:100%; border-collapse: collapse;">
            <thead>
              <tr class="table-head-row">
                <th style="padding:8px; width:40px;">
                  <mat-checkbox [checked]="areAllVisibleSelected()" [indeterminate]="isSomeVisibleSelected()" (change)="toggleSelectAll($event)"></mat-checkbox>
                </th>
                <th class="sortable-header" (click)="onHeaderClick('issue_details')">Detay <mat-icon fontSet="material-symbols-outlined" *ngIf="sort.field==='issue_details'">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon></th>
                <th class="sortable-header" (click)="onHeaderClick('status')">Durum <mat-icon fontSet="material-symbols-outlined" *ngIf="sort.field==='status'">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon></th>
                <th style="padding:8px;">Görsel</th>
                <th class="sortable-header" (click)="onHeaderClick('location_name')" style="padding:8px;">Lokasyon <mat-icon fontSet="material-symbols-outlined" *ngIf="sort.field==='location_name'">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon></th>
                <th class="sortable-header" (click)="onHeaderClick('device_name')" style="padding:8px;">Demirbaş <mat-icon fontSet="material-symbols-outlined" *ngIf="sort.field==='device_name'">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon></th>
                <th class="sortable-header" (click)="onHeaderClick('user_name')" style="padding:8px;">Oluşturan <mat-icon fontSet="material-symbols-outlined" *ngIf="sort.field==='user_name'">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon></th>
                <th class="sortable-header" (click)="onHeaderClick('requested_by_employee_name')" style="padding:8px;">Talep Eden <mat-icon fontSet="material-symbols-outlined" *ngIf="sort.field==='requested_by_employee_name'">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon></th>
                <th class="sortable-header" (click)="onHeaderClick('created_at')" style="padding:8px;">Tarih <mat-icon fontSet="material-symbols-outlined" *ngIf="sort.field==='created_at'">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon></th>
                <th style="padding:8px;">Düzenle</th>
                <th style="padding:8px;">İşlem</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="pagedFaults.length === 0"><td colspan="11" style="padding:20px; text-align:center; color:#666">Henüz destek talebi yok.</td></tr>
              <tr *ngFor="let f of pagedFaults" style="border-bottom:1px solid #eee;" (click)="onRowClick($event, f)">
                <td style="padding:8px; width:40px;">
                  <mat-checkbox [(ngModel)]="selectionMap[f.id]" (click)="$event.stopPropagation()"></mat-checkbox>
                </td>
                <td style="padding:8px;">{{ f.issue_details && f.issue_details.length > 50 ? (f.issue_details | slice:0:50) + '...' : f.issue_details }}</td>
                <td style="padding:8px;">{{ statusLabel(f.status) }}</td>
                <td style="padding:8px;"> <button mat-button *ngIf="f.image" (click)="openImage(f, $event)">Göster</button> </td>
                <td style="padding:8px;">{{ f.Location?.name || f.location?.name || f.location_name || '' }}<span *ngIf="(f.Location?.room_number || f.location?.room_number)"> (Oda: {{f.Location?.room_number || f.location?.room_number}})</span></td>
                <td style="padding:8px;">{{ f.Device?.name || f.device?.name || f.device_name || '' }}</td>
                <td style="padding:8px;">{{ f.Creator?.name || f.Creator?.username || f.user_name || f.created_by_user_id || '' }}</td>
                <td style="padding:8px; font-size:0.9rem; color:#444">{{ f.requested_by_employee_name || '' }}</td>
                <td style="padding:8px;">{{f.created_at | date:'short'}}</td>
                <td style="padding:8px; width:64px; text-align:center;">
                  <button mat-icon-button color="primary" (click)="openEdit(f, $event)" aria-label="Düzenle">
                    <mat-icon fontSet="material-symbols-outlined">edit</mat-icon>
                  </button>
                </td>
                <td style="padding:8px; width:120px; text-align:center; display:flex; gap:6px; justify-content:center;">
                  <button *ngIf="isActionable(f)" mat-mini-fab color="accent" matTooltip="İşlem Ekle" (click)="onActionClick(f, $event)" aria-label="İşlem Ekle">
                    <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
                  </button>
                  <button *ngIf="(f.device_id || f.Device?.id)" mat-mini-fab color="primary" matTooltip="Cihazın işlemlerine git" (click)="goToDeviceOperations(f, $event)" aria-label="Cihaz İşlemleri">
                    <ng-container *ngIf="operationCounts && operationCounts[f.id] > 0; else noCount">
                      <span style="padding:6px 8px; font-size:0.85rem; font-weight:600; color:white">{{ operationCounts[f.id] }}</span>
                    </ng-container>
                    <ng-template #noCount>
                      <mat-icon fontSet="material-symbols-outlined">open_in_new</mat-icon>
                    </ng-template>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-controls">
          <button mat-button (click)="prevPage()" [disabled]="pageIndex<=0"><mat-icon fontSet="material-symbols-outlined">chevron_left</mat-icon> Önceki</button>
          <span>Sayfa {{pageIndex+1}} / {{totalPages}} - Toplam: {{totalCount}}</span>
          <button mat-button (click)="nextPage()" [disabled]="(pageIndex+1) >= totalPages">Sonraki <mat-icon fontSet="material-symbols-outlined">chevron_right</mat-icon></button>
        </div>
      </mat-card>
    </div>
  `
  ,
  styles: [`
    .container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; flex-wrap:wrap; gap:1rem; }
    .header-left { display:flex; align-items:center; gap:1rem; }
    .header h1 { margin:0; display:flex; align-items:center; gap:0.5rem; font-size:1.8rem; font-weight:600; color:#2c3e50; }
    .table-card { border-radius:12px; overflow:hidden; position:relative; }
    .loading-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.75); z-index:20; }
    .table-header { padding:1.5rem; background:#f8f9fa; border-bottom:1px solid #e0e0e0; display:flex; justify-content:space-between; align-items:center; }
    .table-header h2 { margin:0; font-size:1.2rem; font-weight:600; color:#2c3e50; display:flex; align-items:center; gap:0.5rem; }
    .table-container { overflow-x:auto; }
    .back-btn { background-color:#f8f9fa; color:#1976d2; border:2px solid #e3f2fd; }
    .add-btn { padding:0.75rem 1.5rem; border-radius:8px; }
    .pagination-controls { padding:1rem; display:flex; justify-content:center; align-items:center; gap:1rem; border-top:1px solid #e0e0e0; }
    /* Make controls inside .table-controls have consistent height and alignment */
    .table-controls .mat-form-field, .table-controls .mat-select, .table-controls .mat-form-field .mat-select-trigger {
      height: 40px; /* uniform control height */
      min-height: 40px;
      align-items: center;
      display: inline-flex;
    }
    .table-controls .mat-form-field .mat-form-field-wrapper { height: 40px; }
    .table-controls button.mat-stroked-button, .table-controls button.mat-raised-button, .table-controls button.mat-button {
      height: 40px; line-height: 40px; min-height: 40px; padding: 0 12px; box-sizing: border-box;
    }
    .table-controls .mat-form-field-infix { padding: 0 12px; box-sizing: border-box; }

  /* Styled delete icon in bulk-delete button (no external image) */
  .google-delete-btn { display:inline-flex; align-items:center; gap:8px; height:40px; }
  .google-delete-btn .google-icon { width:22px; height:22px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; background: rgba(0,0,0,0.06); color: rgba(255,255,255,1); font-size:16px; transition: transform 150ms ease, box-shadow 150ms ease, background 150ms ease; }
  /* Prominent style when the button is enabled */
  .google-delete-btn:not([disabled]) .google-icon { background: #d32f2f; color: #fff; box-shadow: 0 2px 6px rgba(211,47,47,0.25); transform: none; }
  .google-delete-btn:not([disabled]):hover .google-icon,
  .google-delete-btn:not([disabled]):focus .google-icon { transform: scale(1.07); box-shadow: 0 6px 16px rgba(211,47,47,0.28); }
  /* Disabled appearance */
  .google-delete-btn[disabled] .google-icon { background: rgba(0,0,0,0.06); color: rgba(0,0,0,0.38); box-shadow:none; }

    .table-head-row { background-color: #f5f5f5; }
    .sortable-header { padding: 8px; cursor: pointer; user-select: none; font-weight:600; color:#2c3e50; }
    .sortable-header mat-icon { vertical-align: middle; margin-left:6px; font-size:16px; color:#666 }

  `]
})

export class FaultListComponent implements OnInit {
  faults: any[] = [];
  pagedFaults: any[] = [];
  operationCounts: { [supportId: number]: number } = {};
  selectionMap: { [id: number]: boolean } = {};
  isLoading = false;
  sort: { field: string | null, dir: 'asc' | 'desc' } = { field: null, dir: 'asc' };
  pageIndex = 0; pageSize = 20; totalPages = 0; totalCount = 0;
  filters: { search: string, status: string, creator: number | null } = { search: '', status: '', creator: null };
  creators: Array<{ id: number | null, name: string }> = [];
  // displayList is the currently filtered list used for pagination
  displayList: any[] = [];
  private searchTimeout: any = null;

  private schoolSub: any;

  constructor(private http: HttpClient, private dialog: MatDialog, public router: Router, private cdr: ChangeDetectorRef, @Inject(PLATFORM_ID) private platformId: Object, private auth: AuthService, private snack: SnackbarService) {}

  ngOnInit(){
    // subscribe to selected school so the list auto-loads when the app initialises
    this.schoolSub = this.auth.selectedSchool$.subscribe((s) => {
      // small debounce/guard: only load when we have an id
      if (s && s.id) {
        this.pageIndex = 0;
        this.loadFaults();
      }
    });
    // also try an immediate load in case selectedSchool is already set synchronously
    setTimeout(() => this.loadFaults(), 0);
  }

  statusLabel(status: string | null | undefined): string {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'open': return 'Bekliyor';
      case 'in_progress': return 'İşlemde';
      case 'closed': return 'Kapandı';
      default: return status || '';
    }
  }

  private getToken(): string | null { return isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null; }

  loadFaults(){
    this.isLoading = true;
    const token = this.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    // Preferred source: AuthService.selectedSchool (keeps a consistent single source of truth)
    let school: any = this.auth.getSelectedSchool();
    // Fallbacks for older/legacy keys in localStorage to be resilient during rollout
    if (!school && isPlatformBrowser(this.platformId)) {
      try {
        const raw = localStorage.getItem('selectedSchool');
        if (raw) school = JSON.parse(raw);
        else {
          const sid = localStorage.getItem('selectedSchoolId');
          if (sid) {
            const userJson = localStorage.getItem('user');
            if (userJson) {
              const user = JSON.parse(userJson);
              if (user && Array.isArray(user.schools)) {
                school = user.schools.find((s: any) => String(s.id) === String(sid)) || null;
              }
            }
          }
        }
      } catch (e) { school = null; }
    }

  if (!school || !school.id) { this.isLoading = false; this.faults = []; this.pagedFaults = []; return; }
  // Debug: log selected school to help diagnose incorrect school_id being sent
  try { console.debug('FaultList.loadFaults selectedSchool:', school); } catch(e) {}
    const params = new URLSearchParams();
    params.set('school_id', String(school.id));
    params.set('page', String(this.pageIndex+1));
    params.set('pageSize', String(this.pageSize));
    if (this.filters.search) params.set('search', this.filters.search);
    if (this.filters.status) params.set('status', this.filters.status);
    if (this.sort.field) { params.set('sortField', this.sort.field); params.set('sortDir', this.sort.dir); }
  const url = `${apiBase}/api/faults?${params.toString()}`;
  try { console.debug('FaultList.loadFaults URL:', url); } catch(e) {}
    this.http.get(url, { headers, responseType: 'json' } as any).subscribe({ next: (data: any) => {
      this.faults = data.faults || [];
      this.totalCount = data.total || 0;
      this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
      // Build creators list from fetched faults (unique)
      const map: { [k: string]: { id: number|null, name: string } } = {};
      for (const f of this.faults) {
        const uid = f.Creator?.id || f.created_by_user_id || null;
        const uname = (f.Creator && (f.Creator.name || f.Creator.username)) || f.user_name || (f.user && (f.user.name || f.user.username)) || String(uid);
        const key = uid !== null ? String(uid) : `null_${uname}`;
        if (!map[key]) map[key] = { id: uid, name: uname };
      }
  this.creators = Object.keys(map).map(k => ({ id: map[k].id as number | null, name: map[k].name }));
    // apply filters and grouping
  this.applyFilters();
    // fetch operation counts for current page (visible faults)
    setTimeout(() => this.loadOperationCountsForVisible(), 0);
      this.isLoading=false; this.cdr.detectChanges();
    }, error: (e: any) => { console.error('load faults', e); this.isLoading=false; this.cdr.detectChanges(); } });
  }

  onCreatorChange() {
    this.pageIndex = 0;
    // apply client-side filtering immediately
    this.applyFilters();
  }

  applyFilters() {
    // Apply search and status filters first
    let list = (this.faults || []).filter(f => {
      if (this.filters.search && this.filters.search.trim().length > 0) {
        const q = String(this.filters.search).toLowerCase();
        if (!(String(f.issue_details || '').toLowerCase().includes(q))) return false;
      }
      if (this.filters.status && String(this.filters.status).length > 0) {
        if ((f.status || '') !== this.filters.status) return false;
      }
      if (this.filters.creator) {
        const cid = Number(this.filters.creator);
        const fid = f.Creator?.id || f.created_by_user_id || null;
        if (Number(fid) !== cid) return false;
      }
      return true;
    });

    // No grouping: set display list and pagination based on filtered results
    this.displayList = list;
    this.pagedFaults = list;
    this.totalCount = list.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
    this.updatePagedData();
  }

  openAddDialog(){
    const ref = this.dialog.open(FaultAddDialogComponent, { width: '600px' });
    ref.afterClosed().subscribe(r => { if (r) this.loadFaults(); });
  }

  onRowClick(ev: Event, f: any) {
    // Toggle selection when clicking a row (but not when clicking controls inside)
    const target = ev.target as HTMLElement;
    // If the click happened on an interactive element, ignore (buttons, links, inputs)
    if (['BUTTON','A','INPUT','MAT-ICON','MAT-SELECT'].includes(target.tagName)) return;
    this.selectionMap[f.id] = !this.selectionMap[f.id];
    this.cdr.detectChanges();
  }

  async openEdit(f: any, ev?: Event) {
    if (ev) ev.stopPropagation();
    // open as dialog for quicker edit UX using dynamic import so the component
      // doesn't need to be statically listed in `imports` (avoids NG8113).
      try {
        const m = await import('../fault-add-dialog/fault-add-dialog.component');
        const Comp = m.FaultAddDialogComponent;
        const ref = this.dialog.open(Comp, { width: '720px', data: { id: f.id } });
  ref.afterClosed().subscribe((r: any) => { if (r) this.loadFaults(); });
      } catch (e) {
        // fallback to route-based navigation if dialog open fails
  try { console.error('openEdit dialog error', e); } catch (er) {}
  try { this.snack.error('Düzenleme penceresi açılamadı, detay sayfasına yönlendiriliyorsunuz. Hata: ' + String(e)); } catch (er) {}
        this.router.navigate(['/faults', f.id]);
      }
  }

  openImage(f: any, ev?: Event) {
    if (ev) ev.stopPropagation();
    try {
      this.dialog.open(FaultImageDialogComponent, { width: '80%', maxWidth: '900px', data: { path: f.image } });
    } catch (e) { console.error('open image dialog', e); }
  }

  async onActionClick(f: any, ev?: Event) {
    if (ev) ev.stopPropagation();
    try {
      // prefer dynamic import of the full operation add/edit dialog so we reuse the existing form
      const m = await import('../operation-add-edit-dialog/operation-add-edit-dialog.component');
      const Comp = m.OperationAddEditDialogComponent;

      // try to pass selectedSchoolId so the dialog can filter devices/technicians
      let school: any = this.auth.getSelectedSchool();
      if (!school && isPlatformBrowser(this.platformId)) {
        try { const raw = localStorage.getItem('selectedSchool'); if (raw) school = JSON.parse(raw); } catch (e) { school = null; }
      }

      const deviceId = f.device_id || f.Device?.id || null;
      const dialogRef = this.dialog.open(Comp, {
        width: '720px',
        data: {
          operation: { device_id: deviceId || '', support_id: f.id },
          selectedSchoolId: school?.id || undefined,
          // preselect and disable device field when launching from a specific fault
          deviceDisabled: !!deviceId
        }
      });

      dialogRef.afterClosed().subscribe(async (formValue: any) => {
        if (!formValue) return;
        // attach fault_id and ensure school_id is set (use formValue, selected school or fault fallback)
        const payload = {
          ...formValue,
          support_id: f.id,
          school_id: formValue?.school_id || (school && school.id) || f.school_id || f.school?.id
        };
        this.isLoading = true;
        const token = this.getToken();
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }) : new HttpHeaders({ 'Content-Type': 'application/json' });
          try {
          await this.http.post(`${apiBase}/api/operations`, payload, { headers }).toPromise();
          this.snack.success('İşlem oluşturuldu.');
          this.selectionMap = {};
          this.loadFaults();
        } catch (err) {
          console.error('create operation error', err);
          this.snack.error('İşlem oluşturulamadı. Konsolu kontrol edin.');
        } finally {
          this.isLoading = false; this.cdr.detectChanges();
        }
      });
    } catch (e) {
      console.error('onActionClick error', e);
      // fallback: open the small operation create dialog if dynamic import fails
      try {
        const ref = this.dialog.open(OperationCreateDialogComponent, { width: '520px', data: { fault: f } });
        ref.afterClosed().subscribe((r: any) => { if (r) { /* noop, earlier flow handled */ } });
      } catch (err) { /* ignore */ }
    }
  }

  goToDeviceOperations(f: any, ev?: Event) {
    if (ev) ev.stopPropagation();
    // Prefer opening operations page filtered by support (fault) id so users see the operations linked to this support
    const supportId = f.id;
    const deviceId = f.device_id || f.Device?.id;
    try {
      let url: string;
      if (supportId) {
        url = `${window.location.origin}/operations?support_id=${encodeURIComponent(String(supportId))}`;
      } else if (deviceId) {
        url = `${window.location.origin}/operations?device_id=${encodeURIComponent(String(deviceId))}`;
      } else {
        return;
      }
      window.open(url, '_blank');
    } catch (e) { console.error('navigate to device operations', e); }
  }

  private async loadOperationCountsForVisible() {
    try {
      const visible = (this.pagedFaults && this.pagedFaults.length ? this.pagedFaults : this.faults).map(f => f.id).filter(Boolean);
      if (!visible || visible.length === 0) return; // nothing to do
      const token = this.getToken(); const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }) : new HttpHeaders({ 'Content-Type': 'application/json' });
      const resp: any = await this.http.post(`${apiBase}/api/operations/counts`, { support_ids: visible }, { headers }).toPromise();
      if (resp && resp.counts) this.operationCounts = resp.counts;
      else this.operationCounts = {};
      this.cdr.detectChanges();
    } catch (err) {
      console.error('loadOperationCountsForVisible error', err);
    }
  }

  ngOnDestroy(): void {
    try { if (this.schoolSub && typeof this.schoolSub.unsubscribe === 'function') this.schoolSub.unsubscribe(); } catch (e) {}
  }

  prevPage(){ if (this.pageIndex>0) { this.pageIndex--; this.loadFaults(); } }
  nextPage(){ if ((this.pageIndex+1) < this.totalPages) { this.pageIndex++; this.loadFaults(); } }

  private updatePagedData(){
    const source = (this.displayList && this.displayList.length ? this.displayList : this.faults);
    this.totalPages = Math.max(1, Math.ceil((source || []).length / this.pageSize));
    const start = this.pageIndex * this.pageSize;
    this.pagedFaults = (source || []).slice(start, start + this.pageSize);
  }

  onHeaderClick(field: string){
    if (this.sort.field === field) this.sort.dir = this.sort.dir === 'asc' ? 'desc' : 'asc';
    else { this.sort.field = field; this.sort.dir = 'asc'; }
    // Request server-side sorted data
    this.pageIndex = 0;
    this.loadFaults();
  }

  onSearch(){ this.pageIndex = 0; this.loadFaults(); }
  onFilterChange(){ this.pageIndex = 0; this.loadFaults(); }

  onSearchChange(value: string) {
    // immediate feedback: debounce to avoid spamming the server while typing
    this.filters.search = value;
    this.pageIndex = 0;
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadFaults();
      this.searchTimeout = null;
    }, 250);
  }

  private applySort(){ if (!this.sort.field) return; const f = this.sort.field; this.faults.sort((a,b) => { const av = (a[f] ?? '') + ''; const bv = (b[f] ?? '') + ''; if (av === bv) return 0; const cmp = av > bv ? 1 : -1; return this.sort.dir === 'asc' ? cmp : -cmp; }); }

  goToDashboard(){ this.router.navigate(['/dashboard']); }

  get selectedIds(): number[] {
    return Object.keys(this.selectionMap).filter(k => this.selectionMap[+k]).map(k => +k);
  }

  async bulkDelete() {
    const ids = this.selectedIds;
    if (!ids || ids.length === 0) return;
    // simple JS confirm as requested
    if (!confirm(`Seçili ${ids.length} kaydı silmek istiyor musunuz? Bu işlem geri alınamaz.`)) return;
    this.isLoading = true;
    const token = this.getToken(); const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }) : new HttpHeaders({ 'Content-Type': 'application/json' });
    try {
      // prefer bulk-delete endpoint, fallback to individual deletes if not available
      const r: any = await this.http.post(`${apiBase}/api/faults/bulk-delete`, { ids }, { headers }).toPromise();
      // success; refresh list
      this.selectionMap = {};
      this.loadFaults();
    } catch (e) {
      // fallback: try deleting individually
      try {
        for (const id of ids) {
          await this.http.delete(`${apiBase}/api/faults/${id}`, { headers }).toPromise();
        }
        this.selectionMap = {};
        this.loadFaults();
      } catch (err) {
        console.error('bulk delete error', err);
  this.snack.error('Silme sırasında hata oluştu. Konsolu kontrol edin.');
        this.isLoading = false; this.cdr.detectChanges();
      }
    }
  }

  async bulkChangeStatus(status: string | null | undefined) {
    if (!status) return;
    const ids = this.selectedIds;
    if (!ids || ids.length === 0) return;
  // use simple JS confirm per user's request
  if (!confirm(`Seçili ${ids.length} kaydın durumunu '${status}' olarak güncellemek istiyor musunuz?`)) return;
    this.isLoading = true;
    const token = this.getToken(); const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }) : new HttpHeaders({ 'Content-Type': 'application/json' });
    try {
      // call server-side bulk-update endpoint
      await this.http.post(`${apiBase}/api/faults/bulk-update`, { ids, status }, { headers }).toPromise();
      this.selectionMap = {};
      this.loadFaults();
    } catch (err) {
      console.error('bulk status update error', err);
  this.snack.error('Durum güncelleme sırasında hata oluştu. Konsolu kontrol edin.');
      this.isLoading = false; this.cdr.detectChanges();
    }
  }

  areAllVisibleSelected(): boolean {
    if (!this.pagedFaults || this.pagedFaults.length === 0) return false;
    return this.pagedFaults.every(f => !!this.selectionMap[f.id]);
  }

  isSomeVisibleSelected(): boolean {
    if (!this.pagedFaults || this.pagedFaults.length === 0) return false;
    const any = this.pagedFaults.some(f => !!this.selectionMap[f.id]);
    return any && !this.areAllVisibleSelected();
  }

  toggleSelectAll(event: any) {
    const checked = !!event.checked;
    for (const f of this.pagedFaults) {
      this.selectionMap[f.id] = checked;
    }
    this.cdr.detectChanges();
  }

  // Determine whether the action button should be shown for a given record
  isActionable(f: any): boolean {
    if (!f) return false;
    // Only actionable when status is exactly 'in_progress'
    return String(f.status) === 'in_progress';
  }
}
