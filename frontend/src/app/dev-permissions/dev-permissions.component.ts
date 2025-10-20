import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { apiBase } from '../runtime-config';

@Component({
  selector: 'app-dev-permissions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding:16px">
      <h3>Dev: Current user permissions</h3>
      <div *ngIf="loading">Yükleniyor...</div>
      <div *ngIf="!loading && error" style="color:crimson">{{error}}</div>
      <ul *ngIf="!loading && permissions.length>0">
        <li *ngFor="let p of permissions">{{p.name}}</li>
      </ul>
      <div *ngIf="!loading && permissions.length===0">(Hiç yetki yok)</div>
    </div>
  `
})
export class DevPermissionsComponent implements OnInit {
  permissions: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private auth: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser() as any;
    if (!user) { this.error = 'No current user'; return; }
    this.load(user.id);
  }

  private getAuthHeaders(): HttpHeaders | undefined {
    const token = this.auth.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
  }

  private load(userId: number) {
    this.loading = true;
    this.http.get(`${apiBase}/api/users/${userId}/permissions`, { headers: this.getAuthHeaders() as any }).subscribe({
      next: (res: any) => { this.permissions = res.permissions || []; this.loading = false; },
      error: (err) => { this.error = err?.error?.message || err.message || String(err); this.loading = false; }
    });
  }
}
