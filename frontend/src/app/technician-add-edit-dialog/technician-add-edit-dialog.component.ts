import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-technician-add-edit-dialog',
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>{{ data.technician ? 'Teknisyen Düzenle' : 'Yeni Teknisyen Ekle' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field style="width:100%">
          <mat-label>Ad Soyad</mat-label>
          <input matInput formControlName="name" required />
        </mat-form-field>
        <mat-form-field style="width:100%">
          <mat-label>E-posta</mat-label>
          <input matInput formControlName="email" type="email" placeholder="ornek@domain.com" />
          <mat-error *ngIf="form.get('email')?.hasError('email') && form.get('email')?.touched">
            Geçerli bir e-posta adresi giriniz
          </mat-error>
        </mat-form-field>
        <mat-form-field style="width:100%">
          <mat-label>Telefon</mat-label>
          <input matInput formControlName="phone" />
        </mat-form-field>
        <mat-form-field style="width:100%">
          <mat-label>Durum</mat-label>
          <mat-select formControlName="status">
            <mat-option value="active">Aktif</mat-option>
            <mat-option value="inactive">Pasif</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>İptal</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!form.valid">
        {{ data.technician ? 'Güncelle' : 'Ekle' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class TechnicianAddEditDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TechnicianAddEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { technician?: any }
  ) {
    this.form = this.fb.group({
      name: [data.technician?.name || '', Validators.required],
      email: [data.technician?.email || '', [Validators.email]],
      phone: [data.technician?.phone || ''],
      status: [data.technician?.status || 'active']
    });
  }

  onSave() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.value);
  }
}
