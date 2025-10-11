import { Component, OnInit, AfterViewInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { TechnicianAddEditDialogComponent } from '../technician-add-edit-dialog/technician-add-edit-dialog.component';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-technician-list',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatDialogModule, MatIconModule],
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
            <mat-icon fontSet="material-symbols-outlined">engineering</mat-icon>
            Teknisyen Yönetimi
          </h1>
        </div>
        <div *ngIf="getToken(); else noAuth">
          <button mat-raised-button color="primary" (click)="openAddDialog()" class="add-btn" [disabled]="!selectedSchool">
            <mat-icon fontSet="material-symbols-outlined">person_add</mat-icon>
            Yeni Teknisyen Ekle
          </button>
        </div>
        <ng-template #noAuth>
          <p style="color: #f44336; margin: 0;">Teknisyen listesini görmek için giriş yapmanız gerekir.</p>
        </ng-template>
      </div>

      <!-- Technicians Table -->
      <mat-card class="table-card">
        <div class="table-header">
          <h2>
            <mat-icon fontSet="material-symbols-outlined">format_list_bulleted</mat-icon>
            Teknisyen Listesi
          </h2>
        </div>
        <div class="table-container">
          <table style="width:100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                        <th (click)="onHeaderClick('name')" style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd; cursor:pointer">Ad
                  <mat-icon *ngIf="sort.field==='name'" style="vertical-align: middle; font-size: 14px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                        <th (click)="onHeaderClick('email')" style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd; cursor:pointer">E-posta
                  <mat-icon *ngIf="sort.field==='email'" style="vertical-align: middle; font-size: 14px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                        <th (click)="onHeaderClick('phone')" style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd; cursor:pointer">Telefon
                  <mat-icon *ngIf="sort.field==='phone'" style="vertical-align: middle; font-size: 14px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                        <th (click)="onHeaderClick('status')" style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd; cursor:pointer">Durum
                  <mat-icon *ngIf="sort.field==='status'" style="vertical-align: middle; font-size: 14px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                        <th style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd;">İşlem</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let technician of pagedTechnicians" style="border-bottom: 1px solid #eee;">
                        <td style="padding: 4px 12px;">{{technician.name}}</td>
                        <td style="padding: 4px 12px;">{{technician.email || '-'}} </td>
                        <td style="padding: 4px 12px;">{{technician.phone || '-'}} </td>
                        <td style="padding: 4px 12px;">
                  <span [style.color]="technician.status === 'active' ? 'green' : 'red'">
                    {{technician.status === 'active' ? 'Aktif' : 'Pasif'}}
                  </span>
                </td>
                    <td style="padding: 4px 12px;" *ngIf="getToken()">
                  <button mat-button color="accent" (click)="openEditDialog(technician)" style="margin-right: 5px;">
                    <span class="material-symbols-outlined" style="margin-right: 0.3rem; font-size: 18px;">edit</span>
                    Düzenle
                  </button>
                  <button mat-button color="warn" (click)="deleteTechnician(technician.id)">
                    <span class="material-symbols-outlined" style="margin-right: 0.3rem; font-size: 18px;">delete</span>
                    Sil
                  </button>
                </td>
              </tr>
              <tr *ngIf="technicians.length === 0 && getToken()">
                <td colspan="5" style="padding: 20px; text-align: center; color: #666;">
                  Henüz teknisyen bulunmuyor.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination Controls -->
        <div class="pagination-controls">
          <button mat-button (click)="prevPage()" [disabled]="pageIndex === 0">
            <mat-icon>chevron_left</mat-icon>
            Önceki
          </button>
          <span>Sayfa {{pageIndex + 1}} / {{totalPages}}</span>
          <button mat-button (click)="nextPage()" [disabled]="pageIndex === totalPages - 1">
            Sonraki
            <mat-icon>chevron_right</mat-icon>
          </button>
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

    .back-btn { background-color: #f8f9fa; color: #1976d2; border: 2px solid #e3f2fd; transition: all 0.3s ease; }
    .back-btn:hover { background-color: #e3f2fd; transform: scale(1.05); }
    .back-btn mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }

    .add-btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); border: none; box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3); transition: all 0.3s ease; }
    .add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4); }
    .add-btn mat-icon { font-size: 1.2rem; width: 1.2rem; height: 1.2rem; margin-right: 0.5rem; }

    .pagination-controls { padding: 1rem; display: flex; justify-content: center; align-items: center; gap: 1rem; border-top: 1px solid #e0e0e0; }
    .pagination-controls button { min-width: 120px; }
    .pagination-controls span { font-size: 1rem; color: #333; }

    @media (max-width: 768px) { .container { padding: 1rem; } .header { flex-direction: column; gap: 1rem; align-items: stretch; } .table-container { font-size: 0.9rem; } }
  `]
})
export class TechnicianListComponent implements OnInit, AfterViewInit {
  technicians: any[] = [];
  selectedSchool: any = null;
  // Sorting
  sort: { field: string | null, dir: 'asc' | 'desc' } = { field: null, dir: 'asc' };
  // Pagination
  pagedTechnicians: any[] = [];
  pageIndex = 0;
  pageSize = 20;
  totalPages = 0;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private authService: AuthService
  ) {}

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  ngOnInit() {
    // Seçili okulu dinle ve okul değiştiğinde verileri yenile
    this.authService.selectedSchool$.subscribe(school => {
      this.selectedSchool = school;

      // Okul seçili değilse veri yüklemeyi bekle
      if (!school) {
        this.technicians = [];
        return;
      }

      // Okul seçildiyse verileri yükle (süper admin dahil)
      this.loadTechnicians();
    });
  }

  ngAfterViewInit() {
    // Change detection için gerekli
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  private loadTechnicians() {
    const token = this.getToken();
    if (!token) {
      console.log('No token found, cannot load technicians');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Okul filtresi ekle - SÜPER ADMİN DAHİL HERKES SEÇİLİ OKULA GÖRE FİLTRELENECEK
    let url = `${environment.apiUrl}/api/technicians`;
    if (this.selectedSchool) {
      url += `?school_id=${this.selectedSchool.id}`;
    }

    this.http.get<any[]>(url, { headers }).subscribe({
      next: data => {
        this.technicians = data;
        this.pageIndex = 0;
        this.loadSortFromStorage();
        this.applySort();
        this.updatePagedData();
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error loading technicians:', err);
        if (err.status === 401) {
          console.log('Token invalid, cannot load technicians');
        }
      }
    });
  }

  private updatePagedData() {
    this.totalPages = Math.max(1, Math.ceil(this.technicians.length / this.pageSize));
    const start = this.pageIndex * this.pageSize;
    this.pagedTechnicians = this.technicians.slice(start, start + this.pageSize);
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
    return isPlatformBrowser(this.platformId) && this.selectedSchool ? `technicians_sort_${this.selectedSchool.id}` : 'technicians_sort';
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
    this.technicians.sort((a: any, b: any) => {
      const va = (a[field] ?? '').toString();
      const vb = (b[field] ?? '').toString();
      const na = parseFloat(va.replace(/[^0-9.-]+/g, ''));
      const nb = parseFloat(vb.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
      return va.localeCompare(vb, undefined, { numeric: true }) * dir;
    });
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
    const dialogRef = this.dialog.open(TechnicianAddEditDialogComponent, {
      width: '500px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addTechnicianFromDialog(result);
      }
    });
  }

  openEditDialog(technician: any) {
    const dialogRef = this.dialog.open(TechnicianAddEditDialogComponent, {
      width: '500px',
      data: { technician }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateTechnicianFromDialog(technician.id, result);
      }
    });
  }

  private addTechnicianFromDialog(formData: any) {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      // Seçili okul bilgisini payload'a ekle ki listeleme filtresine düşsün
      const payload = {
        ...formData,
        school_id: this.selectedSchool?.id
      };
      this.http.post(`${environment.apiUrl}/api/technicians`, payload, { headers }).subscribe({
        next: () => {
          this.loadTechnicians();
        },
        error: err => console.error('Error adding technician:', err)
      });
    }
  }

  private updateTechnicianFromDialog(id: number, formData: any) {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.put(`${environment.apiUrl}/api/technicians/${id}`, formData, { headers }).subscribe({
        next: () => {
          this.loadTechnicians();
        },
        error: err => console.error('Error updating technician:', err)
      });
    }
  }

  deleteTechnician(id: number) {
    if (confirm('Bu teknisyeni silmek istediğinizden emin misiniz?')) {
      const token = this.getToken();
      if (token) {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http.delete(`${environment.apiUrl}/api/technicians/${id}`, { headers }).subscribe({
          next: () => {
            this.loadTechnicians();
          },
          error: err => console.error('Error deleting technician:', err)
        });
      }
    }
  }
}
