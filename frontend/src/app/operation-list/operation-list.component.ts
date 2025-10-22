import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { OperationAddEditDialogComponent } from '../operation-add-edit-dialog/operation-add-edit-dialog.component';
import { OperationSupportDialogComponent } from '../operation-support-dialog/operation-support-dialog.component';
import { apiBase } from '../runtime-config';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-operation-list',
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  providers: [DatePipe],
  host: { 'ngSkipHydration': '' },
  template: `
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <button mat-icon-button (click)="goToDashboard()" matTooltip="Dashboard'a Dön" class="back-btn">
            <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
          </button>
          <h1>
            <mat-icon fontSet="material-symbols-outlined">assignment</mat-icon>
            İşlem Yönetimi
          </h1>
        </div>
        <button mat-raised-button color="primary" (click)="openAddDialog()" class="add-btn">
          <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
          Yeni İşlem Ekle
        </button>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card" style="margin-bottom:1rem;">
        <div class="filters" style="padding: 12px; display:flex; flex-wrap:wrap; gap:1rem; align-items:flex-end;">
          <div style="min-width:240px;">
            <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Arama (İşlem Türü / Demirbaş / Teknisyen)</label>
            <input type="text" [(ngModel)]="searchText" (input)="applyFilters()" placeholder="Ara..." style="padding:6px; width:100%; border:1px solid #ccc; border-radius:4px;" />
          </div>
          <div style="min-width:220px;">
            <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Demirbaş Filtresi</label>
            <select [(ngModel)]="filterDeviceId" (change)="applyFilters()" style="padding:6px; width:100%; border:1px solid #ccc; border-radius:4px;">
              <option [ngValue]="null">Tümü</option>
              <option *ngFor="let d of devices" [ngValue]="d.id">{{d.name}} ({{d.identity_no}})</option>
            </select>
          </div>
          <div style="min-width:220px;">
            <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">İşlem Türü</label>
            <select [(ngModel)]="filterOperationTypeId" (change)="applyFilters()" style="padding:6px; width:100%; border:1px solid #ccc; border-radius:4px;">
              <option [ngValue]="null">Tümü</option>
              <option *ngFor="let t of operationTypes" [ngValue]="t.id">{{t.name}}</option>
            </select>
          </div>
          <div style="min-width:260px;">
            <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Destek Talepleri</label>
            <select [(ngModel)]="filterSupportId" (change)="applyFilters()" style="padding:6px; width:100%; border:1px solid #ccc; border-radius:4px;">
              <option [ngValue]="null">Tümü</option>
              <option *ngFor="let s of supports" [ngValue]="s.id">{{ supportLabel(s) }}</option>
            </select>
          </div>
          <div>
            <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Başlangıç Tarihi</label>
            <input type="date" [(ngModel)]="filterStartDate" (change)="applyFilters()" style="padding:6px; border:1px solid #ccc; border-radius:4px;" />
          </div>
            <div>
            <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Bitiş Tarihi</label>
            <input type="date" [(ngModel)]="filterEndDate" (change)="applyFilters()" style="padding:6px; border:1px solid #ccc; border-radius:4px;" />
          </div>
          <div>
            <button mat-stroked-button color="primary" class="compact-icon-btn" (click)="clearFilters()">
              <mat-icon fontSet="material-symbols-outlined" class="btn-icon">delete_sweep</mat-icon>
              <span class="btn-text">Temizle</span>
            </button>
          </div>
          <div *ngIf="filteredOperations.length>0">
            <button mat-stroked-button color="accent" class="compact-icon-btn" (click)="printFiltered()">
              <mat-icon fontSet="material-symbols-outlined" class="btn-icon">print</mat-icon>
              <span class="btn-text">Yazdır</span>
            </button>
          </div>
          <div style="margin-left:auto; font-size:12px;">Toplam: {{filteredOperations.length}} kayıt</div>
        </div>
      </mat-card>

      <!-- Operations Table -->
      <mat-card class="table-card">
        <div *ngIf="isLoading" class="loading-overlay">
          <div class="spinner-wrap"><mat-progress-spinner mode="indeterminate" diameter="60" color="primary"></mat-progress-spinner></div>
        </div>
        <div class="table-header">
          <h2>
            <mat-icon fontSet="material-symbols-outlined">format_list_bulleted</mat-icon>
            İşlem Listesi
          </h2>
        </div>
  <div class="table-container">
          <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th (click)="onHeaderClick('device')" style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd; cursor:pointer">Demirbaş
                <mat-icon fontSet="material-symbols-outlined" *ngIf="sort.field==='device'" style="vertical-align: middle; font-size: 14px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <th (click)="onHeaderClick('operation_type')" style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd; cursor:pointer">İşlem Türü
                <mat-icon fontSet="material-symbols-outlined" *ngIf="sort.field==='operation_type'" style="vertical-align: middle; font-size: 14px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <th (click)="onHeaderClick('description')" style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd; cursor:pointer">Açıklama
                <mat-icon fontSet="material-symbols-outlined" *ngIf="sort.field==='description'" style="vertical-align: middle; font-size: 14px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <th (click)="onHeaderClick('date')" style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd; cursor:pointer">Tarih
                <mat-icon fontSet="material-symbols-outlined" *ngIf="sort.field==='date'" style="vertical-align: middle; font-size: 14px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <th (click)="onHeaderClick('technician')" style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd; cursor:pointer">Teknisyen
                <mat-icon fontSet="material-symbols-outlined" *ngIf="sort.field==='technician'" style="vertical-align: middle; font-size: 14px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <th (click)="onHeaderClick('status')" style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd; cursor:pointer">Durum
                <mat-icon fontSet="material-symbols-outlined" *ngIf="sort.field==='status'" style="vertical-align: middle; font-size: 14px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <th style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd;">İşlem</th>
              <th style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd;">Destek?</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of pagedOperations" style="border-bottom: 1px solid #eee;">
              <td style="padding: 4px 12px;">{{o.Device ? (o.Device.name + ' (' + o.Device.identity_no + ')') : 'Bilinmeyen Demirbaş'}}</td>
              <td style="padding: 4px 12px;">{{o.OperationType ? o.OperationType.name : 'Bilinmeyen Tür'}}</td>
              <td style="padding: 4px 12px;">{{o.description}}</td>
              <td style="padding: 4px 12px;">{{o.date || o.createdAt | date:'dd/MM/yyyy HH:mm'}}</td>
              <td style="padding: 4px 12px;">{{o.Technician ? o.Technician.name : 'Bilinmeyen Teknisyen'}}</td>
              <td style="padding: 4px 12px;">
                <span [ngStyle]="{
                  'padding': '4px 8px',
                  'border-radius': '4px',
                  'background-color': o.is_completed ? '#4caf50' : '#ff9800',
                  'color': 'white',
                  'font-size': '12px'
                }">
                  {{o.is_completed ? 'Tamamlandı' : 'Devam Ediyor'}}
                </span>
              </td>
              <td style="padding: 12px;">
                <button mat-button color="accent" (click)="openEditDialog(o)" style="margin-right: 5px;">
                  <span class="material-symbols-outlined" style="margin-right: 0.3rem; font-size: 18px;">edit</span>
                  Düzenle
                </button>
                <button mat-button color="warn" (click)="deleteOperation(o.id)">
                  <span class="material-symbols-outlined" style="margin-right: 0.3rem; font-size: 18px;">delete</span>
                  Sil
                </button>
              </td>
                <td style="padding: 4px 12px; width:120px;">
                  <button *ngIf="o.support_id" mat-mini-fab color="primary" matTooltip="Destek talebini göster" (click)="openSupportDialog(o.support_id)">
                    <mat-icon fontSet="material-symbols-outlined">support_agent</mat-icon>
                  </button>
                </td>
            </tr>
            <tr *ngIf="filteredOperations.length === 0">
              <td colspan="7" style="padding: 20px; text-align: center; color: #666;">
                Henüz işlem bulunmuyor.
              </td>
            </tr>
          </tbody>
        </table>
        </div>
        <!-- Pagination -->
        <div class="pagination" *ngIf="filteredOperations.length > pageSize" style="display:flex; justify-content:center; align-items:center; gap:.5rem; padding:1rem; flex-wrap:wrap;">
          <button mat-stroked-button (click)="prevPage()" [disabled]="pageIndex===0">Önceki</button>
          <span style="font-size:12px;">Sayfa {{pageIndex+1}} / {{totalPages}}</span>
          <button mat-stroked-button (click)="nextPage()" [disabled]="pageIndex+1>=totalPages">Sonraki</button>
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

  .table-card { border-radius: 12px; overflow: hidden; position: relative; }
  .loading-overlay { position: absolute; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.75); z-index: 20; pointer-events: none; }
  .loading-overlay .spinner-wrap { pointer-events: auto; z-index: 21; }
    .table-header { padding: 1.5rem; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; }
    .table-header h2 { margin: 0; font-size: 1.2rem; font-weight: 600; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem; }
    .table-container { overflow-x: auto; }

    .back-btn { background-color: #f8f9fa; color: #1976d2; border: 2px solid #e3f2fd; transition: all 0.3s ease; }
    .back-btn:hover { background-color: #e3f2fd; transform: scale(1.05); }
    .back-btn mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }

    .add-btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); border: none; box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3); transition: all 0.3s ease; }
    .add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4); }
    .add-btn mat-icon { font-size: 1.2rem; width: 1.2rem; height: 1.2rem; margin-right: 0.5rem; }

    @media (max-width: 768px) { .container { padding: 1rem; } .header { flex-direction: column; gap: 1rem; align-items: stretch; } .table-container { font-size: 0.9rem; } }
    /* Compact variant for filter action buttons (match device-list) */
    .compact-icon-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      min-width: 0;
      height: 36px;
      font-size: 0.9rem;
    }
    .compact-icon-btn .btn-icon { font-size: 18px; }
    .compact-icon-btn .btn-text { white-space: nowrap; }
    @media (max-width: 520px) {
      .compact-icon-btn .btn-text { display: none; }
    }
  `]
})
export class OperationListComponent implements OnInit {
  operations: any[] = [];
  filteredOperations: any[] = [];
  pagedOperations: any[] = [];
  isLoading: boolean = false;
  pageIndex = 0;
  pageSize = 20;
  totalPages = 0;
  // Sorting
  sort: { field: string | null, dir: 'asc' | 'desc' } = { field: null, dir: 'asc' };
  filterDeviceId: number | null = null;
  filterOperationTypeId: number | null = null;
  filterSupportId: number | null = null;
  filterStartDate: string | null = null;
  filterEndDate: string | null = null;
  searchText: string = '';
  devices: any[] = [];
  operationTypes: any[] = [];
  technicians: any[] = [];
  supports: any[] = [];
  selectedSchool: any = null;
  // track whether we previously used server-side filtering so we can reload when the filter is cleared
  private prevServerFilterActive: boolean = false;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  ngOnInit() {
    // Read query params so page can be pre-filtered via URL
    try {
      const qp = this.route.snapshot.queryParamMap;
      const dev = qp.get('device_id');
      const op = qp.get('operation_type_id');
      const sp = qp.get('support_id');
      if (dev) this.filterDeviceId = isNaN(Number(dev)) ? null : Number(dev);
      if (op) this.filterOperationTypeId = isNaN(Number(op)) ? null : Number(op);
      if (sp) this.filterSupportId = isNaN(Number(sp)) ? null : Number(sp);
    } catch (e) { /* ignore */ }

    // Seçili okulu dinle ve okul değiştiğinde verileri yenile
    this.authService.selectedSchool$.subscribe(school => {
      this.selectedSchool = school;

      // Okul seçili değilse veri yüklemeyi bekle
      if (!school) {
        this.operations = [];
        this.devices = [];
        this.technicians = [];
        this.isLoading = false;
        return;
      }

      // Okul seçildiyse önce ilişkili verileri (cihaz, tür, teknisyen) yükle ardından işlemleri getir
      this.isLoading = true;
      this.loadRelatedData(() => this.loadOperations());
    });
  }

