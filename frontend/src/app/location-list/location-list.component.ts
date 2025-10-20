import { Component, OnInit, AfterViewInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { apiBase } from '../runtime-config';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { LocationAddEditDialogComponent } from '../location-add-edit-dialog/location-add-edit-dialog.component';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule, ReactiveFormsModule, MatIconModule, MatSelectModule, MatProgressSpinnerModule],
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
            <mat-icon fontSet="material-symbols-outlined">location_on</mat-icon>
            Lokasyon Yönetimi
          </h1>
        </div>
        <button mat-raised-button color="primary" (click)="openAddDialog()" class="add-btn" [disabled]="!selectedSchool">
          <mat-icon fontSet="material-symbols-outlined">add_location</mat-icon>
          Yeni Lokasyon Ekle
        </button>
      </div>

      <!-- Locations Table -->
      <mat-card class="table-card">
        <div *ngIf="isLoading" class="loading-overlay">
          <div class="spinner-wrap"><mat-progress-spinner mode="indeterminate" diameter="60" color="primary"></mat-progress-spinner></div>
        </div>
        <div class="table-header">
          <h2>
            <mat-icon fontSet="material-symbols-outlined">format_list_bulleted</mat-icon>
            Lokasyon Listesi
          </h2>
          <div class="list-stats" *ngIf="locations">
            Gösterilen: {{pagedLocations.length}} / Toplam: {{locations.length}} kayıt
          </div>
        </div>
        <div class="table-container">
          <table style="width:100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th (click)="onHeaderClick('name')" style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd; cursor: pointer;">
                  Ad
                  <mat-icon *ngIf="sort.field==='name'" style="vertical-align: middle; font-size: 16px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                <th (click)="onHeaderClick('room_number')" style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd; cursor: pointer;">
                  Oda Numarası
                  <mat-icon *ngIf="sort.field==='room_number'" style="vertical-align: middle; font-size: 16px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                <th (click)="onHeaderClick('description')" style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd; cursor: pointer;">
                  Açıklama
                  <mat-icon *ngIf="sort.field==='description'" style="vertical-align: middle; font-size: 16px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                <th style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd;">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="locations.length === 0">
                <td colspan="4" style="padding: 20px; text-align: center; color: #666;">
                  Henüz lokasyon bulunmuyor.
                </td>
              </tr>
              <tr *ngFor="let l of pagedLocations" style="border-bottom: 1px solid #eee;">
                <td style="padding: 4px 12px;">{{l.name}}</td>
                <td style="padding: 4px 12px;">{{l.room_number}}</td>
                <td style="padding: 4px 12px;">{{l.description}}</td>
                <td style="padding: 4px 12px;">
                  <button mat-button color="accent" (click)="openEditDialog(l)" style="margin-right: 5px;">
                    <span class="material-symbols-outlined" style="margin-right: 0.3rem; font-size: 18px;">edit</span>
                    Düzenle
                  </button>
                  <button mat-button color="warn" (click)="deleteLocation(l.id)">
                    <span class="material-symbols-outlined" style="margin-right: 0.3rem; font-size: 18px;">delete</span>
                    Sil
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="pagination-controls">
          <div style="display:flex; align-items:center; gap:1rem;">
            <button mat-button (click)="prevPage()" [disabled]="pageIndex === 0">
              <mat-icon fontSet="material-symbols-outlined">chevron_left</mat-icon>
              Önceki
            </button>
            <span class="page-info">Sayfa {{pageIndex + 1}} / {{totalPages}}</span>
            <button mat-button (click)="nextPage()" [disabled]="pageIndex === totalPages - 1">
              Sonraki
              <mat-icon fontSet="material-symbols-outlined">chevron_right</mat-icon>
            </button>
          </div>

          <!-- Page size selector -->
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <label style="color:#666; font-size:0.9rem;">Göster</label>
            <mat-form-field appearance="outline" style="width:110px; margin:0;">
              <mat-select [value]="pageSize" (selectionChange)="onPageSizeChange($event.value)">
                <mat-option [value]="25">25</mat-option>
                <mat-option [value]="50">50</mat-option>
              </mat-select>
            </mat-form-field>
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
  .table-card { border-radius: 12px; overflow: hidden; position: relative; }
  .loading-overlay { position: absolute; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.75); z-index: 20; pointer-events: none; }
  .loading-overlay .spinner-wrap { pointer-events: auto; z-index: 21; }
    .table-header { padding: 1.5rem; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; }
    .table-header h2 { margin: 0; font-size: 1.2rem; font-weight: 600; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem; }
  .list-stats { color: #666; font-size: 0.95rem; align-self: center; }
    .table-container { overflow-x: auto; }

    .back-btn { background-color: #f8f9fa; color: #1976d2; border: 2px solid #e3f2fd; transition: all 0.3s ease; }
    .back-btn:hover { background-color: #e3f2fd; transform: scale(1.05); }
    .back-btn mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }

    .add-btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); border: none; box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3); transition: all 0.3s ease; }
    .add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4); }
    .add-btn mat-icon { font-size: 1.2rem; width: 1.2rem; height: 1.2rem; margin-right: 0.5rem; }

    .pagination-controls { display: flex; justify-content: center; align-items: center; padding: 1rem 0; gap: 1rem; }
    .page-info { font-size: 0.9rem; color: #666; }

    @media (max-width: 768px) { .container { padding: 1rem; } .header { flex-direction: column; gap: 1rem; align-items: stretch; } .table-container { font-size: 0.9rem; } }
  `]
})
export class LocationListComponent implements OnInit, AfterViewInit {
  locations: any[] = [];
  selectedSchool: any = null;
  isLoading: boolean = false;
  // Sorting state
  sort: { field: string | null, dir: 'asc' | 'desc' } = { field: null, dir: 'asc' };
  // Pagination
  pagedLocations: any[] = [];
  pageIndex = 0;
    pageSize = 25;
  totalPages = 0;

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

      // Okul seçili değilse veri yüklemeyi bekle
      if (!school) {
        this.locations = [];
        this.isLoading = false;
        return;
      }

      // Okul seçildiyse verileri yükle (süper admin dahil)
      this.isLoading = true;
      this.refresh();
    });
  }

  ngAfterViewInit() {
    // Change detection için gerekli
  }
  refresh() {
    // Ensure loading flag is set at the start of refresh
    this.isLoading = true;
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      let url = `${apiBase}/api/locations`;
      if (this.selectedSchool) {
        url += `?school_id=${this.selectedSchool.id}`;
      }
      this.http.get<any[]>(url, { headers }).subscribe({
        next: data => {
          this.locations = data;
          // Load saved sort preference and apply
          this.loadSortFromStorage();
          this.applySort();
          this.pageIndex = 0;
          this.updatePagedData();
          // clear loading then update view
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: err => {
          console.error('Error loading locations:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // No token: make sure spinner isn't stuck
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private applySort() {
    if (!this.sort.field) return;
    const field = this.sort.field;
    const dir = this.sort.dir === 'asc' ? 1 : -1;
    this.locations.sort((a: any, b: any) => {
      const va = (a[field] ?? '').toString();
      const vb = (b[field] ?? '').toString();
      // numeric comparison if possible
      const na = parseFloat(va.replace(/[^0-9.-]+/g, ''));
      const nb = parseFloat(vb.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(na) && !isNaN(nb)) {
        return (na - nb) * dir;
      }
      return va.localeCompare(vb, undefined, { numeric: true }) * dir;
    });
  }

  onHeaderClick(field: string) {
    if (this.sort.field === field) {
      // toggle direction
      this.sort.dir = this.sort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sort.field = field;
      this.sort.dir = 'asc';
    }
    // persist
    this.saveSortToStorage();
    // apply and reset to first page
    this.applySort();
    this.pageIndex = 0;
    this.updatePagedData();
  }

  private storageKey() {
    // include selected school to allow per-school sorting
    return isPlatformBrowser(this.platformId) && this.selectedSchool ? `locations_sort_${this.selectedSchool.id}` : 'locations_sort';
  }

  private saveSortToStorage() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(this.sort));
    } catch (e) { /* ignore */ }
  }

  private loadSortFromStorage() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const raw = localStorage.getItem(this.storageKey());
      if (raw) {
        const s = JSON.parse(raw);
        if (s && typeof s === 'object') {
          this.sort.field = s.field || null;
          this.sort.dir = s.dir === 'desc' ? 'desc' : 'asc';
        }
      }
    } catch (e) { /* ignore */ }
  }

  private updatePagedData() {
    this.totalPages = Math.max(1, Math.ceil(this.locations.length / this.pageSize));
    const start = this.pageIndex * this.pageSize;
    this.pagedLocations = this.locations.slice(start, start + this.pageSize);
  }

  onPageSizeChange(value: number) {
    const v = Number(value) || 25;
    this.pageSize = v;
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
    const dialogRef = this.dialog.open(LocationAddEditDialogComponent, {
      width: '400px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addLocationFromDialog(result);
      }
    });
  }

  openEditDialog(location: any) {
    const dialogRef = this.dialog.open(LocationAddEditDialogComponent, {
      width: '400px',
      data: { location }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateLocationFromDialog(location.id, result);
      }
    });
  }

  private addLocationFromDialog(formData: any) {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      // Seçili okulun id'sini create payload'ına ekle
      const payload = {
        ...formData,
        school_id: this.selectedSchool?.id
      };
  this.http.post(`${apiBase}/api/locations`, payload, { headers }).subscribe({
        next: () => {
          this.refresh();
        },
        error: err => console.error('Error adding location:', err)
      });
    }
  }

  private updateLocationFromDialog(id: number, formData: any) {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  this.http.put(`${apiBase}/api/locations/${id}`, formData, { headers }).subscribe({
        next: () => {
          this.refresh();
        },
        error: err => console.error('Error updating location:', err)
      });
    }
  }
  deleteLocation(id: number) {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  this.http.delete(`${apiBase}/api/locations/${id}`, { headers }).subscribe({
        next: () => {
          this.refresh();
        },
        error: err => console.error('Error deleting location:', err)
      });
    }
  }
}
