import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, ReplaySubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { apiBase } from '../runtime-config';
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
  return this.http.post<LoginResponse>(`${apiBase}/api/auth/login`, { email, password })
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
    // Some clients provide the token under 'credential' instead of 'id_token'.
    // Send both to maximize compatibility with backend expectations.
    const payload: any = { id_token };
    try { payload.credential = id_token; } catch(e) {}
  return this.http.post<LoginResponse>(`${apiBase}/api/auth/google`, payload)
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
  return this.http.get<School[]>(`${apiBase}/api/schools`, { headers });
  }

  private setAuthState(token: string, user: User): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Backend'den gelebilecek tutarsız 'Schools' propertysini 'schools'a normalize et
    // Ayrıca backend farklı şekillerde izin döndürebilir (array, object map, farklı ad).
    // Burada permissions alanını tutarlı bir dizi (string[]) haline getiriyoruz.
    const rawPermissions: any = (user as any).permissions || (user as any).Permissions || (user as any).permissions_obj || (user as any).PermissionsMap || (user as any).perms || (user as any).permission;
    let normalizedPermissions: string[] = [];
    if (Array.isArray(rawPermissions)) {
      normalizedPermissions = rawPermissions.map((p: any) => (p && typeof p === 'object') ? (p.name || p.permission || p.key || p.slug || p.label || JSON.stringify(p)) : String(p));
    } else if (rawPermissions && typeof rawPermissions === 'object') {
      // object map: { 'Personel Yönetimi': true }
      try {
        normalizedPermissions = Object.keys(rawPermissions).filter(k => !!(rawPermissions as any)[k]);
      } catch (e) { normalizedPermissions = []; }
    } else if (typeof rawPermissions === 'string') {
      // comma separated
      normalizedPermissions = rawPermissions.split(',').map(s => s.trim()).filter(Boolean);
    }

    const normalizedUser = { ...user, schools: user.schools || (user as any).Schools || [], permissions: normalizedPermissions } as any;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    this.currentUserSubject.next(normalizedUser);

    // Debug: help diagnose missing permissions/selectedSchool in development
    try {
      // eslint-disable-next-line no-console
      console.debug('Auth.setAuthState normalizedUser:', normalizedUser);
    } catch (e) {}

    // Oturum açıldığında ilk okulu otomatik seç
    // IMPORTANT: use the normalizedUser.schools (not the raw `user`) so casing/field
    // differences from the backend (e.g. `Schools`) won't break selection.
    const schoolsForSelection = (normalizedUser as any).schools || [];
    if (normalizedUser.role !== 'super_admin' && Array.isArray(schoolsForSelection) && schoolsForSelection.length > 0) {
      this.setSelectedSchool(schoolsForSelection[0]);
    } else {
      this.setSelectedSchool(null); // Süper admin için veya okul yoksa null yap
    }

    // Fallback: if no top-level permissions found, try to extract from first school
    // or from common per-school maps. This handles backends that only store
    // permissions per-school.
    try {
      if ((!normalizedUser.permissions || normalizedUser.permissions.length === 0) && Array.isArray(schoolsForSelection) && schoolsForSelection.length > 0) {
        const firstSchool = schoolsForSelection[0] as any;
        let fallback: string[] = [];
        if (Array.isArray(firstSchool.permissions) && firstSchool.permissions.length > 0) {
          fallback = firstSchool.permissions.map((p: any) => (p && typeof p === 'object') ? (p.name || p.permission || p.label || JSON.stringify(p)) : String(p));
        } else if (firstSchool.assignment && Array.isArray(firstSchool.assignment.permissions) && firstSchool.assignment.permissions.length > 0) {
          fallback = firstSchool.assignment.permissions.map((p: any) => (p && typeof p === 'object') ? (p.name || p.permission || p.label || JSON.stringify(p)) : String(p));
        } else {
          // try map on user: permissions_by_school or similar
          const bySchool = (user as any).permissions_by_school || (user as any).permissionsBySchool || (user as any).school_permissions || (user as any).permissions_map_by_school;
          if (bySchool && typeof bySchool === 'object') {
            const entry = bySchool[firstSchool.id] || bySchool[String(firstSchool.id)];
            if (Array.isArray(entry)) {
              fallback = entry.map((p: any) => String(p));
            } else if (entry && typeof entry === 'object') {
              fallback = Object.keys(entry).filter(k => !!entry[k]);
            }
          }
        }

        if (fallback && fallback.length > 0) {
          normalizedUser.permissions = Array.from(new Set(fallback));
          localStorage.setItem('user', JSON.stringify(normalizedUser));
          this.currentUserSubject.next(normalizedUser);
          try { console.debug('Auth.setAuthState applied fallback school permissions', { fallback }); } catch(e) {}
        }
      }
    } catch(e) {
      // ignore fallback errors
    }

    // If still no permissions, call backend consolidated endpoint to fetch them
    try {
      if ((!normalizedUser.permissions || normalizedUser.permissions.length === 0) && token) {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        // non-blocking request; ensure we update localStorage/currentUserSubject when response arrives
        this.http.get(`${apiBase}/api/users/${normalizedUser.id}/permissions`, { headers }).subscribe({
          next: (res: any) => {
            try {
              const perms = Array.isArray(res?.permissions) ? res.permissions.map((p: any) => String(p.name || p)) : [];
              if (perms.length > 0) {
                normalizedUser.permissions = Array.from(new Set(perms));
                localStorage.setItem('user', JSON.stringify(normalizedUser));
                this.currentUserSubject.next(normalizedUser);
                try { console.debug('Auth.setAuthState fetched consolidated permissions', { perms }); } catch(e){}
              }
            } catch(e) { /* ignore */ }
          },
          error: (err) => { /* ignore fetch errors in auth setup */ }
        });
      }
    } catch(e) {}
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
        const parsed: any = JSON.parse(userJson);
        // Ensure permissions field exists and is normalized similar to setAuthState
        const rawPermissions: any = parsed.permissions || parsed.Permissions || parsed.permissions_obj || parsed.PermissionsMap || parsed.perms || parsed.permission;
        let normalizedPermissions: string[] = [];
        if (Array.isArray(rawPermissions)) {
          normalizedPermissions = rawPermissions.map((p: any) => (p && typeof p === 'object') ? (p.name || p.permission || p.key || p.slug || p.label || JSON.stringify(p)) : String(p));
        } else if (rawPermissions && typeof rawPermissions === 'object') {
          try { normalizedPermissions = Object.keys(rawPermissions).filter(k => !!rawPermissions[k]); } catch(e){ normalizedPermissions = []; }
        } else if (typeof rawPermissions === 'string') {
          normalizedPermissions = rawPermissions.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        parsed.permissions = normalizedPermissions;
        const user: User = parsed;
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
        // Fallback on load: if permissions empty, try to populate from first school
        try {
          if ((!parsed.permissions || parsed.permissions.length === 0) && Array.isArray(parsed.schools) && parsed.schools.length > 0) {
            const firstSchool: any = parsed.schools[0];
            let fallback: string[] = [];
            if (Array.isArray(firstSchool.permissions) && firstSchool.permissions.length > 0) {
              fallback = firstSchool.permissions.map((p: any) => (p && typeof p === 'object') ? (p.name || p.permission || p.label || JSON.stringify(p)) : String(p));
            } else if (firstSchool.assignment && Array.isArray(firstSchool.assignment.permissions) && firstSchool.assignment.permissions.length > 0) {
              fallback = firstSchool.assignment.permissions.map((p: any) => (p && typeof p === 'object') ? (p.name || p.permission || p.label || JSON.stringify(p)) : String(p));
            } else {
              const bySchool = parsed.permissions_by_school || parsed.permissionsBySchool || parsed.school_permissions || parsed.permissions_map_by_school;
              if (bySchool && typeof bySchool === 'object') {
                const entry = bySchool[firstSchool.id] || bySchool[String(firstSchool.id)];
                if (Array.isArray(entry)) {
                  fallback = entry.map((p: any) => String(p));
                } else if (entry && typeof entry === 'object') {
                  fallback = Object.keys(entry).filter(k => !!entry[k]);
                }
              }
            }

            if (fallback && fallback.length > 0) {
              parsed.permissions = Array.from(new Set(fallback));
              localStorage.setItem('user', JSON.stringify(parsed));
              this.currentUserSubject.next(parsed);
              try { console.debug('Auth.loadInitialState applied fallback school permissions', { fallback }); } catch(e) {}
            }
          }
        } catch(e) {}

            // If still empty, attempt to fetch consolidated permissions from the server
            try {
              if ((!parsed.permissions || parsed.permissions.length === 0) && token) {
                const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
                this.http.get(`${apiBase}/api/users/${parsed.id}/permissions`, { headers }).subscribe({
                  next: (res: any) => {
                    try {
                      const perms = Array.isArray(res?.permissions) ? res.permissions.map((p: any) => String(p.name || p)) : [];
                      if (perms.length > 0) {
                        parsed.permissions = Array.from(new Set(perms));
                        localStorage.setItem('user', JSON.stringify(parsed));
                        this.currentUserSubject.next(parsed);
                        try { console.debug('Auth.loadInitialState fetched consolidated permissions', { perms }); } catch(e){}
                      }
                    } catch(e) {}
                  }, error: () => {}
                });
              }
            } catch(e) {}
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
        this.clearAuthState();
      }
    }
  }
}
