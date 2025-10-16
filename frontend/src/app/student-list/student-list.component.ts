import { Component, inject, OnInit, OnDestroy, NgZone, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
// removed duplicate imports
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
// ChangeDetectorRef now imported from the consolidated core import above

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatRippleModule, MatProgressSpinnerModule, MatCheckboxModule, MatSnackBarModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule, MatPaginatorModule, MatSortModule, MatDialogModule, MatTooltipModule],
  template: `
  <div class="container">
    <div class="header">
      <div class="header-left">
        <button mat-icon-button (click)="back()" matTooltip="Dashboard'a Dön" class="back-btn">
          <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
        </button>
        <h1>
          <mat-icon fontSet="material-symbols-outlined">person</mat-icon>
          Öğrenciler
        </h1>
      </div>
      <div style="display:flex; gap:8px; align-items:center">
        <button mat-raised-button color="primary" (click)="openAdd()" class="add-btn">
          <mat-icon fontSet="material-symbols-outlined">person_add</mat-icon>
          Yeni Öğrenci
        </button>
        <button mat-raised-button color="warn" (click)="bulkDelete()" [disabled]="selection.isEmpty()" class="delete-btn" matTooltip="Seçilmiş öğrencileri sil">
          <mat-icon fontSet="material-symbols-outlined">delete</mat-icon>
          Seçilenleri Sil ({{selection.selected.length}})
        </button>
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <mat-form-field appearance="fill" style="width:220px;margin-right:8px">
        <mat-label>Ara</mat-label>
        <input matInput (input)="applyFilter($any($event.target).value)" placeholder="Ad, Soyad veya No ile ara" />
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:160px;">
        <mat-label>Cinsiyet</mat-label>
        <mat-select (selectionChange)="applyGenderFilter($event.value)" [value]="genderFilter">
          <mat-option value="">Tümü</mat-option>
          <mat-option value="male">Erkek</mat-option>
          <mat-option value="female">Kız</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <mat-card *ngIf="!loading && (!students || students.length === 0)" style="padding:2rem;text-align:center">
      <div style="font-size:1rem;color:#666">Bu okul için kayıtlı öğrenci bulunamadı.</div>
    </mat-card>

    <div *ngIf="loading" style="display:flex;justify-content:center;padding:2rem">
      <mat-progress-spinner mode="indeterminate" diameter="36" aria-label="Öğrenciler yükleniyor"></mat-progress-spinner>
    </div>

      <table mat-table [dataSource]="dataSource" matSort class="mat-elevation-z8" style="width:100%">

        <!-- Select Column -->
        <ng-container matColumnDef="select">
          <th mat-header-cell *matHeaderCellDef>
            <mat-checkbox (change)="masterToggle()" [checked]="isAllSelected()" [indeterminate]="selection.hasValue() && !isAllSelected()" aria-label="Tümünü seç"></mat-checkbox>
          </th>
          <td mat-cell *matCellDef="let row">
            <mat-checkbox (click)="$event.stopPropagation()" (change)="$event ? toggleSelection(row) : null" [checked]="selection.isSelected(row)" aria-label="Seç {{row.student_no}}"></mat-checkbox>
          </td>
        </ng-container>

        <!-- Student No -->
        <ng-container matColumnDef="student_no">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Öğrenci No</th>
          <td mat-cell *matCellDef="let s">{{ s.student_no }}</td>
        </ng-container>

        <!-- First Name -->
        <ng-container matColumnDef="first_name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Adı</th>
          <td mat-cell *matCellDef="let s">{{ s.first_name }}</td>
        </ng-container>

        <!-- Last Name -->
        <ng-container matColumnDef="last_name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Soyadı</th>
          <td mat-cell *matCellDef="let s">{{ s.last_name }}</td>
        </ng-container>

        <!-- Gender -->
        <ng-container matColumnDef="gender">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Cinsiyet</th>
          <td mat-cell *matCellDef="let s">{{ s.gender === 'male' ? 'Erkek' : 'Kız' }}</td>
        </ng-container>

        <!-- Birth Date -->
        <ng-container matColumnDef="birth_date">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Doğum Tarihi</th>
          <td mat-cell *matCellDef="let s">{{ formatDate(s.birth_date) }}</td>
        </ng-container>

        <!-- Actions -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>İşlemler</th>
          <td mat-cell *matCellDef="let s">
            <button mat-button color="accent" (click)="edit(s)">
              <mat-icon fontSet="material-symbols-outlined" style="margin-right:0.3rem;font-size:18px;">edit</mat-icon>
              Düzenle
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        <tr *ngIf="!dataSource.data || dataSource.data.length === 0">
          <td [attr.colspan]="displayedColumns.length" style="padding:20px;text-align:center;color:#666">Bu okul için kayıtlı öğrenci bulunamadı.</td>
        </tr>
      </table>

      <mat-paginator [pageSizeOptions]="[10,25,50]" showFirstLastButtons></mat-paginator>
  </div>
  `
  ,
  styles: [`
    .container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .header h1 { margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.6rem; font-weight: 600; color: #2c3e50; }
    .header h1 mat-icon { font-size: 1.6rem; color: #1976d2; }
    .table-card { border-radius: 12px; overflow: hidden; }
    .back-btn { background-color: #f8f9fa; color: #1976d2; border: 2px solid #e3f2fd; transition: all 0.3s ease; }
    .back-btn:hover { background-color: #e3f2fd; transform: scale(1.05); }
  .add-btn { padding: 0.75rem 1.25rem; border-radius: 8px; font-weight: 500; background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; box-shadow: 0 2px 8px rgba(25,118,210,0.25); }
  .add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(25,118,210,0.4); }
  .delete-btn { padding: 0.6rem 1rem; border-radius: 8px; font-weight: 500; background: linear-gradient(135deg, #d32f2f 0%, #ef5350 100%); color: white; box-shadow: 0 2px 8px rgba(211,47,47,0.25); }
  .delete-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(211,47,47,0.4); }
    .delete-btn[disabled], .delete-btn.mat-button-disabled {
      background: linear-gradient(135deg, #f2c2c2 0%, #f7d6d6 100%);
      color: #b71c1c;
      box-shadow: none;
      opacity: 0.85;
      cursor: default;
      transform: none;
    }
    @media (max-width: 768px) { .container { padding: 1rem; } .header { flex-direction: column; gap: 1rem; align-items: stretch; } }
  `]
})
export class StudentListComponent implements OnInit, AfterViewInit, OnDestroy {
  http = inject(HttpClient);
  dialog = inject(MatDialog);
  auth = inject(AuthService);
  router = inject(Router);
  ngZone = inject(NgZone);
  cdr = inject(ChangeDetectorRef);
  snack = inject(MatSnackBar);
  students: any[] = [];
  loading = false;
  displayedColumns: string[] = ['select','student_no', 'first_name', 'last_name', 'gender', 'birth_date', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  selection = new SelectionModel<any>(true, []);
  genderFilter: string = '';

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;
  private subs = new Subscription();

  ngOnInit() {
    // Immediately load for the currently selected school (if any), then subscribe to changes
    const initial = this.auth.getSelectedSchool();
    if (initial) {
      this.load(initial.id);
    }
    this.subs.add(this.auth.selectedSchool$.subscribe(school => {
      // Ensure change-detection friendly execution in case the subject emits outside Angular's zone
      this.ngZone.run(() => {
        if (!school) {
          this.students = [];
          this.cdr.detectChanges();
          return;
        }
        this.load(school.id);
      });
    }));
  }

  ngAfterViewInit(): void {
    // Wire paginator and sort after view init. Fail loudly if missing during development.
    if (!this.paginator) {
      console.warn('MatPaginator not found in StudentListComponent view');
    } else {
      this.dataSource.paginator = this.paginator;
      // default to 50 rows per page
      this.paginator.pageSize = 50;
    }

    if (!this.sort) {
      console.warn('MatSort not found in StudentListComponent view');
    } else {
      this.dataSource.sort = this.sort;
    }

    // Provide a sortingDataAccessor so dates and numeric-like strings sort correctly
    this.dataSource.sortingDataAccessor = (data: any, property: string) => {
      if (!data) return '';
      if (property === 'birth_date') {
        const d = data.birth_date;
        return d ? new Date(d).getTime() : 0;
      }
      if (property === 'student_no') {
        // try numeric compare if student_no looks numeric
        const n = Number(data.student_no);
        return Number.isFinite(n) ? n : (data.student_no || '').toString().toLowerCase();
      }
      const v = data[property];
      return (v === null || v === undefined) ? '' : v;
    };

    // Filter predicate expects the filter to be a JSON string: { text, gender }
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      let parsed = { text: '', gender: '' };
      try { parsed = JSON.parse(filter); } catch(e) { parsed.text = filter || ''; }
      const text = (parsed.text || '').toString().trim().toLowerCase();
      const gender = (parsed.gender || '').toString();
      const matchesText = !text || (
        (data.student_no || '').toString().toLowerCase().includes(text) ||
        (data.first_name || '').toString().toLowerCase().includes(text) ||
        (data.last_name || '').toString().toLowerCase().includes(text)
      );
      const matchesGender = !gender || (data.gender === gender);
      return matchesText && matchesGender;
    };

    // ensure table renders with new settings
    try { this.cdr.detectChanges(); } catch(e) { /* ignore */ }
  }

