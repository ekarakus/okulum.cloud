import { Component, OnInit, AfterViewInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { apiBase } from '../runtime-config';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { OperationTypeAddEditDialogComponent } from '../operation-type-add-edit-dialog/operation-type-add-edit-dialog.component';

@Component({
  selector: 'app-operation-type-list',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTableModule, MatDialogModule, MatIconModule, MatMenuModule],
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
            <mat-icon fontSet="material-symbols-outlined">list_alt</mat-icon>
            İşlem Türü Yönetimi
          </h1>
        </div>
        <button mat-raised-button color="primary" (click)="openAddDialog()" class="add-btn">
          <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
          Yeni İşlem Türü Ekle
        </button>
      </div>

      <!-- Operation Types Table -->
      <mat-card class="table-card">
        <div class="table-header">
          <h2>
            <mat-icon fontSet="material-symbols-outlined">format_list_bulleted</mat-icon>
            İşlem Türü Listesi
          </h2>
        </div>
        <div class="table-container">
          <table mat-table [dataSource]="pagedOperationTypes" class="op-types-table">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef (click)="onHeaderClick('name')" style="cursor:pointer">İşlem Türü Adı
            <mat-icon *ngIf="sort.field==='name'" style="vertical-align: middle; font-size: 16px; margin-left:6px">{{ sort.dir==='asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          </th>
          <td mat-cell *matCellDef="let element">{{element.name}}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>İşlemler</th>
          <td mat-cell *matCellDef="let element">
            <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="İşlemler menüsü">
              <span class="material-symbols-outlined">more_vert</span>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="editOperationType(element)">
                <span class="material-symbols-outlined">edit</span>
                <span>Düzenle</span>
              </button>
              <button mat-menu-item (click)="deleteOperationType(element)" style="color: #f44336;">
                <span class="material-symbols-outlined">delete</span>
                <span>Sil</span>
              </button>
            </mat-menu>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        </div>

        <!-- Pagination Controls -->
        <div class="pagination-controls">
          <button mat-button (click)="prevPage()" [disabled]="pageIndex === 0">Önceki</button>
          <span>Sayfa {{pageIndex + 1}} / {{totalPages}}</span>
          <button mat-button (click)="nextPage()" [disabled]="pageIndex === totalPages - 1">Sonraki</button>
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
    .op-types-table { width: 100%; }

    .back-btn { background-color: #f8f9fa; color: #1976d2; border: 2px solid #e3f2fd; transition: all 0.3s ease; }
    .back-btn:hover { background-color: #e3f2fd; transform: scale(1.05); }
    .back-btn mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }

    .add-btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); border: none; box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3); transition: all 0.3s ease; }
    .add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4); }
    .add-btn mat-icon { font-size: 1.2rem; width: 1.2rem; height: 1.2rem; margin-right: 0.5rem; }

    .pagination-controls { display: flex; justify-content: center; align-items: center; gap: 1rem; padding: 1rem 0; }
    .pagination-controls button { min-width: 100px; }
    .pagination-controls span { font-size: 1rem; color: #34495e; }

    @media (max-width: 768px) { .container { padding: 1rem; } .header { flex-direction: column; gap: 1rem; align-items: stretch; } .table-container { font-size: 0.9rem; } }
  `]
})
export class OperationTypeListComponent implements OnInit, AfterViewInit {
  operationTypes: any[] = [];
  // Sorting
  sort: { field: string | null, dir: 'asc' | 'desc' } = { field: null, dir: 'asc' };
  displayedColumns: string[] = ['name', 'actions'];
  // Pagination
  pagedOperationTypes: any[] = [];
  pageIndex = 0;
  pageSize = 20;
  totalPages = 0;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  private getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  ngOnInit() {
    this.refresh();
  }

  ngAfterViewInit() {
    setTimeout(() => this.refresh(), 0);
  }

  refresh() {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  this.http.get<any[]>(`${apiBase}/api/operation-types`, { headers }).subscribe({
        next: data => {
          this.operationTypes = data;
          this.pageIndex = 0;
          this.loadSortFromStorage();
          this.applySort();
          this.updatePagedData();
          this.cdr.detectChanges();
        },
        error: err => console.error('Error loading operation types:', err)
      });
    }
  }

  private updatePagedData() {
    this.totalPages = Math.max(1, Math.ceil(this.operationTypes.length / this.pageSize));
    const start = this.pageIndex * this.pageSize;
    this.pagedOperationTypes = this.operationTypes.slice(start, start + this.pageSize);
  }

  onHeaderClick(field: string) {
    if (this.sort.field === field) {
      this.sort.dir = this.sort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sort.field = field;
      this.sort.dir = 'asc';
    }
    this.saveSortToStorage();
    this.applySort();
    this.pageIndex = 0;
    this.updatePagedData();
  }

  private storageKey() {
    return isPlatformBrowser(this.platformId) ? `operationTypes_sort` : 'operationTypes_sort';
  }

  private saveSortToStorage() {
    if (!isPlatformBrowser(this.platformId)) return;
    try { localStorage.setItem(this.storageKey(), JSON.stringify(this.sort)); } catch (e) {}
  }

  private loadSortFromStorage() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const raw = localStorage.getItem(this.storageKey()); if (!raw) return;
      const s = JSON.parse(raw); if (s) { this.sort.field = s.field || null; this.sort.dir = s.dir === 'desc' ? 'desc' : 'asc'; }
    } catch (e) {}
  }

  private applySort() {
    if (!this.sort.field) return;
    const field = this.sort.field;
    const dir = this.sort.dir === 'asc' ? 1 : -1;
    this.operationTypes.sort((a: any, b: any) => {
      const va = (a[field] ?? '').toString();
      const vb = (b[field] ?? '').toString();
      const na = parseFloat(va.replace(/[^0-9.-]+/g, ''));
      const nb = parseFloat(vb.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
      return va.localeCompare(vb, undefined, { numeric: true }) * dir;
    });
  }

  nextPage() {
    if (this.pageIndex < this.totalPages - 1) {
      this.pageIndex++;
      this.updatePagedData();
    }
  }

  prevPage() {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.updatePagedData();
    }
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(OperationTypeAddEditDialogComponent, {
      width: '400px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addOperationTypeFromDialog(result);
      }
    });
  }

  editOperationType(operationType: any) {
    const dialogRef = this.dialog.open(OperationTypeAddEditDialogComponent, {
      width: '400px',
      data: { operationType }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateOperationTypeFromDialog(operationType.id, result);
      }
    });
  }

  private addOperationTypeFromDialog(formData: any) {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  this.http.post(`${apiBase}/api/operation-types`, formData, { headers }).subscribe({
        next: () => {
          this.refresh();
        },
        error: err => console.error('Error adding operation type:', err)
      });
    }
  }

  private updateOperationTypeFromDialog(id: number, formData: any) {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  this.http.put(`${apiBase}/api/operation-types/${id}`, formData, { headers }).subscribe({
        next: () => {
          this.refresh();
        },
        error: err => console.error('Error updating operation type:', err)
      });
    }
  }

  deleteOperationType(operationType: any) {
    if (confirm(`"${operationType.name}" işlem türünü silmek istediğinizden emin misiniz?`)) {
      const token = this.getToken();
      if (token) {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  this.http.delete(`${apiBase}/api/operation-types/${operationType.id}`, { headers }).subscribe({
          next: () => {
            this.refresh();
          },
          error: err => console.error('Error deleting operation type:', err)
        });
      }
    }
  }
}