  private getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  private loadOperations() {
    const token = this.getToken();
    // Always set loading true when starting an explicit operations load so the UI shows the spinner
    this.isLoading = true;
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      // Okul filtresi ekle - SÜPER ADMİN DAHİL HERKES SEÇİLİ OKULA GÖRE FİLTRELENECEK
  let url = `${apiBase}/api/operations`;
  const qp: string[] = [];
  if (this.selectedSchool) qp.push(`school_id=${this.selectedSchool.id}`);
  // Include server-side filters if set
  if (this.filterSupportId) qp.push(`support_id=${this.filterSupportId}`);
  if (this.filterDeviceId) qp.push(`device_id=${this.filterDeviceId}`);
  if (this.filterOperationTypeId) qp.push(`operation_type_id=${this.filterOperationTypeId}`);
  if (qp.length) url += `?${qp.join('&')}`;

      this.http.get<any>(url, { headers }).subscribe({
        next: data => {
          // Normalize response to array if server wraps it in an object
          this.operations = Array.isArray(data) ? data : (data && Array.isArray((data as any).operations) ? (data as any).operations : []);
          this.loadSortFromStorage();
          // If support filter is active we already filtered server-side, so just apply other client filters
          this.applyFilters(false);
          // Clear loading flag first, then run change detection so template updates immediately
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: err => {
          console.error('Error loading operations:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // No token available: ensure spinner is cleared to avoid stuck loading state
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private loadRelatedData(afterLoad?: () => void) {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      // Load devices filtered by selected school
  let devicesUrl = `${apiBase}/api/devices`;
      if (this.selectedSchool) {
        devicesUrl += `?school_id=${this.selectedSchool.id}`;
      }
      this.http.get<any>(devicesUrl, { headers }).subscribe({
        next: data => { this.devices = Array.isArray(data) ? data : (data && Array.isArray((data as any).devices) ? (data as any).devices : []); this.cdr.detectChanges(); },
        error: err => { console.error('Error loading devices:', err); }
      });

      // Load operation types from API
      this.http.get<any>(`${apiBase}/api/operation-types`, { headers }).subscribe({
        next: data => { this.operationTypes = Array.isArray(data) ? data : (data && Array.isArray((data as any).operationTypes) ? (data as any).operationTypes : []); this.cdr.detectChanges(); },
        error: err => { console.error('Error loading operation types:', err); }
      });

      // Load technicians filtered by selected school
  let techUrl = `${apiBase}/api/technicians`;
      if (this.selectedSchool) {
        techUrl += `?school_id=${this.selectedSchool.id}`;
      }
      this.http.get<any>(techUrl, { headers }).subscribe({
        next: data => { this.technicians = Array.isArray(data) ? data : (data && Array.isArray((data as any).technicians) ? (data as any).technicians : []); this.cdr.detectChanges(); if (afterLoad) afterLoad(); },
        error: err => { console.error('Error loading technicians:', err); if (afterLoad) afterLoad(); }
      });
      // Load supports (faults) for the selected school so user can filter operations by support request
      let supportsUrl = `${apiBase}/api/faults`;
      if (this.selectedSchool) {
        supportsUrl += `?school_id=${this.selectedSchool.id}`;
      }
      this.http.get<any>(supportsUrl, { headers }).subscribe({
        next: data => { this.supports = Array.isArray(data) ? data : (data && Array.isArray((data as any).faults) ? (data as any).faults : []); this.cdr.detectChanges(); },
        error: err => { console.error('Error loading supports (faults):', err); }
      });
    }
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(OperationAddEditDialogComponent, {
      width: '500px',
      data: {
        devices: this.devices,
        operationTypes: this.operationTypes,
        technicians: this.technicians,
        selectedSchoolId: this.selectedSchool?.id
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addOperationFromDialog(result);
      }
    });
  }

  openEditDialog(operation: any) {
    const dialogRef = this.dialog.open(OperationAddEditDialogComponent, {
      width: '500px',
      data: {
        // ensure support_id is explicitly passed so the dialog's hidden control is populated
        operation: { ...operation, support_id: operation?.support_id ?? null },
        devices: this.devices,
        operationTypes: this.operationTypes,
        technicians: this.technicians,
        selectedSchoolId: this.selectedSchool?.id
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateOperationFromDialog(operation.id, result);
      }
    });
  }

  private addOperationFromDialog(formData: any) {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      // Seçili okul bilgisini ekle
      if (this.selectedSchool?.id) {
        formData.school_id = this.selectedSchool.id;
      }
  this.http.post(`${apiBase}/api/operations`, formData, { headers }).subscribe({
        next: () => {
          this.loadOperations();
        },
        error: err => console.error('Error adding operation:', err)
      });
    }
  }

  private updateOperationFromDialog(id: number, formData: any) {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      // Seçili okul bilgisini ekle
      if (this.selectedSchool?.id) {
        formData.school_id = this.selectedSchool.id;
      }
  this.http.put(`${apiBase}/api/operations/${id}`, formData, { headers }).subscribe({
        next: () => {
          this.loadOperations();
        },
        error: err => console.error('Error updating operation:', err)
      });
    }
  }

  deleteOperation(id: number) {
    if (confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
      const token = this.getToken();
      if (token) {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  this.http.delete(`${apiBase}/api/operations/${id}`, { headers }).subscribe({
          next: () => {
            this.loadOperations();
            alert('İşlem başarıyla silindi!');
          },
          error: err => {
            console.error('Error deleting operation:', err);
            alert('İşlem silinirken bir hata oluştu!');
          }
        });
      }
    }
  }

  openSupportDialog(supportId: number) {
    try {
      this.dialog.open(OperationSupportDialogComponent, { width: '720px', data: { supportId } });
    } catch (e) {
      console.error('openSupportDialog error', e);
    }
  }

  applyFilters(useServerReload: boolean = true) {
    // Başlangıç ve bitiş tarihlerini Date objesine çevir
    let start: Date | null = this.filterStartDate ? new Date(this.filterStartDate) : null;
    let end: Date | null = this.filterEndDate ? new Date(this.filterEndDate) : null;
    if (end) {
      // Bitiş gününün sonuna ayarla
      end.setHours(23,59,59,999);
    }

  this.filteredOperations = this.operations.filter(o => {
      // Cihaz filtresi
      if (this.filterDeviceId && (!o.Device || o.Device.id !== this.filterDeviceId)) {
        return false;
      }
      // İşlem türü filtresi
      if (this.filterOperationTypeId && (!o.OperationType || o.OperationType.id !== this.filterOperationTypeId)) {
        return false;
      }
      // Tarih alanı
      const opDate = o.date ? new Date(o.date) : (o.created_at ? new Date(o.created_at) : (o.createdAt ? new Date(o.createdAt) : null));
      if (!opDate) return false;
      if (start && opDate < start) return false;
      if (end && opDate > end) return false;

      // Serbest metin arama (işlem türü adı, cihaz adı/kimlik no, teknisyen adı)
      if (this.searchText && this.searchText.trim().length > 0) {
        const q = this.searchText.toLowerCase();
        const opType = (o.OperationType?.name || '').toLowerCase();
        const deviceName = (o.Device?.name || '').toLowerCase();
        const deviceIdentity = (o.Device?.identity_no || '').toLowerCase();
        const technicianName = (o.Technician?.name || '').toLowerCase();
        const matched = opType.includes(q) || deviceName.includes(q) || deviceIdentity.includes(q) || technicianName.includes(q);
        if (!matched) return false;
      }
      return true;
    });



    this.pageIndex = 0;
    // If requested, reload from server when server-side filters are in use
    try {
      const qp: any = {};
      // explicitly set keys to string or null so router.merge will add/remove params correctly
      qp.device_id = this.filterDeviceId ? String(this.filterDeviceId) : null;
      qp.operation_type_id = this.filterOperationTypeId ? String(this.filterOperationTypeId) : null;
      qp.support_id = this.filterSupportId ? String(this.filterSupportId) : null;
      // keep existing queryParams but replace these
      this.router.navigate([], { relativeTo: this.route, queryParams: qp, queryParamsHandling: 'merge' });
    } catch (e) { /* ignore navigation errors */ }

    // If we should reload from server and server-side filters are active OR were active previously, call loadOperations
    const serverShouldFilter = !!(this.filterSupportId || this.filterDeviceId || this.filterOperationTypeId);
    if (useServerReload && (serverShouldFilter || this.prevServerFilterActive)) {
      this.prevServerFilterActive = serverShouldFilter;
      this.loadOperations();
      return;
    }

    // Apply sorting to filtered list before paging
    this.applySort();
    this.updatePagedData();
  }

  clearFilters() {
    this.filterDeviceId = null;
    this.filterOperationTypeId = null;
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.searchText = '';
    this.filteredOperations = [...this.operations];
    this.pageIndex = 0;
    this.updatePagedData();
  }

  updatePagedData() {
    this.totalPages = Math.ceil(this.filteredOperations.length / this.pageSize) || 1;
    const start = this.pageIndex * this.pageSize;
    this.pagedOperations = this.filteredOperations.slice(start, start + this.pageSize);
  }

  onHeaderClick(field: string) {
    if (this.sort.field === field) {
      this.sort.dir = this.sort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sort.field = field;
      this.sort.dir = 'asc';
    }
    this.saveSortToStorage();
    this.applySort();
    this.pageIndex = 0;
    this.updatePagedData();
  }

  private storageKey() {
    return isPlatformBrowser(this.platformId) && this.selectedSchool ? `operations_sort_${this.selectedSchool.id}` : 'operations_sort';
  }

  private saveSortToStorage() {
    if (!isPlatformBrowser(this.platformId)) return;
    try { localStorage.setItem(this.storageKey(), JSON.stringify(this.sort)); } catch (e) {}
  }

  private loadSortFromStorage() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const raw = localStorage.getItem(this.storageKey()); if (!raw) return;
      const s = JSON.parse(raw); if (s) { this.sort.field = s.field || null; this.sort.dir = s.dir === 'desc' ? 'desc' : 'asc'; }
    } catch (e) {}
  }

  private applySort() {
    if (!this.sort.field) return;
    const field = this.sort.field;
    const dir = this.sort.dir === 'asc' ? 1 : -1;
    this.filteredOperations.sort((a: any, b: any) => {
      // Special-cased comparisons for known fields to ensure correct ordering
      if (field === 'device') {
        const va = (a.Device?.name || a.Device?.identity_no || '').toString();
        const vb = (b.Device?.name || b.Device?.identity_no || '').toString();
        return va.localeCompare(vb, undefined, { numeric: true }) * dir;
      }
      if (field === 'operation_type') {
        const va = (a.OperationType?.name || '').toString();
        const vb = (b.OperationType?.name || '').toString();
        return va.localeCompare(vb, undefined, { numeric: true }) * dir;
      }
      if (field === 'technician') {
        const va = (a.Technician?.name || '').toString();
        const vb = (b.Technician?.name || '').toString();
        return va.localeCompare(vb, undefined, { numeric: true }) * dir;
      }
      if (field === 'date') {
        const ta = a.date ? new Date(a.date).getTime() : (a.created_at ? new Date(a.created_at).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
        const tb = b.date ? new Date(b.date).getTime() : (b.created_at ? new Date(b.created_at).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
        return (ta - tb) * dir;
      }
      if (field === 'status') {
        const va = a.is_completed ? 1 : 0;
        const vb = b.is_completed ? 1 : 0;
        return (va - vb) * dir;
      }
      // Fallback: compare as strings (numeric aware)
      const va = (a[field] ?? '').toString();
      const vb = (b[field] ?? '').toString();
      const na = parseFloat(va.replace(/[^0-9.-]+/g, ''));
      const nb = parseFloat(vb.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
      return va.localeCompare(vb, undefined, { numeric: true }) * dir;
    });
  }

  nextPage() {
    if (this.pageIndex + 1 < this.totalPages) {
      this.pageIndex++;
      this.updatePagedData();
    }
  }

  prevPage() {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.updatePagedData();
    }
  }

  supportLabel(s: any) {
    if (!s) return '';
    // Talep eden
    const requester = s.requested_by_employee_name || s.RequestedByEmployee?.name || s.Creator?.name || s.Creator?.username || s.created_by_user_name || s.user_name || '';
    // Demirbaş
    const device = s.Device ? (s.Device.name + (s.Device.identity_no ? ' (' + s.Device.identity_no + ')' : '')) : (s.device_name || '');
    // Issue details (first 10 chars)
    const issue = (s.issue_details || s.summary || s.title || s.issue || '').toString();
    const issueShort = issue ? (issue.length > 10 ? issue.substring(0,10) + '...' : issue) : '';
    // Date
    const dt = s.created_at || s.createdAt || s.date || null;
    let dateStr = '';
    try {
      if (dt) {
        const d = new Date(dt);
        dateStr = d.toLocaleDateString('tr-TR');
      }
    } catch (e) { dateStr = ''; }
    // Build final label
    const parts = [];
    if (requester) parts.push(requester);
    if (device) parts.push(device);
    if (issueShort) parts.push(issueShort);
    if (dateStr) parts.push(dateStr);
    return parts.join(' - ');
  }

  // Filtrelenmiş tüm kayıtları yazdır / PDF'e dönüştür (tarayıcı yazdır menüsü)
  printFiltered() {
    if (!isPlatformBrowser(this.platformId)) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const schoolName = (this.selectedSchool?.name || 'Okul Seçilmedi').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    // Dinamik filtre özetini oluştur
    const activeFilters: string[] = [];
    if (this.filterDeviceId) {
      const dev = this.devices.find(d => d.id === this.filterDeviceId);
  if (dev) activeFilters.push(`Demirbaş: ${dev.name} (${dev.identity_no || ''})`);
    }
    if (this.filterOperationTypeId) {
      const opT = this.operationTypes.find(t => t.id === this.filterOperationTypeId);
      if (opT) activeFilters.push(`İşlem Türü: ${opT.name}`);
    }
    if (this.filterStartDate) activeFilters.push(`Başlangıç Tarihi: ${new Date(this.filterStartDate).toLocaleDateString('tr-TR')}`);
    if (this.filterEndDate) activeFilters.push(`Bitiş Tarihi: ${new Date(this.filterEndDate).toLocaleDateString('tr-TR')}`);
    if (this.searchText && this.searchText.trim().length>0) activeFilters.push(`Arama: "${this.searchText.replace(/</g,'&lt;').replace(/>/g,'&gt;')}"`);
    const filtersHtml = activeFilters.length
      ? `<div class="filter-summary"><strong>Uygulanan Filtreler:</strong><ul>${activeFilters.map(f=>`<li>${f}</li>`).join('')}</ul></div>`
      : '<div class="filter-summary"><em>Uygulanan filtre yok</em></div>';

    const generatedAt = new Date().toLocaleString('tr-TR');
    const rowsHtml = this.filteredOperations.map(o => {
      const opTypeName = o.OperationType?.name || '';
      const deviceLabel = o.Device ? (o.Device.name + ' (' + (o.Device.identity_no || '') + ')') : '';
      const techName = o.Technician?.name || '';
      const dateVal = o.date || o.created_at || o.createdAt;
      const dateStr = dateVal ? new Date(dateVal).toLocaleString('tr-TR') : '';
      const status = o.is_completed ? '<span class="status-ok">Tamamlandı</span>' : '<span class="status-pending">Devam Ediyor</span>';
      const desc = (o.description || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return `<tr>
        <td>${deviceLabel}</td>
        <td>${opTypeName}</td>
        <td>${desc}</td>
        <td>${dateStr}</td>
        <td>${techName}</td>
        <td>${status}</td>
      </tr>`;
    }).join('');
    const desiredUrl = (window.location?.origin || '') + '/rapor/islemler';
    const html = `<!DOCTYPE html><html lang=\"tr\"><head><meta charset=\"UTF-8\" />
    <title>İşlemler Raporu - ${schoolName}</title>
    <style>
      body { font-family: Arial, sans-serif; padding:16px; }
      h1.report-title { font-size:24px; margin:0 0 10px; font-weight:600; }
      table { width:100%; border-collapse: collapse; font-size:12px; }
      th, td { border:1px solid #ccc; padding:6px; text-align:left; }
      th { background:#f5f5f5; }
      .status-ok { background:#4caf50; color:#fff; padding:2px 6px; border-radius:3px; }
      .status-pending { background:#ff9800; color:#fff; padding:2px 6px; border-radius:3px; }
      .filter-summary { margin:8px 0 16px; font-size:11px; }
      .filter-summary ul { margin:4px 0 0 16px; padding:0; }
      .meta { font-size:10px; color:#666; margin-bottom:8px; }
      .footer-url { margin-top:20px; font-size:10px; color:#888; }
      @media print { body { padding:0; } }
    </style>
    </head><body>
    <h1 class=\"report-title\">${schoolName} - İşlemler Raporu</h1>
    <div class=\"meta\">Toplam Kayıt: ${this.filteredOperations.length} | Oluşturulma: ${generatedAt}</div>
    ${filtersHtml}
  <table><thead><tr><th>Demirbaş</th><th>İşlem Türü</th><th>Açıklama</th><th>Tarih</th><th>Teknisyen</th><th>Durum</th></tr></thead><tbody>${rowsHtml}</tbody></table>
    <div class=\"footer-url\">Kaynak: ${desiredUrl}</div>
    <script>window.print(); setTimeout(()=>window.close(), 300);</script>
    </body></html>`;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    // URL footer'da about:blank yerine özel yol gözüksün
    try { printWindow.history.replaceState({}, '', desiredUrl); } catch(e) {}
  }
}