  applyFilter(value: string) {
    const filterValue = (value || '').trim().toLowerCase();
    // combine text + gender into a single filter object stored as JSON string
    const combined = JSON.stringify({ text: filterValue, gender: this.genderFilter || '' });
    // predicate will be set elsewhere but ensure default if needed
    this.dataSource.filter = combined;
  }

  applyGenderFilter(val: string) {
    this.genderFilter = val || '';
    const combined = JSON.stringify({ text: (''), gender: this.genderFilter || '' });
    // keep current search text if any
    const cur = this.dataSource.filter ? JSON.parse(this.dataSource.filter) : { text: '' };
    combined && (this.dataSource.filter = JSON.stringify({ text: cur.text || '', gender: this.genderFilter }));
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.dataSource.data.forEach(row => this.selection.select(row));
  }

  toggleSelection(row: any) {
    this.selection.toggle(row);
  }

  bulkDelete() {
    if (!confirm(`Seçili ${this.selection.selected.length} öğrenci silinsin mi?`)) return;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    const ids = this.selection.selected.map((s: any) => s.id);
    this.http.post('/api/students/bulk-delete', { ids }, headers ? { headers } : {}).subscribe({
      next: (res: any) => {
        this.snack.open(`${ids.length} öğrenci silindi.`, 'Kapat', { duration: 3000 });
        const sc = this.auth.getSelectedSchool(); if (sc) this.load(sc.id);
        this.selection.clear();
      },
      error: e => {
        console.error('Bulk delete error', e);
        this.snack.open('Silme işlemi sırasında hata oluştu.', 'Kapat', { duration: 4000 });
      }
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  load(schoolId: number) {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    this.loading = true;
    this.http.get<any[]>(`/api/students/school/${schoolId}`, headers ? { headers } : {}).subscribe({
      next: r => {
        // Update model inside Angular zone and trigger change detection so UI updates immediately
          this.ngZone.run(() => {
            this.students = r || [];
            this.dataSource.data = this.students;
                // ensure paginator/sort are attached in case the table was created after view init
                try { if (this.paginator) this.dataSource.paginator = this.paginator; } catch(e) {}
                try { if (this.sort) this.dataSource.sort = this.sort; } catch(e) {}
                // ensure sorting accessor exists
                this.dataSource.sortingDataAccessor = (data: any, property: string) => {
                  if (!data) return '';
                  if (property === 'birth_date') {
                    const d = data.birth_date;
                    return d ? new Date(d).getTime() : 0;
                  }
                  if (property === 'student_no') {
                    const n = Number(data.student_no);
                    return Number.isFinite(n) ? n : (data.student_no || '').toString().toLowerCase();
                  }
                  const v = data[property];
                  return (v === null || v === undefined) ? '' : v;
                };
                // ensure filter predicate exists (combined text + gender)
                this.dataSource.filterPredicate = (data: any, filter: string) => {
                  let parsed = { text: '', gender: '' };
                  try { parsed = JSON.parse(filter); } catch(e) { parsed.text = filter || ''; }
                  const text = (parsed.text || '').toString().trim().toLowerCase();
                  const gender = (parsed.gender || '').toString();
                  const matchesText = !text || (
                    (data.student_no || '').toString().toLowerCase().includes(text) ||
                    (data.first_name || '').toString().toLowerCase().includes(text) ||
                    (data.last_name || '').toString().toLowerCase().includes(text)
                  );
                  const matchesGender = !gender || (data.gender === gender);
                  return matchesText && matchesGender;
                };
                this.loading = false;
                try { this.cdr.detectChanges(); } catch(e) { /* ignore */ }
          });
      },
      error: e => {
        console.error('Failed loading students', e);
        // ensure UI shows any error state
        this.ngZone.run(() => {
          this.students = [];
          this.dataSource.data = [];
          this.loading = false;
          try { this.cdr.detectChanges(); } catch(err) {}
        });
      }
    });
  }

  openAdd() {
    import('../student-add-edit-dialog/student-add-edit-dialog.component').then(m => {
      const ref = this.dialog.open(m.StudentAddEditDialogComponent, { data: {} });
      ref.afterClosed().subscribe(() => {
        const s = this.auth.getSelectedSchool();
        if (s) this.load(s.id);
      });
    });
  }

  back() {
    this.router.navigate(['/dashboard']);
  }

  edit(s: any) {
    import('../student-add-edit-dialog/student-add-edit-dialog.component').then(m => {
      const ref = this.dialog.open(m.StudentAddEditDialogComponent, { data: { student: s } });
      ref.afterClosed().subscribe(() => {
        const sc = this.auth.getSelectedSchool();
        if (sc) this.load(sc.id);
      });
    });
  }

  formatDate(v: any) {
    if (!v) return '';
    try { return new Date(v).toLocaleDateString(); } catch(e) { return ''; }
  }
}
