import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';
import { SchoolDialogComponent, SchoolDialogData } from '../school-dialog/school-dialog.component';

interface School {
  id: number;
  name: string;
  code: string;
  created_at: string;
  userCount?: number;
  deviceCount?: number;
}

@Component({
  selector: 'app-school-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()" matTooltip="Dashboard'a Dön" class="back-btn">
            <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
          </button>
          <h1>
            <mat-icon fontSet="material-symbols-outlined">domain</mat-icon>
            Okul Yönetimi
          </h1>
        </div>
        <button mat-raised-button color="primary" (click)="openAddDialog()" class="add-btn">
          <mat-icon fontSet="material-symbols-outlined">add_business</mat-icon>
          Yeni Okul Ekle
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-section">
        <mat-card class="stat-card schools">
          <div class="stat-content">
            <div class="stat-icon">
              <mat-icon fontSet="material-symbols-outlined">school</mat-icon>
            </div>
            <div class="stat-text">
              <div class="stat-number">{{ schools.length }}</div>
              <div class="stat-label">Kayıtlı Okul</div>
            </div>
          </div>
        </mat-card>

        <mat-card class="stat-card users">
          <div class="stat-content">
            <div class="stat-icon">
              <mat-icon fontSet="material-symbols-outlined">groups</mat-icon>
            </div>
            <div class="stat-text">
              <div class="stat-number">{{ getTotalUsers() }}</div>
              <div class="stat-label">Toplam Kullanıcı</div>
            </div>
          </div>
        </mat-card>

        <mat-card class="stat-card devices">
          <div class="stat-content">
            <div class="stat-icon">
              <mat-icon fontSet="material-symbols-outlined">computer</mat-icon>
            </div>
            <div class="stat-text">
              <div class="stat-number">{{ getTotalDevices() }}</div>
              <div class="stat-label">Toplam Cihaz</div>
            </div>
          </div>
        </mat-card>
      </div>

      <!-- Schools Table -->
      <mat-card class="table-card">
        <div class="table-header">
          <h2>
            <mat-icon fontSet="material-symbols-outlined">format_list_bulleted</mat-icon>
            Okul Listesi
          </h2>
          <div *ngIf="isLoading" class="header-loading">
            <mat-icon class="loading-icon" fontSet="material-symbols-outlined">autorenew</mat-icon>
            Yükleniyor...
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="loading-state">
          <mat-icon class="loading-icon" fontSet="material-symbols-outlined">cached</mat-icon>
          <p>Okul bilgileri yükleniyor...</p>
        </div>

        <!-- Schools List -->
        <div class="table-container" *ngIf="!isLoading && schools.length > 0; else emptyState">
          <table mat-table [dataSource]="schools" class="schools-table">
            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef (click)="onHeaderClick('name')" style="cursor:pointer; padding:4px 12px">Okul Adı
                <mat-icon *ngIf="sort.field==='name'" style="vertical-align: middle; font-size: 14px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <td mat-cell *matCellDef="let school" style="padding:4px 12px">
                <div class="school-info">
                  <div class="school-name">{{ school.name }}</div>
                  <div class="school-code">Kod: {{ school.code }}</div>
                </div>
              </td>
            </ng-container>

            <!-- Stats Column -->
            <ng-container matColumnDef="stats">
              <th mat-header-cell *matHeaderCellDef style="padding:4px 12px">İstatistikler</th>
              <td mat-cell *matCellDef="let school" style="padding:4px 12px">
                <div class="stats-chips">
                  <div class="chip users">
                    <mat-icon fontSet="material-symbols-outlined">person</mat-icon>
                    {{ school.userCount || 0 }} kullanıcı
                  </div>
                  <div class="chip devices">
                    <mat-icon fontSet="material-symbols-outlined">laptop</mat-icon>
                    {{ school.deviceCount || 0 }} cihaz
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Created Date Column -->
            <ng-container matColumnDef="created">
              <th mat-header-cell *matHeaderCellDef (click)="onHeaderClick('created_at')" style="cursor:pointer; padding:4px 12px">Oluşturulma
                <mat-icon *ngIf="sort.field==='created_at'" style="vertical-align: middle; font-size: 14px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <td mat-cell *matCellDef="let school" style="padding:4px 12px">
                {{ formatDate(school.created_at) }}
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef style="padding:4px 12px">İşlemler</th>
              <td mat-cell *matCellDef="let school" style="padding:4px 12px">
                <button mat-icon-button [matMenuTriggerFor]="actionMenu">
                  <mat-icon fontSet="material-symbols-outlined">more_vert</mat-icon>
                </button>
                <mat-menu #actionMenu="matMenu">
                  <button mat-menu-item (click)="editSchool(school)">
                    <mat-icon color="primary" fontSet="material-symbols-outlined">edit_square</mat-icon>
                    <span>Bilgileri Düzenle</span>
                  </button>
                  <button mat-menu-item (click)="viewUsers(school)">
                    <mat-icon color="accent" fontSet="material-symbols-outlined">group</mat-icon>
                    <span>Kullanıcıları Görüntüle</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="deleteSchool(school)" class="delete-action">
                    <mat-icon color="warn" fontSet="material-symbols-outlined">delete_sweep</mat-icon>
                    <span>Okulu Sil</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>

        <ng-template #emptyState>
          <div class="empty-state" *ngIf="!isLoading">
            <div class="empty-icon">
              <mat-icon fontSet="material-symbols-outlined">domain_add</mat-icon>
            </div>
            <h3>Henüz hiç okul eklenmemiş</h3>
            <p>Sistem kullanımına başlamak için ilk okulu ekleyin.</p>
            <button mat-raised-button color="primary" (click)="openAddDialog()" class="empty-action-btn">
              <mat-icon fontSet="material-symbols-outlined">add_business</mat-icon>
              İlk Okulu Oluştur
            </button>
          </div>
        </ng-template>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-center {
      flex: 1;
      display: flex;
      justify-content: center;
      max-width: 400px;
    }

    .school-selector {
      width: 100%;
      min-width: 250px;
    }

    .school-option {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.5rem 0;
    }

    .school-name {
      font-weight: 500;
      color: #2c3e50;
    }

    .school-code {
      font-size: 0.85rem;
      color: #666;
    }

    .header h1 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.8rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .header h1 mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: #1976d2;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      padding: 1.5rem;
      border-radius: 12px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .stat-card.schools .stat-icon {
      background: #e3f2fd;
      color: #1976d2;
    }

    .stat-card.users .stat-icon {
      background: #e8f5e8;
      color: #4caf50;
    }

    .stat-card.devices .stat-icon {
      background: #fff3e0;
      color: #ff9800;
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .stat-icon mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    .stat-text {
      flex: 1;
    }

    .stat-number {
      font-size: 1.8rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #666;
    }

    .table-card {
      border-radius: 12px;
      overflow: hidden;
    }

    .table-header {
      padding: 1.5rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .table-header h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .header-loading {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #666;
      font-size: 0.9rem;
    }

    .table-container {
      overflow-x: auto;
    }

    .schools-table {
      width: 100%;
    }

    .school-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .school-name {
      font-weight: 500;
      color: #2c3e50;
    }

    .school-code {
      font-size: 0.85rem;
      color: #666;
    }

    .stats-chips {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .chip {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      background: #f5f5f5;
    }

    .chip.users {
      color: #4caf50;
    }

    .chip.devices {
      color: #ff9800;
    }

    .chip mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .loading-state mat-icon,
    .loading-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: #667eea;
      animation: spin 2s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-icon mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: #1976d2;
    }

    .empty-state h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      font-weight: 600;
    }

    .empty-state p {
      margin-bottom: 2rem;
      font-size: 1rem;
      line-height: 1.5;
    }

    .empty-action-btn {
      padding: 0.75rem 2rem;
      border-radius: 8px;
    }

    .back-btn {
      background-color: #f8f9fa;
      color: #1976d2;
      border: 2px solid #e3f2fd;
      transition: all 0.3s ease;
    }

    .back-btn:hover {
      background-color: #e3f2fd;
      transform: scale(1.05);
    }

    .back-btn mat-icon {
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
    }

    .add-btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
      border: none;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
      transition: all 0.3s ease;
    }

    .add-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
    }

    .add-btn mat-icon {
      font-size: 1.2rem;
      width: 1.2rem;
      height: 1.2rem;
      margin-right: 0.5rem;
    }

    .delete-action {
      color: #f44336 !important;
    }

    .delete-action mat-icon {
      color: #f44336 !important;
    }

    /* Table enhancements */
    .mat-mdc-row:hover {
      background-color: #f8f9fa;
    }

    .mat-mdc-header-row {
      background-color: #fafafa;
    }

    .mat-mdc-header-cell {
      font-weight: 600;
      color: #2c3e50;
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .header-center {
        max-width: 100%;
        justify-content: stretch;
      }

      .school-selector {
        min-width: auto;
      }

      .stats-section {
        grid-template-columns: 1fr;
      }

      .table-container {
        font-size: 0.9rem;
      }
    }
  `]
})
export class SchoolListComponent implements OnInit, OnDestroy {
  schools: School[] = [];
  // Sorting
  sort: { field: string | null, dir: 'asc' | 'desc' } = { field: null, dir: 'asc' };
  displayedColumns: string[] = ['name', 'stats', 'created', 'actions'];
  isLoading = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const token = this.authService.getToken();

    // Direkt olarak token varsa okul listesini yükle
    if (token) {
      this.loadSchools();
    } else {
      // Token yoksa login sayfasına yönlendir
      this.router.navigate(['/login']);
    }

    // AuthService'in currentUser observable'ını dinle (gelecekteki değişiklikler için)
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        // Eğer user null olursa (logout durumu) login'e yönlendir
        if (!user && this.authService.getToken() === null) {
          this.router.navigate(['/login']);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }



  loadSchools(): void {
    const token = this.authService.getToken();

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<School[]>(`${environment.apiUrl}/api/schools`, { headers })
      .subscribe({
        next: (schools) => {
          this.schools = schools;
          this.loadSortFromStorage();
          this.applySort();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();

          let errorMessage = 'Okullar yüklenirken hata oluştu';
          if (error.status === 401) {
            errorMessage = 'Oturum süresi dolmuş, tekrar giriş yapın';
            this.authService.logout();
            this.router.navigate(['/login']);
          } else if (error.status === 403) {
            errorMessage = 'Bu işlem için yetkiniz bulunmamaktadır';
          }

          alert(errorMessage);
        }
      });
  }

  getTotalUsers(): number {
    return this.schools.reduce((total, school) => total + (school.userCount || 0), 0);
  }

  getTotalDevices(): number {
    return this.schools.reduce((total, school) => total + (school.deviceCount || 0), 0);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('tr-TR');
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(SchoolDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: { mode: 'add' } as SchoolDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveSchool(result);
      }
    });
  }

  editSchool(school: School): void {
    const dialogRef = this.dialog.open(SchoolDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: {
        mode: 'edit',
        school: {
          id: school.id,
          name: school.name,
          code: school.code
        }
      } as SchoolDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveSchool(result);
      }
    });
  }

  viewUsers(school: School): void {
    this.router.navigate(['/users'], { queryParams: { school_id: school.id } });
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
  }

  private storageKey() {
    return `schools_sort`;
  }

  private saveSortToStorage() {
    try { localStorage.setItem(this.storageKey(), JSON.stringify(this.sort)); } catch (e) {}
  }

  private loadSortFromStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey()); if (!raw) return;
      const s = JSON.parse(raw); if (s) { this.sort.field = s.field || null; this.sort.dir = s.dir === 'desc' ? 'desc' : 'asc'; }
    } catch (e) {}
  }

  private applySort() {
    if (!this.sort.field) return;
    const field = this.sort.field;
    const dir = this.sort.dir === 'asc' ? 1 : -1;
    this.schools.sort((a: any, b: any) => {
      const va = (a[field] ?? '').toString();
      const vb = (b[field] ?? '').toString();
      const na = parseFloat(va.replace(/[^0-9.-]+/g, ''));
      const nb = parseFloat(vb.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
      return va.localeCompare(vb, undefined, { numeric: true }) * dir;
    });
  }

  saveSchool(schoolData: any): void {
    const token = this.authService.getToken();
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    let request$;
    if (schoolData.id) {
      // Güncelleme
      request$ = this.http.put(`${environment.apiUrl}/api/schools/${schoolData.id}`, {
        name: schoolData.name,
        code: schoolData.code
      }, { headers });
    } else {
      // Yeni ekleme
      request$ = this.http.post(`${environment.apiUrl}/api/schools`, {
        name: schoolData.name,
        code: schoolData.code
      }, { headers });
    }

    request$.subscribe({
      next: (response) => {
        this.loadSchools(); // Listeyi yenile
        this.cdr.markForCheck();
      },
      error: (error) => {
        let errorMessage = 'Okul kaydedilirken hata oluştu';

        if (error.status === 409) {
          errorMessage = 'Bu okul kodu zaten kullanılıyor';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        alert(errorMessage);
      }
    });
  }

  deleteSchool(school: School): void {
    if (confirm(`"${school.name}" okulunu silmek istediğinizden emin misiniz?`)) {
      const token = this.authService.getToken();
      if (!token) return;

      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.delete(`${environment.apiUrl}/api/schools/${school.id}`, { headers })
        .subscribe({
          next: () => {
            this.loadSchools();
            this.cdr.markForCheck();
          },
          error: (error) => {
            alert('Okul silinirken hata oluştu');
          }
        });
    }
  }



  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
