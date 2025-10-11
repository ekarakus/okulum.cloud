import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { apiBase } from './runtime-config';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private http: HttpClient) {}

  private authHeaders(token?: string) {
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
  }

  list(token?: string) { return this.http.get(`${apiBase}/api/permissions`, { headers: this.authHeaders(token) as any }); }
  get(id: any, token?: string) { return this.http.get(`${apiBase}/api/permissions/${id}`, { headers: this.authHeaders(token) as any }); }
  create(body: any, token?: string) { return this.http.post(`${apiBase}/api/permissions`, body, { headers: this.authHeaders(token) as any }); }
  update(id: any, body: any, token?: string) { return this.http.put(`${apiBase}/api/permissions/${id}`, body, { headers: this.authHeaders(token) as any }); }
  remove(id: any, token?: string) { return this.http.delete(`${apiBase}/api/permissions/${id}`, { headers: this.authHeaders(token) as any }); }
}
