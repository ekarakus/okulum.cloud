import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { apiBase } from '../runtime-config';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SchoolEmployeeService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers() {
    const token = this.auth.getToken();
    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
  }

  listBySchool(schoolId: number) { return this.http.get<any[]>(`${apiBase}/api/school-employees/school/${schoolId}`, { headers: this.headers() as any }); }
  get(id: number) { return this.http.get<any>(`${apiBase}/api/school-employees/${id}`, { headers: this.headers() as any }); }
  create(payload: any) { return this.http.post(`${apiBase}/api/school-employees`, payload, { headers: this.headers() as any }); }
  update(id: number, payload: any) { return this.http.put(`${apiBase}/api/school-employees/${id}`, payload, { headers: this.headers() as any }); }
  remove(id: number) { return this.http.delete(`${apiBase}/api/school-employees/${id}`, { headers: this.headers() as any }); }
}
