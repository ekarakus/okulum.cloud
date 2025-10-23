import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class MockApiService {
  // Default API base - configurable via window.__API_BASE__ if needed
  private base = (window as any).__API_BASE__ || 'http://localhost:3000/api';
  constructor(private http: HttpClient) {}

  // Notifications: use announcements as primary notifications
  async getNotifications(): Promise<any[]> {
    return this.http.get<any[]>(`${this.base}/announcements`).toPromise();
  }

  async getAnnouncements(): Promise<any[]> {
    return this.http.get<any[]>(`${this.base}/announcements`).toPromise();
  }

  // School time table (may accept school_id query param in real API)
  async getSchedule(school_id?: number): Promise<any> {
    const params = school_id ? new HttpParams().set('school_id', String(school_id)) : undefined;
    return this.http.get<any>(`${this.base}/school-time-table`, { params }).toPromise();
  }

  // Duty schedule
  async getDuty(school_id?: number, shift?: string|number): Promise<any> {
    // call public duty schedule route
    const params = school_id ? new HttpParams().set('shift', String(shift || 1)) : undefined;
    const id = school_id ? String(school_id) : '';
    return this.http.get<any>(`${this.base}/public/duty-schedule/${encodeURIComponent(id)}`, { params }).toPromise();
  }

  // Students list; supports optional school_id
  async getStudents(school_id?: number): Promise<any[]> {
    if (!school_id) return this.http.get<any[]>(`${this.base}/students`).toPromise();
    return this.http.get<any[]>(`${this.base}/public/students/school/${encodeURIComponent(String(school_id))}`).toPromise();
  }
  async getSchool(school_id: number): Promise<any> {
    return this.http.get<any>(`${this.base}/public/schools/id/${encodeURIComponent(String(school_id))}`).toPromise();
  }

  // Resolve school by code using the new public endpoint
  async getSchoolByCode(code: string): Promise<any> {
    if (!code) return Promise.reject(new Error('code is required'));
    return this.http.get<any>(`${this.base}/public/schools/by-code/${encodeURIComponent(code)}`).toPromise();
  }
}
