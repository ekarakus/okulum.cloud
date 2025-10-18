import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { apiBase } from '../runtime-config';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ObservanceService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  importStandardObservances(schoolId: number, year?: number) {
    const body: any = {};
    if (year) body.year = year;
    const token = this.auth.getToken();
    const options = token ? { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) } : {};
    return this.http.post(`${apiBase}/api/schools/${schoolId}/observances/import-from-json`, body, options as any);
  }

  // placeholder to fetch existing observances for a school
  getObservances(schoolId: number) {
    const token = this.auth.getToken();
    const options = token ? { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) } : {};
    return this.http.get(`${apiBase}/api/schools/${schoolId}/observances`, options as any);
  }

  // list with pagination
  list(schoolId: number, page = 1, pageSize = 10, sortBy = 'start_date', sortDir: 'asc'|'desc' = 'asc', source_year?: number, search?: string) {
    const token = this.auth.getToken();
    const headers = token ? { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) } : {};
    const q: any = { page, pageSize, sortBy, sortDir };
    if (source_year) q.source_year = source_year;
    if (search) q.search = search;
    const qs = Object.keys(q).map(k=>`${encodeURIComponent(k)}=${encodeURIComponent(q[k])}`).join('&');
    return this.http.get(`${apiBase}/api/schools/${schoolId}/observances?${qs}`, headers as any);
  }

  createObservance(schoolId: number, payload: any) {
    const token = this.auth.getToken();
    const options = token ? { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) } : {};
    return this.http.post(`${apiBase}/api/schools/${schoolId}/observances`, payload, options as any);
  }

  updateObservance(schoolId: number, id: number, payload: any) {
    const token = this.auth.getToken();
    const options = token ? { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) } : {};
    return this.http.put(`${apiBase}/api/schools/${schoolId}/observances/${id}`, payload, options as any);
  }

  deleteObservance(schoolId: number, id: number) {
    const token = this.auth.getToken();
    const options = token ? { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) } : {};
    return this.http.delete(`${apiBase}/api/schools/${schoolId}/observances/${id}`, options as any);
  }

  bulkDeleteObservances(schoolId: number, ids: number[]) {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
    return this.http.post(`${apiBase}/api/schools/${schoolId}/observances/bulk-delete`, { ids }, { headers });
  }
}
