import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { EmployeeTypeDialogComponent } from '../employee-type-dialog/employee-type-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { EmployeeTypeService } from '../services/employee-type.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-employee-type-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, MatTooltipModule, MatDividerModule],
  styles: [
    `.container { padding:1.5rem; max-width:1200px; margin:0 auto; }
     .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
     .header-left { display:flex; align-items:center; gap:0.75rem }
     .header h1 { margin:0; display:flex; align-items:center; gap:0.5rem; font-size:1.5rem; }
     .table-card { border-radius:12px; padding: 0.5rem 1rem 1rem; }
     .types-table { width:100%; border-collapse: collapse }
     .types-table th, .types-table td { padding: 8px 12px; border-bottom: 1px solid #eee }
     .empty-state { text-align:center; padding:2rem; color:#666 }
    `
  ],
  template: `
    <div class="container">
      <div class="header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()" matTooltip="Geri" class="back-btn">
            <svg class="icon icon-back" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
            </svg>
          </button>
          <h1>
            <svg class="icon icon-category" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
            </svg>
            Personel Tipleri
          </h1>
        </div>
        <div>
          <button mat-stroked-button color="primary" (click)="add()">
            <svg class="icon icon-add" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
            </svg>
            Yeni Tip Ekle
          </button>
        </div>
      </div>

      <mat-card class="table-card">
        <div *ngIf="types && types.length>0; else emptyState">
          <table mat-table [dataSource]="types" class="types-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Ad</th>
              <td mat-cell *matCellDef="let t">{{ t.name }}</td>
            </ng-container>
            <ng-container matColumnDef="flags">
              <th mat-header-cell *matHeaderCellDef>Tip Bilgisi</th>
              <td mat-cell *matCellDef="let t">{{ t.is_teacher ? 'Öğretmen' : (t.is_principal ? 'Müdür' : (t.is_vice_principal ? 'Müdür Y.' : '-')) }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>İşlem</th>
              <td mat-cell *matCellDef="let t">
                <button mat-button (click)="edit(t)">Düzenle</button>
                <button mat-button color="warn" (click)="remove(t)">Sil</button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="['name','flags','actions']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['name','flags','actions']"></tr>
          </table>
        </div>
        <ng-template #emptyState>
          <div class="empty-state">
            <mat-icon style="font-size:48px;">category</mat-icon>
            <h3>Henüz tip eklenmemiş</h3>
            <p>Yeni personel tipi ekleyin.</p>
          </div>
        </ng-template>
      </mat-card>
    </div>
  `
})
export class EmployeeTypePageComponent implements OnInit {
  types: any[] = [];
  constructor(private svc: EmployeeTypeService, private router: Router, private snack: MatSnackBar, private dialog: MatDialog, private auth: AuthService, @Inject(PLATFORM_ID) private platformId: Object, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    const token = this.getToken();
    if (!token) return;
    this.load();
  }
  private getToken(): string | null { if (isPlatformBrowser(this.platformId)) return localStorage.getItem('token'); return null; }
  load() { this.svc.list().subscribe({ next: r => { this.types = r || []; this.cdr.detectChanges(); }, error: e => console.error(e) }); }
  goBack() { this.router.navigate(['/school-employees']); }
  add() {
    const ref = this.dialog.open(EmployeeTypeDialogComponent, { width: '520px', data: {} });
    ref.afterClosed().subscribe((r: any) => { if (r && r.saved) { this.load(); this.snack.open('Eklendi','Kapat',{duration:1500}); } });
  }

  edit(t: any) {
    const ref = this.dialog.open(EmployeeTypeDialogComponent, { width: '520px', data: { type: t } });
    ref.afterClosed().subscribe((r: any) => { if (r && r.saved) { this.load(); this.snack.open('Güncellendi','Kapat',{duration:1500}); } });
  }

  remove(t: any) { if (!confirm('Silmek istediğinize emin misiniz?')) return; this.svc.remove(t.id).subscribe({ next: () => { this.load(); this.snack.open('Silindi','Kapat',{duration:1500}); } }); }
}
