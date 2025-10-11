import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { isPlatformBrowser } from '@angular/common';
import { apiBase } from '../runtime-config';
import { Router } from '@angular/router';
import { PermissionAddEditDialogComponent } from '../permission-add-edit-dialog/permission-add-edit-dialog.component';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-permission-list',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTableModule, MatDialogModule, MatIconModule, MatMenuModule, MatTooltipModule],
  host: { 'ngSkipHydration': '' },
  template: `
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <button mat-icon-button (click)="goToDashboard()" matTooltip="Dashboard'a Dön" class="back-btn">
            <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
          </button>
          <h1>
            <mat-icon fontSet="material-symbols-outlined">security</mat-icon>
            Yetki Yönetimi
          </h1>
        </div>
        <button mat-raised-button color="primary" (click)="openAddDialog()" class="add-btn">
          <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
          Yeni Yetki Ekle
        </button>
      </div>

      <!-- Permissions Table -->
      <mat-card class="table-card">
        <div class="table-header">
          <h2>
            <mat-icon fontSet="material-symbols-outlined">format_list_bulleted</mat-icon>
            Yetki Listesi
          </h2>
        </div>
        <div class="table-container">
          <table mat-table [dataSource]="permissions" class="permissions-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Yetki Adı</th>
              <td mat-cell *matCellDef="let p">{{p.name}}</td>
            </ng-container>
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Açıklama</th>
              <td mat-cell *matCellDef="let p">{{p.description || '-'}}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>İşlemler</th>
              <td mat-cell *matCellDef="let p">
                <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="İşlemler menüsü">
                  <span class="material-symbols-outlined">more_vert</span>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="edit(p)">
                    <span class="material-symbols-outlined">edit</span>
                    <span>Düzenle</span>
                  </button>
                  <button mat-menu-item (click)="remove(p)" style="color: #f44336;">
                    <span class="material-symbols-outlined">delete</span>
                    <span>Sil</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['name','description','actions']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['name','description','actions'];"></tr>
          </table>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .header h1 { margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.8rem; font-weight: 600; color: #2c3e50; }
    .header h1 mat-icon { font-size: 2rem; width: 2rem; height: 2rem; color: #1976d2; }

    .table-card { border-radius: 12px; overflow: hidden; }
    .table-header { padding: 1.5rem; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; }
    .table-header h2 { margin: 0; font-size: 1.2rem; font-weight: 600; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem; }
    .table-container { overflow-x: auto; }
    .permissions-table { width: 100%; }

    .back-btn { background-color: #f8f9fa; color: #1976d2; border: 2px solid #e3f2fd; transition: all 0.3s ease; }
    .back-btn:hover { background-color: #e3f2fd; transform: scale(1.05); }
    .back-btn mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }

    .add-btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); border: none; box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3); transition: all 0.3s ease; }
    .add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4); }
    .add-btn mat-icon { font-size: 1.2rem; width: 1.2rem; height: 1.2rem; margin-right: 0.5rem; }

    @media (max-width: 768px) { .container { padding: 1rem; } .header { flex-direction: column; gap: 1rem; align-items: stretch; } .table-container { font-size: 0.9rem; } }
  `]
})
export class PermissionListComponent implements OnInit {
  permissions: any[] = [];

  constructor(private http: HttpClient, private dialog: MatDialog, private cdr: ChangeDetectorRef, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  goToDashboard() { this.router.navigate(['/dashboard']); }

  private getToken(): string | null { if (isPlatformBrowser(this.platformId)) return localStorage.getItem('token'); return null; }

  ngOnInit() { this.load(); }

  load() {
    const token = this.getToken();
    if (!token) return;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>(`${apiBase}/api/permissions`, { headers }).subscribe({ next: d => { this.permissions = d; this.cdr.detectChanges(); }, error: e => console.error('Error loading permissions', e) });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(PermissionAddEditDialogComponent, {
      width: '400px',
      data: { permission: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const token = this.getToken();
        if (!token) return;
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http.post(`${apiBase}/api/permissions`, result, { headers }).subscribe({
          next: () => this.load(),
          error: e => alert('Hata: ' + (e?.error?.error || e?.message || e))
        });
      }
    });
  }

  edit(p: any) {
    const dialogRef = this.dialog.open(PermissionAddEditDialogComponent, {
      width: '400px',
      data: { permission: p }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const token = this.getToken();
        if (!token) return;
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http.put(`${apiBase}/api/permissions/${p.id}`, result, { headers }).subscribe({
          next: () => this.load(),
          error: e => alert('Hata: ' + (e?.error?.error || e?.message || e))
        });
      }
    });
  }

  remove(p: any) {
    if (!confirm(`"${p.name}" yetkisini silmek istiyor musunuz?`)) return;
    const token = this.getToken(); if (!token) return;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.delete(`${apiBase}/api/permissions/${p.id}`, { headers }).subscribe({ next: () => this.load(), error: e => alert('Hata: ' + (e?.error?.error || e?.message || e)) });
  }
}
