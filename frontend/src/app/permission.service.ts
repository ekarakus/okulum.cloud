import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { apiBase } from './runtime-config';
import { AuthService } from './services/auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private authHeaders(token?: string) {
    const t = token || this.auth.getToken();
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : undefined;
  }

  list(token?: string) { return this.http.get(`${apiBase}/api/permissions`, { headers: this.authHeaders(token) as any }); }
  get(id: any, token?: string) { return this.http.get(`${apiBase}/api/permissions/${id}`, { headers: this.authHeaders(token) as any }); }
  create(body: any, token?: string) { return this.http.post(`${apiBase}/api/permissions`, body, { headers: this.authHeaders(token) as any }); }
  update(id: any, body: any, token?: string) { return this.http.put(`${apiBase}/api/permissions/${id}`, body, { headers: this.authHeaders(token) as any }); }
  remove(id: any, token?: string) { return this.http.delete(`${apiBase}/api/permissions/${id}`, { headers: this.authHeaders(token) as any }); }
  // User-permissions per user_schools id
  getAssignedForUserSchool(userSchoolsId: number, token?: string) { return this.http.get(`${apiBase}/api/user-permissions/${userSchoolsId}`, { headers: this.authHeaders(token) as any }); }
  replaceAssignedForUserSchool(userSchoolsId: number, permissionIds: number[], token?: string) { return this.http.put(`${apiBase}/api/user-permissions/${userSchoolsId}`, { permission_ids: permissionIds }, { headers: this.authHeaders(token) as any }); }
}
