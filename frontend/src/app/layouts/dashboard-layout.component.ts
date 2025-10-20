import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, Router, RouterLink, NavigationEnd, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService, User, School } from '../services/auth.service';
import { apiBase } from '../runtime-config';
import { ChangePasswordComponent } from '../change-password/change-password.component';
import { environment } from '../../environments/environment';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatMenuModule, MatTooltipModule, CommonModule, RouterLink, RouterLinkActive, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-layout">
      <mat-toolbar color="primary" class="toolbar-content">
        <div class="brand">
          <span class="material-symbols-outlined icon icon-school" aria-hidden="true">school</span>
          <span>
            {{ isSuperAdmin() ? 'okulum.cloud bilgi sistemi' : (selectedSchool?.name || 'okulum.cloud bilgi sistemi') }}
          </span>
        </div>
        <div class="toolbar-right" *ngIf="isLoggedIn()">
          <div class="nav-buttons">
            <button mat-button routerLink="/dashboard" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}">
              <svg class="icon icon-dashboard" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
              </svg>
              <span>Ana Sayfa</span>
            </button>

            <!-- Okul Seçici -->
            <div *ngIf="shouldShowSchoolSelector()" class="school-selector-toolbar">
              <mat-form-field appearance="outline">
                <mat-select [value]="getSelectedSchoolId()" (selectionChange)="onSchoolChange($event.value)">
                  <mat-option *ngFor="let school of getSchoolList()" [value]="school.id">
                    {{ school.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>
          <!-- Kullanıcı Butonu (Yuvarlak) -->
          <button class="user-circle" mat-button [matMenuTriggerFor]="userMenu" matTooltip="Kullanıcı Bilgileri">
            <span *ngIf="currentUser" class="initials">{{ getUserInitials() }}</span>
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="user-menu-header" *ngIf="currentUser">
              <div class="name">{{ currentUser.name }}</div>
              <div class="role">{{ currentUser.role }}</div>
            </div>
            <button mat-menu-item (click)="openChangePassword()">Şifre Değiştir</button>
            <!-- Çıkış burada olmayacak; sadece toolbar'daki tek buton kullanılacak -->
          </mat-menu>
          <button mat-button class="logout-btn" (click)="logout()" matTooltip="Çıkış Yap">
            <mat-icon fontSet="material-symbols-outlined" class="icon icon-logout" aria-hidden>logout</mat-icon>
            <span class="logout-text">Çıkış</span>
          </button>
        </div>
      </mat-toolbar>

      <div class="dashboard-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout { display: flex; flex-direction: column; height: 100vh; background-color: #f4f7f6; }
    mat-toolbar { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .toolbar-content { display: flex; align-items: center; justify-content: space-between; width: 100%; }
    .brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 500; }
  .toolbar-right { display:flex; align-items:center; gap:.75rem; }
  .nav-buttons { display: flex; align-items: center; gap: 0.5rem; margin-right:.5rem; }
  .user-circle { width:40px; height:40px; min-width:40px; padding:0; border-radius:50%; background:rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; }
  .user-circle:hover { background:rgba(255,255,255,0.25); }
  .user-circle .initials { font-weight:600; color:#fff; letter-spacing:.5px; }
  .user-menu-header { padding:.75rem 1rem; max-width:200px; }
  .user-menu-header .name { font-weight:600; font-size:14px; }
  .user-menu-header .role { font-size:11px; opacity:.75; }
  .logout-btn { display:flex; align-items:center; gap:.35rem; border-radius:20px; }
  .logout-btn .logout-text { font-weight:500; }
  /* Keep the logout icon visible on narrow screens; only hide the text label */
  @media (max-width: 900px) {
    .logout-btn .logout-text { display:none; }
    .logout-btn { min-width:40px; padding:0.35rem; }
    .logout-btn .icon-logout { width:18px; height:18px; }
  }
  /* On very small screens ensure toolbar right area doesn't collapse and the logout remains tappable */
  @media (max-width: 480px) {
    .toolbar-right { gap: 0.4rem; }
    .logout-btn { display:flex !important; background: rgba(255,255,255,0.06); }
    .logout-btn:hover { background: rgba(255,255,255,0.12); }
  }
    .nav-buttons button { display: flex; align-items: center; gap: 0.5rem; transition: background-color 0.3s ease; border-radius: 8px; padding: 0.5rem 1rem; }
    .nav-buttons button:hover { background-color: rgba(255, 255, 255, 0.1); }
    .nav-buttons .active-link { background-color: rgba(0, 0, 0, 0.15); font-weight: 500; }
    .school-selector-toolbar { margin: 0 1rem; }
    .school-selector-toolbar .mat-mdc-form-field { width: 220px; margin-top: 1.25rem; }
    .school-selector-toolbar ::ng-deep .mat-mdc-text-field-wrapper { background-color: rgba(255, 255, 255, 0.1) !important; border-radius: 8px; }
    .school-selector-toolbar ::ng-deep .mat-mdc-select-value,
    .school-selector-toolbar ::ng-deep .mat-mdc-select-arrow,
    .school-selector-toolbar ::ng-deep .mat-mdc-floating-label { color: white !important; }
    .school-selector-toolbar ::ng-deep .mat-mdc-form-field-outline-start,
    .school-selector-toolbar ::ng-deep .mat-mdc-form-field-outline-end,
    .school-selector-toolbar ::ng-deep .mat-mdc-form-field-outline-gap { border-color: rgba(255, 255, 255, 0.3) !important; }
    .dashboard-content { flex: 1; overflow-y: auto; }
    @media (max-width: 900px) {
      .nav-buttons button span:not(.material-symbols-outlined) { display: none; }
      .nav-buttons button { min-width: auto; padding: 0.5rem; }
      .brand span:not(.material-symbols-outlined) { display: none; }
    }
  `]
})
export class DashboardLayoutComponent implements OnInit {
  currentUser: User | null = null;
  selectedSchool: School | null = null;
  userSchools: School[] = [];
  allSchools: School[] = [];
  currentRoute: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.userSchools = user?.schools || [];
      if (this.isSuperAdmin()) {
        this.loadAllSchools();
      } else {
        this.autoSelectFirstSchoolIfNeeded();
      }
      this.cdr.markForCheck();
    });

    this.authService.selectedSchool$.subscribe(school => {
      this.selectedSchool = school;
      this.cdr.markForCheck();
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(event => {
      this.currentRoute = (event as NavigationEnd).urlAfterRedirects;
      this.cdr.markForCheck();
    });
  }

  isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  shouldShowSchoolSelector(): boolean {
    if (!this.isLoggedIn()) {
      return false;
    }
    // Süper yönetici için tüm okullar listesi, normal kullanıcı için kendi okulları
    const schoolList = this.isSuperAdmin() ? this.allSchools : this.userSchools;
    // Süper yönetici ise ve en az bir okul varsa veya normal kullanıcı ise ve birden fazla okulu varsa göster
    return (this.isSuperAdmin() && schoolList.length > 0) || (!this.isSuperAdmin() && schoolList.length > 1);
  }

  getSchoolList(): School[] {
    return this.isSuperAdmin() ? this.allSchools : this.userSchools;
  }

  getSelectedSchoolId(): number | null {
    return this.selectedSchool?.id || null;
  }

  onSchoolChange(schoolId: number): void {
    const school = this.getSchoolList().find(s => s.id === schoolId);
    if (school) {
      this.authService.setSelectedSchool(school);
      // Sayfanın yeniden yüklenmesini tetikleyerek verilerin güncellenmesini sağla
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([this.currentRoute]);
      });
    }
  }

  getUserInitials(): string {
    if (!this.currentUser || !this.currentUser.name) return '?';
    const parts = this.currentUser.name.trim().split(/\s+/).filter(p=>p.length>0);
    if (parts.length === 1) return parts[0].substring(0,2).toUpperCase();
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  }

  private loadAllSchools(): void {
    const token = this.authService.getToken();
    if (!token) return;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  this.http.get<School[]>(`${apiBase}/api/schools`, { headers }).subscribe(schools => {
      this.allSchools = schools;
      this.autoSelectFirstSchoolIfNeeded();
      this.cdr.markForCheck();
    });
  }

  openChangePassword(): void {
    if (!this.currentUser) return;
    const ref = this.dialog.open(ChangePasswordComponent, { width: '420px' });
    ref.afterClosed().subscribe(result => {
      // optionally handle result
    });
  }

  private autoSelectFirstSchoolIfNeeded(): void {
    const schoolList = this.getSchoolList();
    if (!this.selectedSchool && schoolList.length > 0) {
      this.authService.setSelectedSchool(schoolList[0]);
    }
  }
}
