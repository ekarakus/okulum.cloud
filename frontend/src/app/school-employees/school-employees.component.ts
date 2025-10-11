import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';
import { apiBase } from '../runtime-config';
import { SchoolEmployeeService } from '../services/school-employee.service';
import { SchoolEmployeeDialogComponent } from '../school-employee-dialog/school-employee-dialog.component';
import { EmployeeTypeListComponent } from '../employee-type-list/employee-type-list.component';

/* Styles (kept in component file since standalone) */
// Note: The project often defines styles inline in other list components; keep consistent small rules
const _styles = `
.container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
.header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; gap:1rem; }
.header-left { display:flex; align-items:center; gap:1rem; }
.header h1 { margin:0; display:flex; align-items:center; gap:0.5rem; font-size:1.6rem; font-weight:600; color:#2c3e50; }
.header-actions { display:flex; gap:0.5rem; align-items:center; }
.table-card { border-radius:12px; overflow:hidden; padding:0.5rem 1rem 1rem 1rem; }
.table-header { padding: 12px 0; display:flex; align-items:center; justify-content:space-between; }
.employees-table { width:100%; border-collapse:collapse; }
.employees-table th, .employees-table td { border-bottom:1px solid #eee; }
.add-btn { display:inline-flex; align-items:center; gap:0.5rem; }
.types-btn { display:inline-flex; align-items:center; gap:0.5rem; }
.empty-state { text-align:center; padding: 2rem 1rem; color:#666; }
`;

@Component({
  selector: 'app-school-employees',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatFormFieldModule, MatTooltipModule],
  styles: [_styles],
  template: `
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <button mat-icon-button (click)="goToDashboard()" matTooltip="Dashboard'a Dön" class="back-btn">
            <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
          </button>
          <h1>
            <mat-icon fontSet="material-symbols-outlined">people</mat-icon>
            Personel Yönetimi
          </h1>
        </div>
          <div class="header-actions">
            <button mat-stroked-button (click)="openTypes()" class="types-btn">
              <mat-icon fontSet="material-symbols-outlined">list</mat-icon>
              Personel Tipleri
            </button>
              <button mat-raised-button color="primary" (click)="openAdd()" class="add-btn" [disabled]="!auth.getSelectedSchool()">
                <mat-icon fontSet="material-symbols-outlined">person_add</mat-icon>
                Yeni Personel
              </button>
            </div>
        </div>

        <mat-card class="table-card">
          <div class="table-container">
          <table mat-table [dataSource]="employees" class="employees-table" *ngIf="employees.length>0; else emptyState">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef style="padding: 4px 12px; text-align: left;">Ad Soyad</th>
              <td mat-cell *matCellDef="let e" style="padding: 4px 12px;">{{ e.name }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef style="padding: 4px 12px; text-align: left;">E-posta</th>
              <td mat-cell *matCellDef="let e" style="padding: 4px 12px;">{{ e.email || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef style="padding: 4px 12px; text-align: left;">Tip</th>
              <td mat-cell *matCellDef="let e" style="padding: 4px 12px;">{{ e.EmployeeType?.name || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef style="padding: 4px 12px; text-align: left;">İşlem</th>
              <td mat-cell *matCellDef="let e" style="padding: 4px 12px;">
                <button mat-button color="accent" (click)="edit(e)" style="margin-right:6px;">
                  <span class="material-symbols-outlined" style="font-size:18px;">edit</span>
                  Düzenle
                </button>
                <button mat-button color="warn" (click)="remove(e)">
                  <span class="material-symbols-outlined" style="font-size:18px;">delete</span>
                  Sil
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>

          <ng-template #emptyState>
            <div class="empty-state">
              <div class="empty-icon">
                <mat-icon style="font-size:48px;">people_outline</mat-icon>
              </div>
              <h3>Henüz personel eklenmemiş</h3>
              <p>Okulunuza personel ekleyerek başlayın.</p>
            </div>
          </ng-template>
        </div>
      </mat-card>
    </div>
  `
})
export class SchoolEmployeesComponent implements OnInit, OnDestroy {
  employees: any[] = [];
  displayedColumns = ['name','email','type','actions'];
  private sub?: Subscription;
  constructor(private http: HttpClient, public auth: AuthService, private dialog: MatDialog, private empSvc: SchoolEmployeeService, private router: Router, @Inject(PLATFORM_ID) private platformId: Object, private cdr: ChangeDetectorRef) {}
  private getToken(): string | null { if (isPlatformBrowser(this.platformId)) return localStorage.getItem('token'); return null; }

  goToDashboard() { this.router.navigate(['/']); }

  ngOnInit(): void {
    // Only attempt to load if we have a token (consistent with other list pages)
    const token = this.getToken();
    if (!token) return;

    // If selected school already present, load immediately
    const school = this.auth.getSelectedSchool();
    if (school) {
      this.load(school.id);
    }

    // Also subscribe to changes (e.g., selection happens after component init)
    this.sub = this.auth.selectedSchool$.subscribe(s => {
      if (s) {
        this.load(s.id);
      } else {
        // clear list when no school selected
        this.employees = [];
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  load(schoolId: number) {
    this.empSvc.listBySchool(schoolId).subscribe({ next: (res) => { this.employees = res || []; this.cdr.detectChanges(); }, error: (err) => console.error(err) });
  }

  openAdd() {
    const school = this.auth.getSelectedSchool(); if (!school) return;
    const dialogRef = this.dialog.open(SchoolEmployeeDialogComponent, { width: '600px', data: { mode: 'add', schoolId: school.id } });
    dialogRef.afterClosed().subscribe(r => { if (r && r.saved) this.load(school.id); });
  }

  edit(emp: any) {
    const school = this.auth.getSelectedSchool(); if (!school) return;
    const dialogRef = this.dialog.open(SchoolEmployeeDialogComponent, { width: '600px', data: { mode: 'edit', employee: emp, schoolId: school.id } });
    dialogRef.afterClosed().subscribe(r => { if (r && r.saved) this.load(school.id); });
  }

  remove(emp: any) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    this.empSvc.remove(emp.id).subscribe({ next: () => { const school = this.auth.getSelectedSchool(); if (school) this.load(school.id); }, error: () => alert('Silme başarısız') });
  }

  openTypes() {
    this.router.navigate(['/employee-types']);
  }


}
