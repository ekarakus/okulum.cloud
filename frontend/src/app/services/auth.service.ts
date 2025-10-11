import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, ReplaySubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

export interface School {
  id: number;
  name: string;
  code: string;
  assignment?: {
    // role_in_school kaldırıldı
    is_primary: boolean;
  };
}

// Tutarlı bir User arayüzü
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin';
  is_active: boolean;
  schools: School[]; // Her zaman 'schools' kullan
}

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private selectedSchool: School | null = null;
  private selectedSchoolSubject = new ReplaySubject<School | null>(1);
  public selectedSchool$ = this.selectedSchoolSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadInitialState();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, { email, password })
      .pipe(
        tap(response => {
          this.setAuthState(response.token, response.user);
        }),
        catchError(err => {
          // Hata durumunda state'i temizle
          this.clearAuthState();
          throw err;
        })
      );
  }

  // Login using Google id_token obtained from Google Identity Services
  loginWithGoogle(id_token: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/api/auth/google`, { id_token })
      .pipe(
        tap(response => {
          this.setAuthState(response.token, response.user);
        }),
        catchError(err => {
          this.clearAuthState();
          throw err;
        })
      );
  }

  logout(): void {
    this.clearAuthState();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.getValue();
  }

  isSuperAdmin(): boolean {
    return this.getCurrentUser()?.role === 'super_admin';
  }

  getSelectedSchool(): School | null {
    return this.selectedSchool;
  }

  setSelectedSchool(school: School | null): void {
    // Only emit when the selected school actually changes to avoid
    // triggering duplicate loads in subscribers when the same value
    // is set multiple times (for example during route handling).
    const prevId = this.selectedSchool?.id ?? null;
    const nextId = school?.id ?? null;
    if (prevId === nextId) return;

    this.selectedSchool = school;
    this.selectedSchoolSubject.next(school);
    if (isPlatformBrowser(this.platformId)) {
      if (school) {
        localStorage.setItem('selectedSchoolId', school.id.toString());
      } else {
        localStorage.removeItem('selectedSchoolId');
      }
    }
  }

  getAllSchools(): Observable<School[]> {
    const token = this.getToken();
    if (!token) {
      return of([]);
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<School[]>(`${environment.apiUrl}/api/schools`, { headers });
  }

  private setAuthState(token: string, user: User): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Backend'den gelebilecek tutarsız 'Schools' propertysini 'schools'a normalize et
    const normalizedUser = { ...user, schools: user.schools || (user as any).Schools || [] };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    this.currentUserSubject.next(normalizedUser);

    // Oturum açıldığında ilk okulu otomatik seç
    if (user.role !== 'super_admin' && user.schools && user.schools.length > 0) {
      this.setSelectedSchool(user.schools[0]);
    } else {
      this.setSelectedSchool(null); // Süper admin için veya okul yoksa null yap
    }
  }

  private clearAuthState(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('selectedSchoolId');
    }
    this.currentUserSubject.next(null);
    this.selectedSchoolSubject.next(null);
  }

  private loadInitialState(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = this.getToken();
    const userJson = localStorage.getItem('user');

    if (token && userJson) {
      try {
        const user: User = JSON.parse(userJson);
        this.currentUserSubject.next(user);

        const selectedSchoolId = localStorage.getItem('selectedSchoolId');
        if (selectedSchoolId) {
          const schoolList = user.role === 'super_admin' ? [] : user.schools;
          const school = schoolList.find(s => s.id === +selectedSchoolId);
          if (school) {
            this.setSelectedSchool(school);
          } else if (user.role !== 'super_admin' && user.schools && user.schools.length > 0) {
            // Eğer kayıtlı okul ID'si kullanıcının okulları arasında yoksa ilk okulu seç
            this.setSelectedSchool(user.schools[0]);
          }
        } else if (user.role !== 'super_admin' && user.schools && user.schools.length > 0) {
          // Hiç seçili okul yoksa ilkini seç
          this.setSelectedSchool(user.schools[0]);
        }
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
        this.clearAuthState();
      }
    }
  }
}
