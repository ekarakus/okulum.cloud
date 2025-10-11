import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-device-type-add-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Aygıt Tipi Düzenle' : 'Yeni Aygıt Tipi Ekle' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" style="width:100%; margin-bottom: 1rem;">
          <mat-label>Aygıt Tipi Adı</mat-label>
          <input matInput formControlName="name" required />
          <mat-error *ngIf="form.get('name')?.hasError('required')">
            Aygıt tipi adı gereklidir
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%; margin-bottom: 1rem;">
          <mat-label>Aygıt Kodu (3 karakter)</mat-label>
          <input matInput formControlName="device_code" maxlength="3" placeholder="Örn: LAP" required />
          <mat-error *ngIf="form.get('device_code')?.hasError('required')">
            Aygıt kodu gereklidir
          </mat-error>
          <mat-error *ngIf="form.get('device_code')?.hasError('minlength') || form.get('device_code')?.hasError('maxlength')">
            Aygıt kodu tam olarak 3 karakter olmalıdır
          </mat-error>
          <mat-error *ngIf="form.get('device_code')?.hasError('pattern')">
            Aygıt kodu sadece harf içerebilir
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%; margin-bottom: 1rem;">
          <mat-label>Açıklama</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>


      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>İptal</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!form.valid">
        {{ isEdit ? 'Güncelle' : 'Ekle' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 400px;
    }
    mat-form-field {
      width: 100%;
    }
  `]
})
export class DeviceTypeAddDialogComponent {
  form: FormGroup;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<DeviceTypeAddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { deviceType?: any, isEdit?: boolean } | null
  ) {
    this.isEdit = data?.isEdit || false;

    this.form = this.fb.group({
      name: [data?.deviceType?.name || '', [Validators.required]],
      device_code: [data?.deviceType?.device_code || '', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(3),
        Validators.pattern(/^[A-Za-z]{3}$/)
      ]],
      description: [data?.deviceType?.description || ''],

    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
