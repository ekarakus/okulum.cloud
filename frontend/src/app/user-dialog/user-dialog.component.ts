import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService, User, School } from '../services/auth.service';

export interface UserDialogData {
  mode: 'add' | 'edit';
  user?: User;
}

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ data.mode === 'add' ? 'person_add' : 'edit' }}</mat-icon>
      {{ data.mode === 'add' ? 'Yeni Kullanıcı Ekle' : 'Kullanıcıyı Düzenle' }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="userForm" class="user-form">
        <!-- Temel Bilgiler -->
        <mat-form-field appearance="outline">
          <mat-label>Ad Soyad</mat-label>
          <input matInput formControlName="name" required>
          <mat-error *ngIf="userForm.get('name')?.hasError('required')">Ad soyad zorunludur.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>E-posta</mat-label>
          <input matInput formControlName="email" required type="email">
          <mat-error *ngIf="userForm.get('email')?.hasError('required')">E-posta zorunludur.</mat-error>
          <mat-error *ngIf="userForm.get('email')?.hasError('email')">Geçerli bir e-posta adresi girin.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" *ngIf="data.mode === 'add'">
          <mat-label>Şifre</mat-label>
          <input matInput formControlName="password" required type="password">
          <mat-error *ngIf="userForm.get('password')?.hasError('required')">Şifre zorunludur.</mat-error>
          <mat-error *ngIf="userForm.get('password')?.hasError('minlength')">Şifre en az 6 karakter olmalıdır.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Sistem Rolü</mat-label>
          <mat-select formControlName="role" [disabled]="data.mode === 'edit' && data.user?.role === 'super_admin'">
            <mat-option value="admin">Okul Yöneticisi</mat-option>
          </mat-select>
        </mat-form-field>
        <div *ngIf="data.mode === 'edit' && data.user?.role === 'super_admin'" style="color:#666; font-size:0.85rem; margin-top:-0.5rem;">
          Bu kullanıcı Süper Admin'dir. Rol değiştirilemez.
        </div>

        <!-- Okul Atamaları (Çoklu Seçim + Arama) -->
        <div class="assignments-container">
          <h3>Okul Atamaları</h3>
          <mat-form-field appearance="outline" class="school-select" style="width:100%">
            <mat-label>Okul Seçin</mat-label>
            <mat-select multiple [value]="selectedSchoolIds" (selectionChange)="onSchoolMultiChange($event.value)">
              <mat-option disabled>
                <input matInput placeholder="Okul ara..." [(ngModel)]="schoolFilter" (click)="$event.stopPropagation()">
              </mat-option>
              <mat-option *ngFor="let school of filteredSchools()" [value]="school.id">
                {{ school.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">İptal</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!userForm.valid || isLoading">
        <span *ngIf="!isLoading">Kaydet</span>
        <span *ngIf="isLoading">Kaydediliyor...</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .user-form { display: flex; flex-direction: column; gap: 1rem; }
    .assignments-container { margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem; }
    .assignment-row { display: flex; align-items: center; gap: 0.5rem; }
    .school-select { flex-grow: 1; }
    .add-assignment-btn { margin-top: 0.5rem; }
  `]
})
export class UserDialogComponent implements OnInit {
  userForm: FormGroup;
  allSchools: School[] = [];
  isLoading = false;
  selectedSchoolIds: number[] = [];
  schoolFilter = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.data.mode === 'add' ? [Validators.required, Validators.minLength(6)] : []],
  role: ['admin', Validators.required],
      is_active: [true],
      school_assignments: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadAllSchools();
    if (this.data.mode === 'edit' && this.data.user) {
      this.userForm.patchValue({
        name: this.data.user.name,
        email: this.data.user.email,
        role: this.data.user.role,
        is_active: this.data.user.is_active
      });
      // Backend'den 'Schools' veya 'schools' gelebilir, ikisini de kontrol et
      const userSchools = this.data.user.schools;
      this.selectedSchoolIds = (userSchools || []).map((s: School) => s.id);
      this.rebuildAssignmentsFromSelected();
    }
  }

  get schoolAssignments(): FormArray {
    return this.userForm.get('school_assignments') as FormArray;
  }

  onSchoolMultiChange(ids: number[]): void {
    this.selectedSchoolIds = ids || [];
    this.rebuildAssignmentsFromSelected();
  }

  rebuildAssignmentsFromSelected(): void {
    // FormArray'i seçilen ID'lere göre yeniden oluştur
    const fa = this.schoolAssignments;
    while (fa.length) fa.removeAt(0);
    this.selectedSchoolIds.forEach(id => {
      fa.push(this.fb.group({ school_id: [id, Validators.required] }));
    });
  }

  filteredSchools(): School[] {
    const q = (this.schoolFilter || '').toLowerCase().trim();
    if (!q) return this.allSchools;
    return this.allSchools.filter(s => (s.name + ' ' + (s.code || '')).toLowerCase().includes(q));
  }

  loadAllSchools(): void {
    const token = this.authService.getToken();
    if (!token) return;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<School[]>(`${environment.apiUrl}/api/schools`, { headers }).subscribe(
      schools => this.allSchools = schools,
      error => this.showError('Okullar yüklenemedi.')
    );
  }

  onSave(): void {
    if (this.userForm.invalid) {
      this.showError('Lütfen formdaki tüm zorunlu alanları doldurun.');
      return;
    }

    this.isLoading = true;
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const formData = this.userForm.getRawValue();
    // Çoklu seçimden gelen ID'leri payload'a dönüştür
    formData.school_assignments = (this.selectedSchoolIds || []).map((id: number) => ({ school_id: id, is_primary: false }));

    let request$;
    if (this.data.mode === 'add') {
      request$ = this.http.post(`${environment.apiUrl}/api/users`, formData, { headers });
    } else {
      const userId = this.data.user?.id;
      request$ = this.http.put(`${environment.apiUrl}/api/users/${userId}`, formData, { headers });
    }

    request$.subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showSuccess(`Kullanıcı başarıyla ${this.data.mode === 'add' ? 'oluşturuldu' : 'güncellendi'}.`);
        this.dialogRef.close(response);
      },
      error: (err) => {
        this.isLoading = false;
        const message = err.error?.message || `Kullanıcı ${this.data.mode === 'add' ? 'oluşturulurken' : 'güncellenirken'} bir hata oluştu.`;
        this.showError(message);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Kapat', { duration: 3000 });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Kapat', { duration: 5000 });
  }
}
