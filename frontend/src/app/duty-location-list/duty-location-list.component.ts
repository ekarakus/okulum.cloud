import { Component, OnInit, AfterViewInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { apiBase } from '../runtime-config';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { DutyLocationAddEditDialogComponent } from '../duty-location-add-edit-dialog/duty-location-add-edit-dialog.component';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-duty-location-list',
  imports: [CommonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule, ReactiveFormsModule, MatIconModule],
  host: { 'ngSkipHydration': '' },
  template: `
    <div class="container">
      <div class="header">
        <div class="header-left">
          <button mat-icon-button (click)="goToDashboard()" matTooltip="Dashboard'a Dön" class="back-btn">
            <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
          </button>
          <h1>
            <mat-icon fontSet="material-symbols-outlined">place</mat-icon>
            Nöbet Yerleri
          </h1>
        </div>
        <div style="display:flex; gap:8px; align-items:center">
          <button mat-raised-button color="primary" (click)="openAddDialog()" class="add-btn" [disabled]="!selectedSchool">
            <mat-icon fontSet="material-symbols-outlined">add_location</mat-icon>
            Yeni Nöbet Yeri Ekle
          </button>
          <button mat-stroked-button color="primary" (click)="openRoster()" [disabled]="!selectedSchool">
            <mat-icon fontSet="material-symbols-outlined">table_chart</mat-icon>
            Nöbetçi Tablosu
          </button>
        </div>
      </div>

      <mat-card class="table-card">
        <div class="table-header">
          <h2>
            <mat-icon fontSet="material-symbols-outlined">format_list_bulleted</mat-icon>
            Nöbet Yeri Listesi
          </h2>
        </div>
        <div class="table-container">
          <table style="width:100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd; width:64px">Sıra</th>
                <th style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd;">Ad</th>
                <th style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd;">Açıklama</th>
                <th style="padding: 4px 12px; text-align: left; border-bottom: 1px solid #ddd;">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="items.length === 0">
                <td colspan="4" style="padding: 20px; text-align: center; color: #666;">Henüz nöbet yeri bulunmuyor.</td>
              </tr>
              <tr *ngFor="let l of pagedItems" style="border-bottom: 1px solid #eee;">
                <td style="padding: 4px 12px; text-align: center;">{{l.order ?? 0}}</td>
                <td style="padding: 4px 12px;">{{l.name}}</td>
                <td style="padding: 4px 12px;">{{l.description}}</td>
                <td style="padding: 4px 12px;">
                  <button mat-button color="accent" (click)="openEditDialog(l)" style="margin-right: 5px;">
                    <span class="material-symbols-outlined" style="margin-right: 0.3rem; font-size: 18px;">edit</span>
                    Düzenle
                  </button>
                  <button mat-button color="warn" (click)="deleteItem(l)">
                    <span class="material-symbols-outlined" style="margin-right: 0.3rem; font-size: 18px;">delete</span>
                    Sil
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-controls">
          <button mat-button (click)="prevPage()" [disabled]="pageIndex === 0">
            <mat-icon fontSet="material-symbols-outlined">chevron_left</mat-icon>
            Önceki
          </button>
          <span class="page-info">Sayfa {{pageIndex + 1}} / {{totalPages}}</span>
          <button mat-button (click)="nextPage()" [disabled]="pageIndex === totalPages - 1">
            Sonraki
            <mat-icon fontSet="material-symbols-outlined">chevron_right</mat-icon>
          </button>
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

    .back-btn { background-color: #f8f9fa; color: #1976d2; border: 2px solid #e3f2fd; transition: all 0.3s ease; }
    .back-btn:hover { background-color: #e3f2fd; transform: scale(1.05); }
    .back-btn mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }

    .add-btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); border: none; box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3); transition: all 0.3s ease; }
    .add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4); }
    .add-btn mat-icon { font-size: 1.2rem; width: 1.2rem; height: 1.2rem; margin-right: 0.5rem; }

    .pagination-controls { display: flex; justify-content: center; align-items: center; padding: 1rem 0; gap: 1rem; }
    .page-info { font-size: 0.9rem; color: #666; }

    @media (max-width: 768px) { .container { padding: 1rem; } .header { flex-direction: column; gap: 1rem; align-items: stretch; } .table-container { font-size: 0.9rem; } }
  `]
})
export class DutyLocationListComponent implements OnInit, AfterViewInit {
  items: any[] = [];
  pagedItems: any[] = [];
  selectedSchool: any = null;
  pageIndex = 0;
  pageSize = 20;
  totalPages = 1;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  goToDashboard() { this.router.navigate(['/dashboard']); }

  private getToken(): string | null { if (isPlatformBrowser(this.platformId)) return localStorage.getItem('token'); return null; }

  ngOnInit() {
    this.authService.selectedSchool$.subscribe(school => {
      this.selectedSchool = school;
      if (!school) { this.items = []; return; }
      this.refresh();
    });
  }

  ngAfterViewInit() {}

  refresh() {
    const token = this.getToken();
    if (!token) return;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let url = `${apiBase}/api/duty_locations`;
    if (this.selectedSchool) url += `?school_id=${this.selectedSchool.id}`;
    this.http.get<any[]>(url, { headers }).subscribe({ next: data => { this.items = data; this.pageIndex = 0; this.updatePagedData(); this.cdr.detectChanges(); }, error: err => console.error('Error loading duty locations:', err) });
  }

  private updatePagedData() { this.totalPages = Math.max(1, Math.ceil(this.items.length / this.pageSize)); const start = this.pageIndex * this.pageSize; this.pagedItems = this.items.slice(start, start + this.pageSize); }
  nextPage() { if (this.pageIndex < this.totalPages - 1) { this.pageIndex++; this.updatePagedData(); } }
  prevPage() { if (this.pageIndex > 0) { this.pageIndex--; this.updatePagedData(); } }

  openAddDialog() {
  const dialogRef = this.dialog.open(DutyLocationAddEditDialogComponent, { width: '400px', data: {} });
    dialogRef.afterClosed().subscribe(result => { if (result) this.addFromDialog(result); });
  }

  openEditDialog(item: any) {
  const dialogRef = this.dialog.open(DutyLocationAddEditDialogComponent, { width: '400px', data: { location: item } });
    dialogRef.afterClosed().subscribe(result => { if (result) this.updateFromDialog(item.id, result); });
  }

  private addFromDialog(formData: any) {
    const token = this.getToken(); if (!token) return; const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const payload = { ...formData, school_id: this.selectedSchool?.id };
    this.http.post(`${apiBase}/api/duty_locations`, payload, { headers }).subscribe({ next: () => this.refresh(), error: err => console.error('Error adding duty location:', err) });
  }

  private updateFromDialog(id: number, formData: any) {
    const token = this.getToken(); if (!token) return; const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.put(`${apiBase}/api/duty_locations/${id}`, formData, { headers }).subscribe({ next: () => this.refresh(), error: err => console.error('Error updating duty location:', err) });
  }

  deleteItem(item: any) {
    if (!confirm(`"${item.name}" adlı nöbet yerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) return;
    const token = this.getToken(); if (!token) return; const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.delete(`${apiBase}/api/duty_locations/${item.id}`, { headers }).subscribe({ next: () => this.refresh(), error: err => console.error('Error deleting duty location:', err) });
  }

  openRoster() {
    if (!this.selectedSchool) return;
    this.router.navigate(['/duty-roster']);
  }
}
