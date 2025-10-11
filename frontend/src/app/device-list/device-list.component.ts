import { Component, OnInit, AfterViewInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DeviceAddDialogComponent } from '../device-add-dialog/device-add-dialog.component';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-device-list',
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatTableModule, MatDialogModule, MatIconModule, MatMenuModule, MatTooltipModule],
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
            <mat-icon fontSet="material-symbols-outlined">computer</mat-icon>
            Cihaz Yönetimi
          </h1>
        </div>
        <button mat-raised-button color="primary" (click)="openAddDialog()" class="add-btn">
          <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
          Yeni Cihaz Ekle
        </button>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card" style="margin-bottom:1rem;">
  <div class="filters" style="padding: 12px; display:flex; flex-wrap:wrap; gap:1rem; align-items:flex-end;">
          <div style="min-width:220px;">
            <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Aygıt Tipi</label>
            <select [(ngModel)]="filterDeviceTypeId" (change)="applyFilters()" style="padding:6px; width:100%; border:1px solid #ccc; border-radius:4px;">
              <option [ngValue]="null">Tümü</option>
              <option *ngFor="let dt of deviceTypes" [ngValue]="dt.id">{{dt.name}}</option>
            </select>
          </div>
          <div style="min-width:150px;">
            <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Lokasyon</label>
            <select [(ngModel)]="filterLocationId" (change)="applyFilters()" style="padding:6px; width:100%; border:1px solid #ccc; border-radius:4px;">
              <option [ngValue]="null">Tümü</option>
              <option *ngFor="let loc of locations" [ngValue]="loc.id">{{loc.name}}</option>
            </select>
          </div>
          <div style="min-width:120px;">
            <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Durum</label>
            <select [(ngModel)]="filterStatus" (change)="applyFilters()" style="padding:6px; width:100%; border:1px solid #ccc; border-radius:4px;">
              <option [ngValue]="null">Tümü</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
              <option value="maintenance">Bakımda</option>
            </select>
          </div>
          <div style="min-width:240px;">
            <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px;">Arama (Ad / Kullanıcı / Kimlik No / Seri No)</label>
            <input type="text" [(ngModel)]="searchText" (input)="applyFilters()" placeholder="Ara..." style="padding:6px; width:100%; border:1px solid #ccc; border-radius:4px;" />
          </div>
          <div>
            <button mat-stroked-button color="primary" class="compact-icon-btn" (click)="clearFilters()">
              <mat-icon fontSet="material-symbols-outlined" class="btn-icon">delete_sweep</mat-icon>
              <span class="btn-text">Temizle</span>
            </button>
          </div>
          <div *ngIf="filteredDevices.length>0">
            <button mat-stroked-button color="accent" class="compact-icon-btn" (click)="printFiltered()">
              <mat-icon fontSet="material-symbols-outlined" class="btn-icon">print</mat-icon>
              <span class="btn-text">Yazdır</span>
            </button>
          </div>
          <div style="margin-left:auto; font-size:12px;">Toplam: {{filteredDevices.length}} kayıt</div>
        </div>
      </mat-card>

      <!-- Devices Table -->
      <mat-card class="table-card">
        <div class="table-header">
          <h2>
            <mat-icon fontSet="material-symbols-outlined">format_list_bulleted</mat-icon>
            Cihaz Listesi
          </h2>
        </div>
        <div class="table-container">
          <table mat-table [dataSource]="pagedDevices" class="devices-table">
        <ng-container matColumnDef="identity_no">
                <th mat-header-cell *matHeaderCellDef (click)="onHeaderClick('identity_no')" class="col-identity" style="cursor:pointer">Kimlik No
            <mat-icon *ngIf="sort.field==='identity_no'" style="vertical-align: middle; font-size: 16px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          </th>
          <td mat-cell *matCellDef="let element" class="col-identity">{{element.identity_no}}</td>
        </ng-container>
        <ng-container matColumnDef="operations">
          <th mat-header-cell *matHeaderCellDef>İşlemler</th>
          <td mat-cell *matCellDef="let element">
            <button mat-mini-fab color="primary" (click)="viewDeviceOperations(element)" matTooltip="Cihaz İşlemlerini Gör">
              <span class="material-symbols-outlined">history</span>
            </button>
          </td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef (click)="onHeaderClick('name')" style="cursor:pointer">Ad
            <mat-icon *ngIf="sort.field==='name'" style="vertical-align: middle; font-size: 16px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          </th>
          <td mat-cell *matCellDef="let element">
            <div>
              <strong>{{element.name}}</strong>
              <div *ngIf="element.Features && element.Features.length > 0" style="font-size: 0.8em; color: #666; margin-top: 2px;">
                <span *ngFor="let feature of element.Features; let last = last">
                  {{feature.name}}<span *ngIf="feature.DeviceFeature?.value"> : {{feature.DeviceFeature.value}}</span><span *ngIf="!last">,</span>
                </span>
              </div>
            </div>
          </td>
        </ng-container>
        <ng-container matColumnDef="serial_no">
          <th mat-header-cell *matHeaderCellDef (click)="onHeaderClick('serial_no')" style="cursor:pointer">Seri No
            <mat-icon *ngIf="sort.field==='serial_no'" style="vertical-align: middle; font-size: 16px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          </th>
          <td mat-cell *matCellDef="let element">{{element.serial_no}}</td>
        </ng-container>
        <ng-container matColumnDef="user">
          <th mat-header-cell *matHeaderCellDef (click)="onHeaderClick('user')" style="cursor:pointer">Kullanıcı
            <mat-icon *ngIf="sort.field==='user'" style="vertical-align: middle; font-size: 16px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          </th>
          <td mat-cell *matCellDef="let element">{{element.user}}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef (click)="onHeaderClick('status')" style="cursor:pointer">Durum
            <mat-icon *ngIf="sort.field==='status'" style="vertical-align: middle; font-size: 16px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          </th>
          <td mat-cell *matCellDef="let element">{{element.status}}</td>
        </ng-container>
        <ng-container matColumnDef="device_type">
          <th mat-header-cell *matHeaderCellDef (click)="onHeaderClick('device_type')" style="cursor:pointer">Aygıt Tipi
            <mat-icon *ngIf="sort.field==='device_type'" style="vertical-align: middle; font-size: 16px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          </th>
          <td mat-cell *matCellDef="let element">{{element.DeviceType?.name}}</td>
        </ng-container>
        <ng-container matColumnDef="location">
          <th mat-header-cell *matHeaderCellDef (click)="onHeaderClick('location')" style="cursor:pointer">Lokasyon
            <mat-icon *ngIf="sort.field==='location'" style="vertical-align: middle; font-size: 16px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          </th>
          <td mat-cell *matCellDef="let element">{{element.Location?.name}}</td>
        </ng-container>
        <ng-container matColumnDef="qr">
          <th mat-header-cell *matHeaderCellDef>QR Kod</th>
          <td mat-cell *matCellDef="let element">
            <img [src]="element.qr_code" alt="QR Kod" style="width:50px; height:50px;" />
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>İşlemler</th>
          <td mat-cell *matCellDef="let element">
            <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="İçlemler menüsü">
              <span class="material-symbols-outlined">more_vert</span>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="editDevice(element)">
                <span class="material-symbols-outlined">edit</span>
                <span>Düzenle</span>
              </button>
              <button mat-menu-item (click)="duplicateDevice(element)">
                <span class="material-symbols-outlined">content_copy</span>
                <span>Çoğalt</span>
              </button>
              <button mat-menu-item (click)="deleteDevice(element)" style="color: #f44336;">
                <span class="material-symbols-outlined">delete</span>
                <span>Sil</span>
              </button>
            </mat-menu>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        </div>
        <!-- Pagination Controls -->
        <div class="pagination">
          <button mat-button (click)="prevPage()" [disabled]="pageIndex === 0">Önceki</button>
          <span>Sayfa {{pageIndex + 1}} / {{totalPages}}</span>
          <button mat-button (click)="nextPage()" [disabled]="pageIndex === totalPages - 1">Sonraki</button>
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
    .table-container { overflow-x: auto; }
    .devices-table { width: 100%; }

    /* Align header back button and add button styles with Schools/Users pages */
    .back-btn {
      background-color: #f8f9fa;
      color: #1976d2;
      border: 2px solid #e3f2fd;
      transition: all 0.3s ease;
    }

    .back-btn:hover { background-color: #e3f2fd; transform: scale(1.05); }
    .back-btn mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }

    .add-btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
      border: none;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
      transition: all 0.3s ease;
    }

    .add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4); }
    .add-btn mat-icon { font-size: 1.2rem; width: 1.2rem; height: 1.2rem; margin-right: 0.5rem; }

    .pagination {
      padding: 1rem;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      border-top: 1px solid #e0e0e0;
    }

    .pagination button {
      min-width: 100px;
    }

    /* Prevent identity_no column from wrapping */
    .col-identity {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 220px; /* reasonable default; table cell may shrink if needed */
    }

    /* Compact variant for filter action buttons */
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

    /* Responsive tweaks */
    @media (max-width: 768px) {
      .container { padding: 1rem; }
      .header { flex-direction: column; gap: 1rem; align-items: stretch; }
      .table-container { font-size: 0.9rem; }
    }
  `]
})
export class DeviceListComponent implements OnInit, AfterViewInit {
  devices: any[] = [];
  locations: any[] = [];
  deviceTypes: any[] = [];
  selectedSchool: any = null;
  displayedColumns: string[] = ['identity_no', 'operations', 'name', 'serial_no', 'user', 'status', 'device_type', 'location', 'qr', 'actions'];
  // Pagination
  pagedDevices: any[] = [];
  pageIndex = 0;
  pageSize = 20;

  totalPages = 0;
  // Filtering
  filteredDevices: any[] = [];
  filterDeviceTypeId: number | null = null;
  filterLocationId: number | null = null;
  filterStatus: string | null = null;
  searchText: string = '';
  // Sorting
  sort: { field: string | null, dir: 'asc' | 'desc' } = { field: null, dir: 'asc' };
  // Print helper state not persisted separately; dynamic generation only

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  viewDeviceOperations(device: any) {
    const url = `/device-detail/${device.id}`;
    // Yeni sekmede aç
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener');
    } else {
      // SSR ortamı için fallback
      this.router.navigate(['/device-detail', device.id]);
    }
  }

  private getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  ngOnInit() {
    // Seçili okulu dinle ve okul değiştiğinde verileri yenile
    this.authService.selectedSchool$.subscribe(school => {
      this.selectedSchool = school;
      console.log('Device List - School changed in subscription:', school);

      // Okul seçili değilse veri yüklemeyi bekle
      if (!school) {
        console.log('Device List - No school selected, clearing devices');
        this.devices = [];
        this.locations = [];
        return;
      }

      // Okul seçildiyse verileri yükle (süper admin dahil)
      this.refresh();
      this.loadLocations();
    });

    this.loadDeviceTypes();
  }

  ngAfterViewInit() {
    // Sadece change detection için gerekli, refresh tekrar çağrılmasın
  }

  loadLocations() {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      // Okul filtresi ekle - SÜPER ADMİN DAHİL HERKES SEÇİLİ OKULA GÖRE FİLTRELENECEK
      let url = `${environment.apiUrl}/api/locations`;
      if (this.selectedSchool) {
        url += `?school_id=${this.selectedSchool.id}`;
      }

      this.http.get<any[]>(url, { headers }).subscribe({
        next: data => this.locations = data,
        error: err => console.error('Error loading locations:', err)
      });
    }
  }

  loadDeviceTypes() {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.get<any[]>(`${environment.apiUrl}/api/device-types`, { headers }).subscribe({
        next: data => this.deviceTypes = data,
        error: err => console.error('Error loading device types:', err)
      });
    }
  }

  refresh() {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      let url = `${environment.apiUrl}/api/devices`;
      if (this.selectedSchool) {
        url += `?school_id=${this.selectedSchool.id}`;
      }
      this.http.get<any[]>(url, { headers }).subscribe(async data => {
        this.devices = await Promise.all(data.map(async c => {
          const qrRes: any = await this.http.get(`${environment.apiUrl}/api/devices/${c.id}/qr`, { headers }).toPromise();
          return { ...c, qr_code: qrRes.qr };
        }));
        this.pageIndex = 0;
        this.loadSortFromStorage();
        this.applyFilters();
        this.cdr.detectChanges();
      });
    }
  }

  private updatePagedData() {
    this.totalPages = Math.max(1, Math.ceil(this.filteredDevices.length / this.pageSize));
    const start = this.pageIndex * this.pageSize;
    this.pagedDevices = this.filteredDevices.slice(start, start + this.pageSize);
  }

  applyFilters() {
    const query = this.searchText.trim().toLowerCase();
    this.filteredDevices = this.devices.filter(d => {
      if (this.filterDeviceTypeId && d.DeviceType?.id !== this.filterDeviceTypeId) return false;
      if (this.filterLocationId && d.Location?.id !== this.filterLocationId) return false;
      if (this.filterStatus && d.status !== this.filterStatus) return false;
      if (query) {
        const name = (d.name || '').toLowerCase();
        const user = (d.user || '').toLowerCase();
        const identity = (d.identity_no || '').toLowerCase();
        const serial = (d.serial_no || '').toLowerCase();
        if (!name.includes(query) && !user.includes(query) && !identity.includes(query) && !serial.includes(query)) {
          return false;
        }
      }
      return true;
    });
    this.pageIndex = 0;
    // apply sorting to filtered list
    this.applySort();
    this.updatePagedData();
  }

  private applySort() {
    if (!this.sort.field) return;
    const field = this.sort.field;
    const dir = this.sort.dir === 'asc' ? 1 : -1;
    this.filteredDevices.sort((a: any, b: any) => {
      let va: any = a[field];
      let vb: any = b[field];
      // support nested fields for device_type and location
      if (field === 'device_type') { va = a.DeviceType?.name; vb = b.DeviceType?.name; }
      if (field === 'location') { va = a.Location?.name; vb = b.Location?.name; }
      va = (va ?? '').toString(); vb = (vb ?? '').toString();
      const na = parseFloat(va.replace(/[^0-9.-]+/g, ''));
      const nb = parseFloat(vb.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
      return va.localeCompare(vb, undefined, { numeric: true }) * dir;
    });
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
    return isPlatformBrowser(this.platformId) && this.selectedSchool ? `devices_sort_${this.selectedSchool.id}` : 'devices_sort';
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

  clearFilters() {
    this.filterDeviceTypeId = null;
    this.filterLocationId = null;
    this.filterStatus = null;
    this.searchText = '';
    this.filteredDevices = [...this.devices];
    this.pageIndex = 0;
    this.updatePagedData();
  }

  nextPage() {
    if (this.pageIndex < this.totalPages - 1) {
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

  openAddDialog() {
    const dialogRef = this.dialog.open(DeviceAddDialogComponent, {
      width: '500px',
      data: { locations: this.locations, deviceTypes: this.deviceTypes }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addDevice(result);
      }
    });
  }

  addDevice(deviceData: any) {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      // Seçili okul bilgisini ekle - SÜPER ADMİN DAHİL HERKES SEÇİLİ OKULA CIHAZ EKLER
      if (this.selectedSchool) {
        deviceData.school_id = this.selectedSchool.id;
      }

      this.http.post(`${environment.apiUrl}/api/devices`, deviceData, { headers }).subscribe({
        next: () => {
          this.refresh();
        },
        error: err => console.error('Error adding device:', err)
      });
    }
  }

  editDevice(device: any) {
    const dialogRef = this.dialog.open(DeviceAddDialogComponent, {
      width: '500px',
      data: { locations: this.locations, deviceTypes: this.deviceTypes, device: device, isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateDevice(device.id, result);
      }
    });
  }

  updateDevice(id: number, deviceData: any) {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.put(`${environment.apiUrl}/api/devices/${id}`, deviceData, { headers }).subscribe({
        next: () => {
          this.refresh();
        },
        error: err => {
          console.error('Error updating device:', err);
          if (err.error?.error === 'Bu kimlik numarası zaten kullanılıyor') {
            alert('Bu kimlik numarası zaten kullanılıyor. Lütfen farklı bir kimlik numarası girin.');
          } else {
            alert('Cihaz güncellenirken bir hata oluştu.');
          }
        }
      });
    }
  }

  deleteDevice(device: any) {
    if (confirm(`"${device.name}" cihazını silmek istediğinizden emin misiniz?`)) {
      const token = this.getToken();
      if (token) {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http.delete(`${environment.apiUrl}/api/devices/${device.id}`, { headers }).subscribe({
          next: () => {
            this.refresh();
          },
          error: err => console.error('Error deleting device:', err)
        });
      }
    }
  }

  duplicateDevice(device: any) {
    if (!confirm(`"${device.name}" cihazını çoğaltmak istediğinize emin misiniz? Yeni cihaz kimlik numarası otomatik oluşturulacaktır.`)) return;
    const token = this.getToken();
    if (!token) return;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Deep clone device and prepare payload for creation
    const clone: any = { ...device };
    // Remove server-side fields
    delete clone.id; delete clone.createdAt; delete clone.updatedAt; delete clone.qr_code;

    // Prepare selectedFeatures array from device.Features
    const selectedFeatures = (device.Features || []).map((f: any) => ({ feature_id: f.id, value: f.DeviceFeature?.value || '' }));

    // Function to bump trailing number in identity_no, or append -2 if none
    const bumpIdentity = (identity: string, inc: number) => {
      if (!identity) return `copy-${inc}`;
      const m = identity.match(/(.*?)(\d+)$/);
      if (m) {
        const prefix = m[1];
        const num = parseInt(m[2], 10) + inc;
        return `${prefix}${num}`;
      }
      // try to append -<n>
      return `${identity}-${inc}`;
    };

    // Try creating with incremented identity_no up to attempts
    const attempts = 6;
    let attempt = 1;

    const tryCreate = () => {
      const newIdentity = bumpIdentity(device.identity_no || '', attempt);
      const payload: any = {
        name: clone.name,
        serial_no: clone.serial_no,
        user: clone.user,
        status: clone.status,
        device_type_id: clone.device_type_id || clone.DeviceType?.id,
        location_id: clone.location_id || clone.Location?.id,
        identity_no: newIdentity,
        selectedFeatures
      };
      if (this.selectedSchool) payload.school_id = this.selectedSchool.id;

      this.http.post(`${environment.apiUrl}/api/devices`, payload, { headers }).subscribe({
        next: () => {
          this.refresh();
        },
        error: (err: any) => {
          // If identity conflict, try next increment
          const msg = err?.error?.error || err?.error || '';
          if (msg && msg.toString().toLowerCase().includes('kimlik') && attempt < attempts) {
            attempt++;
            tryCreate();
          } else {
            console.error('Error duplicating device:', err);
            alert('Cihaz çoğaltma sırasında hata oluştu: ' + (msg || err.message || err.statusText || ''));
          }
        }
      });
    };

    tryCreate();
  }

  // Yazdır / PDF (filtrelenmiş cihaz listesi)
  printFiltered() {
    if (!isPlatformBrowser(this.platformId)) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const schoolName = (this.selectedSchool?.name || 'Okul Seçilmedi').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const activeFilters: string[] = [];
    if (this.filterDeviceTypeId) {
      const dt = this.deviceTypes.find(t => t.id === this.filterDeviceTypeId); if (dt) activeFilters.push(`Aygıt Tipi: ${dt.name}`);
    }
    if (this.filterLocationId) {
      const loc = this.locations.find(l => l.id === this.filterLocationId); if (loc) activeFilters.push(`Lokasyon: ${loc.name}`);
    }
    if (this.searchText && this.searchText.trim().length>0) activeFilters.push(`Arama: "${this.searchText.replace(/</g,'&lt;').replace(/>/g,'&gt;')}"`);
    const filtersHtml = activeFilters.length
      ? `<div class="filter-summary"><strong>Uygulanan Filtreler:</strong><ul>${activeFilters.map(f=>`<li>${f}</li>`).join('')}</ul></div>`
      : '<div class="filter-summary"><em>Uygulanan filtre yok</em></div>';
    const generatedAt = new Date().toLocaleString('tr-TR');
    const rowsHtml = this.filteredDevices.map(d => {
      const features = (d.Features||[]).map((f:any)=>`${f.name}${f.DeviceFeature?.value?': '+f.DeviceFeature.value:''}`).join(', ');
      const safeFeatures = features.replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return `<tr>
        <td>${(d.identity_no||'')}</td>
        <td>${(d.name||'')}</td>
        <td>${(d.serial_no||'')}</td>
        <td>${(d.user||'')}</td>
        <td>${(d.status||'')}</td>
        <td>${d.DeviceType?.name||''}</td>
        <td>${d.Location?.name||''}</td>
        <td>${safeFeatures}</td>
      </tr>`; }).join('');
    const desiredUrl = (window.location?.origin || '') + '/rapor/cihazlar';
    const html = `<!DOCTYPE html><html lang=\"tr\"><head><meta charset=\"UTF-8\" />
    <title>Cihaz Raporu - ${schoolName}</title>
    <style>
      body { font-family: Arial, sans-serif; padding:16px; }
      h1.report-title { font-size:24px; margin:0 0 10px; font-weight:600; }
      table { width:100%; border-collapse: collapse; font-size:12px; }
      th, td { border:1px solid #ccc; padding:6px; text-align:left; }
      th { background:#f5f5f5; }
      .filter-summary { margin:8px 0 16px; font-size:11px; }
      .filter-summary ul { margin:4px 0 0 16px; padding:0; }
      .meta { font-size:10px; color:#666; margin-bottom:8px; }
      .footer-url { margin-top:20px; font-size:10px; color:#888; }
      @media print { body { padding:0; } }
    </style></head><body>
    <h1 class="report-title">${schoolName} - Cihaz Raporu</h1>
    <div class="meta">Toplam Kayıt: ${this.filteredDevices.length} | Oluşturulma: ${generatedAt}</div>
    ${filtersHtml}
    <table><thead><tr><th>Kimlik No</th><th>Ad</th><th>Seri No</th><th>Kullanıcı</th><th>Durum</th><th>Aygıt Tipi</th><th>Lokasyon</th><th>Özellikler</th></tr></thead><tbody>${rowsHtml}</tbody></table>
    <div class=\"footer-url\">Kaynak: ${desiredUrl}</div>
    <script>window.print(); setTimeout(()=>window.close(), 300);</script>
    </body></html>`;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    try { printWindow.history.replaceState({}, '', desiredUrl); } catch(e) {}
  }
}
