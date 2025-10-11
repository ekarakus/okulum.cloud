import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription, combineLatest, of } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';
import { AuthService, User, School } from '../services/auth.service';
import { apiBase } from '../runtime-config';
import { UserDialogComponent, UserDialogData } from '../user-dialog/user-dialog.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatMenuModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()" matTooltip="Dashboard'a Dön" class="back-btn">
            <svg class="icon icon-back" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
            </svg>
          </button>
          <h1>
            <svg class="icon icon-manage" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/>
            </svg>
            Kullanıcı Yönetimi
          </h1>
        </div>
        <button mat-raised-button color="primary" (click)="openUserDialog()" class="add-btn">
          <svg class="icon icon-add-person" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M15 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9 8v-1c0-2.21 3.58-4 8-4s8 1.79 8 4v1H6zM3 11v2H1v-2H0v-2h1V7h2v2h1v2H3z" fill="currentColor"/>
          </svg>
          Yeni Kullanıcı Ekle
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-section">
        <mat-card class="stat-card total-users">
          <div class="stat-content">
            <div class="stat-icon">
              <svg class="icon" width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zM8 13c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zM16 13c-0.29 0-0.62.02-0.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/>
              </svg>
            </div>
            <div class="stat-text">
              <div class="stat-number">{{ users.length }}</div>
              <div class="stat-label">Toplam Kullanıcı</div>
            </div>
          </div>
        </mat-card>
        <mat-card class="stat-card active-users">
          <div class="stat-content">
            <div class="stat-icon">
              <svg class="icon" width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-4.5 2.5l-3.5 3.5L6 17.5 4.59 19 10 24.41 20.91 13.5 19.5 12l-7 7z" fill="currentColor"/>
              </svg>
            </div>
            <div class="stat-text">
              <div class="stat-number">{{ getActiveUserCount() }}</div>
              <div class="stat-label">Aktif Kullanıcı</div>
            </div>
          </div>
        </mat-card>
        <mat-card class="stat-card inactive-users">
          <div class="stat-content">
            <div class="stat-icon">
              <svg class="icon" width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM12 12c-2.67 0-8 1.34-8 4v2h8v-6zM20.49 20.49L18.08 18.08 20.5 15.66 18.9 14.06 16.48 16.48 14.06 14.06 12.64 15.48 15.06 17.9 12.64 20.32 14.06 21.74 16.48 19.32 18.9 21.74 20.5 20.14z" fill="currentColor"/>
              </svg>
            </div>
            <div class="stat-text">
              <div class="stat-number">{{ users.length - getActiveUserCount() }}</div>
              <div class="stat-label">Pasif Kullanıcı</div>
            </div>
          </div>
        </mat-card>
      </div>

      <!-- Users Table -->
      <mat-card class="table-card">
        <div class="table-header">
          <h2>
            <svg class="icon icon-list" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M7 11H21v2H7v-2zM7 5h14v2H7V5zM7 17h14v2H7v-2zM3 6.5A1.5 1.5 0 1 0 3 3.5 1.5 1.5 0 0 0 3 6.5zM3 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM3 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="currentColor"/>
            </svg>
            Kullanıcı Listesi
          </h2>
          <!-- Filtreleme ve Okul Seçici Eklenebilir -->
        </div>

          <div *ngIf="isLoading" class="loading-state">
          <svg class="loading-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5 0 1.1-.3 2.13-.82 3.02l1.45 1.45C19.87 16.04 20.5 14.06 20.5 12c0-4.14-3.36-7.5-7.5-7.5zM6.82 4.98C5.13 6.4 4.13 8.08 3.68 9.96L2.23 8.51C2.82 6.87 4.07 5.46 5.65 4.48L6.82 4.98z" fill="currentColor"/>
          </svg>
          <p>Kullanıcı bilgileri yükleniyor...</p>
        </div>

        <div class="table-container" *ngIf="!isLoading && users.length > 0; else emptyState">
          <table mat-table [dataSource]="pagedUsers" class="users-table">

            <!-- User Info Column -->
            <ng-container matColumnDef="user">
              <th mat-header-cell *matHeaderCellDef (click)="onHeaderClick('name')" style="cursor:pointer; padding:4px 12px">Kullanıcı
                <mat-icon *ngIf="sort.field==='name'" style="vertical-align: middle; font-size: 14px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <td mat-cell *matCellDef="let user">
                <div class="user-info">
                  <div class="user-name">{{ user.name }}</div>
                  <div class="user-email">{{ user.email }}</div>
                </div>
              </td>
            </ng-container>

            <!-- Role Column -->
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef (click)="onHeaderClick('role')" style="cursor:pointer; padding:4px 12px">Sistem Rolü
                <mat-icon *ngIf="sort.field==='role'" style="vertical-align: middle; font-size: 14px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </th>
              <td mat-cell *matCellDef="let user">
                <span class="role-chip" [ngClass]="'role-' + user.role">{{ getRoleDisplayName(user.role) }}</span>
              </td>
            </ng-container>

            <!-- Schools Column -->
            <ng-container matColumnDef="schools">
              <th mat-header-cell *matHeaderCellDef style="padding:4px 12px">Atanan Okullar</th>
              <td mat-cell *matCellDef="let user" style="padding:4px 12px">
                <div class="school-chips" *ngIf="user.schools && user.schools.length > 0; else noSchool">
                  <span *ngFor="let school of user.schools" class="school-chip">
                    {{ school.name }}
                  </span>
                </div>
                <ng-template #noSchool>
                  <span class="no-assignment">Okul atanmamış</span>
                </ng-template>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef style="padding:4px 12px">Durum</th>
              <td mat-cell *matCellDef="let user" style="padding:4px 12px">
                <mat-slide-toggle
                  [checked]="user.is_active"
                  (change)="toggleUserStatus(user)"
                  [matTooltip]="user.is_active ? 'Kullanıcıyı pasif yap' : 'Kullanıcıyı aktif yap'">
                  {{ user.is_active ? 'Aktif' : 'Pasif' }}
                </mat-slide-toggle>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef style="padding:4px 12px">İşlemler</th>
              <td mat-cell *matCellDef="let user" style="padding:4px 12px">
                <button mat-icon-button [matMenuTriggerFor]="actionMenu">
                  <svg class="icon icon-more" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" fill="currentColor"/>
                  </svg>
                </button>
                <mat-menu #actionMenu="matMenu">
                  <button mat-menu-item (click)="openUserDialog(user)">
                    <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor"/>
                    </svg>
                    <span>Bilgileri Düzenle</span>
                  </button>
                  <button mat-menu-item (click)="openPasswordDialog(user)">
                    <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M12 17a2 2 0 11.001-3.999A2 2 0 0112 17zm6-6h-1V9a5 5 0 10-10 0v2H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2zM8 9a4 4 0 118 0v2H8V9z" fill="currentColor"/>
                    </svg>
                    <span>Şifre Değiştir</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="deleteUser(user)" class="delete-action">
                    <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                    </svg>
                    <span>Kullanıcıyı Sil</span>
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
              <svg class="icon" width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zM8 13c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zM16 13c-0.29 0-0.62.02-0.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Henüz hiç kullanıcı eklenmemiş</h3>
            <p>Sistemi kullanacak kişileri ekleyerek başlayın.</p>
            <button mat-raised-button color="primary" (click)="openUserDialog()" class="empty-action-btn">
              <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9 8v-1c0-2.21 3.58-4 8-4s8 1.79 8 4v1H6zM3 11v2H1v-2H0v-2h1V7h2v2h1v2H3z" fill="currentColor"/>
              </svg>
              İlk Kullanıcıyı Ekle
            </button>
          </div>
        </ng-template>

        <!-- Pagination Controls -->
        <div class="pagination-controls" *ngIf="!isLoading && totalPages > 1">
          <button mat-icon-button (click)="prevPage()" [disabled]="pageIndex === 0">
            <svg class="icon icon-chevron-left" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
            </svg>
          </button>
          <span class="page-info">Sayfa {{ pageIndex + 1 }} / {{ totalPages }}</span>
          <button mat-icon-button (click)="nextPage()" [disabled]="pageIndex === totalPages - 1">
            <svg class="icon icon-chevron-right" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 1.5rem;
    }
  .container { max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .header h1 { margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.8rem; font-weight: 600; }
    .stats-section { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { padding: 1.5rem; border-radius: 12px; }
    .stat-content { display: flex; align-items: center; gap: 1rem; }
    .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .stat-icon mat-icon { font-size: 2rem; }
    .stat-number { font-size: 1.8rem; font-weight: 700; }
    .stat-label { font-size: 0.9rem; color: #666; }
    .total-users .stat-icon { background: #e3f2fd; color: #1e88e5; }
    .active-users .stat-icon { background: #e8f5e9; color: #43a047; }
    .inactive-users .stat-icon { background: #ffebee; color: #e53935; }
    .table-card { border-radius: 12px; overflow: hidden; }
    .table-header { padding: 1rem 1.5rem; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; }
    .table-header h2 { margin: 0; font-size: 1.2rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
    .loading-state, .empty-state { text-align: center; padding: 3rem; color: #666; }
    .loading-icon { font-size: 2.5rem; animation: spin 1.5s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .empty-icon { font-size: 3.5rem; width: 80px; height: 80px; background: #f5f5f5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
    .users-table { width: 100%; }
    .user-info { display: flex; flex-direction: column; }
    .user-name { font-weight: 500; }
    .user-email { font-size: 0.85rem; color: #666; }
    .role-chip { padding: 0.25rem 0.75rem; border-radius: 16px; font-size: 0.8rem; font-weight: 500; color: white; }
    .role-super_admin { background-color: #e53935; }
    .role-admin { background-color: #1e88e5; }
  /* Removed technician and user roles */
    .school-chips { display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .school-chip { padding: 0.2rem 0.6rem; border-radius: 8px; background-color: #eee; font-size: 0.8rem; }
    .no-assignment { color: #999; font-style: italic; font-size: 0.85rem; }
    .delete-action { color: #f44336 !important; }

    /* Align header back button and add button styles with Schools page */
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

    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .page-info {
      font-size: 0.9rem;
      color: #333;
    }
  `]
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  // Sorting
  sort: { field: string | null, dir: 'asc' | 'desc' } = { field: null, dir: 'asc' };
  displayedColumns: string[] = ['user', 'role', 'schools', 'status', 'actions'];
  isLoading = false;
  private subscriptions = new Subscription();
  // Pagination
  pagedUsers: User[] = [];
  pageIndex = 0;
  pageSize = 20;
  totalPages = 0;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1. URL'den gelen school_id'yi dinle ve AuthService'teki okulu güncelle
    const routeSub = this.route.queryParamMap.pipe(
      switchMap(params => {
        const schoolId = params.get('school_id');
        if (schoolId) {
          // Okul listesini al ve ID'ye göre okulu bul
          return this.authService.getAllSchools().pipe(
            take(1), // Sadece bir kez al
            tap(allSchools => {
              const schoolToSelect = allSchools.find(s => s.id === +schoolId);
              if (schoolToSelect) {
                // URL'den gelen ID ile seçili okulu değiştir
                this.authService.setSelectedSchool(schoolToSelect);
              }
            })
          );
        }
        return of(null); // URL'de ID yoksa bir şey yapma
      })
    ).subscribe();
    this.subscriptions.add(routeSub);

    // 2. AuthService'teki seçili okul değişikliklerini dinle ve listeyi yenile
    const schoolSub = this.authService.selectedSchool$.subscribe(selectedSchool => {
      this.loadUsers(selectedSchool);
    });
    this.subscriptions.add(schoolSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadUsers(selectedSchool: School | null): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    let request$;

    // Eğer bir okul seçiliyse (URL'den veya arayüzden), o okula göre filtrele
    if (selectedSchool) {
  request$ = this.http.get<User[]>(`${apiBase}/api/users/school/${selectedSchool.id}`, { headers });
    }
    // Okul seçili değilse ve kullanıcı süper admin ise, tüm kullanıcıları getir
    else if (this.authService.isSuperAdmin()) {
  request$ = this.http.get<User[]>(`${apiBase}/api/users`, { headers });
    }
    // Okul seçili değilse ve normal admin ise, listeyi boşalt (veya birincil okulunu getir)
    else {
      this.users = [];
      this.isLoading = false;
      this.cdr.markForCheck();
      this.showError('Lütfen bir okul seçin.');
      return;
    }

    const userSub = request$.subscribe({
      next: (users) => {
        this.users = users;
        this.pageIndex = 0;
        this.loadSortFromStorage();
        this.applySort();
        this.updatePagedData();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.showError('Kullanıcılar yüklenirken bir hata oluştu.');
        this.cdr.markForCheck();
      }
    });
    this.subscriptions.add(userSub);
  }

  private updatePagedData() {
    this.totalPages = Math.max(1, Math.ceil(this.users.length / this.pageSize));
    const start = this.pageIndex * this.pageSize;
    this.pagedUsers = this.users.slice(start, start + this.pageSize);
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
    const school = this.authService.getSelectedSchool();
    return school ? `users_sort_${school.id}` : 'users_sort';
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
    const field = this.sort.field as keyof User;
    const dir = this.sort.dir === 'asc' ? 1 : -1;
    this.users.sort((a: any, b: any) => {
      const va = (a[field] ?? '').toString();
      const vb = (b[field] ?? '').toString();
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

  getActiveUserCount(): number {
    return this.users.filter(u => u.is_active).length;
  }

  getRoleDisplayName(role: string): string {
    const roles: { [key: string]: string } = {
      super_admin: 'Süper Admin',
      admin: 'Okul Yöneticisi'
    };
    return roles[role] || role;
  }

  toggleUserStatus(user: User): void {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const newStatus = !user.is_active;

  this.http.put(`${apiBase}/api/users/${user.id}/toggle-status`, {}, { headers })
      .subscribe({
        next: () => {
          user.is_active = newStatus;
          this.showSuccess(`Kullanıcı durumu güncellendi: ${newStatus ? 'Aktif' : 'Pasif'}`);
          this.cdr.markForCheck();
        },
        error: () => {
          this.showError('Kullanıcı durumu güncellenirken bir hata oluştu.');
          // Toggle'ı geri al
          user.is_active = !newStatus;
          this.cdr.markForCheck();
        }
      });
  }

  openUserDialog(user?: User): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: {
        mode: user ? 'edit' : 'add',
        user: user ? { ...user } : null
      } as UserDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Mevcut seçili okula göre listeyi yenile
        this.loadUsers(this.authService.getSelectedSchool());
      }
    });
  }

  openPasswordDialog(user: User): void {
    const newPassword = prompt(`"${user.name}" için yeni şifreyi girin:`);
    if (newPassword && newPassword.length >= 6) {
      const token = this.authService.getToken();
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  this.http.put(`${apiBase}/api/users/${user.id}/password`, { password: newPassword }, { headers })
        .subscribe({
          next: () => this.showSuccess('Şifre başarıyla güncellendi.'),
          error: () => this.showError('Şifre güncellenirken bir hata oluştu.')
        });
    } else if (newPassword) {
      this.showError('Şifre en az 6 karakter olmalıdır.');
    }
  }

  deleteUser(user: User): void {
    if (confirm(`"${user.name}" adlı kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      const token = this.authService.getToken();
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  this.http.delete(`${apiBase}/api/users/${user.id}`, { headers })
        .subscribe({
          next: () => {
            this.showSuccess('Kullanıcı başarıyla silindi.');
            this.loadUsers(this.authService.getSelectedSchool());
          },
          error: () => this.showError('Kullanıcı silinirken bir hata oluştu.')
        });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Kapat', { duration: 3000, panelClass: 'success-snackbar' });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Kapat', { duration: 5000, panelClass: 'error-snackbar' });
  }
}
