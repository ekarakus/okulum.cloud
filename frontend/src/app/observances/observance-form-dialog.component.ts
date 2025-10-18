import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

export interface ObservanceFormData {
  id?: number;
  name?: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean | null;
  source_year?: number | null;
}

@Component({
  standalone: true,
  selector: 'app-observance-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule],
  template: `
  <h2 mat-dialog-title style="padding-left: 20px;">{{data.id ? '  Belirli Gün ve Hafta Düzenle' : ' Yeni Belirli Gün ve Hafta'}}</h2>
    <form [formGroup]="form" style="display:flex;flex-direction:column;gap:12px;padding:0 24px 18px;">
      <mat-form-field>
        <input matInput placeholder="Ad" formControlName="name">
      </mat-form-field>

      <mat-form-field>
        <textarea matInput placeholder="Açıklama" formControlName="description" rows="3"></textarea>
      </mat-form-field>

      <div style="display:flex;gap:12px">
        <mat-form-field style="flex:1">
          <input matInput type="date" placeholder="Başlangıç" formControlName="start_date">
        </mat-form-field>
        <mat-form-field style="flex:1">
          <input matInput type="date" placeholder="Bitiş" formControlName="end_date">
        </mat-form-field>
      </div>

      <mat-form-field>
        <input matInput type="number" placeholder="Eğitim Yılı (opsiyonel)" formControlName="source_year">
      </mat-form-field>

      <mat-checkbox formControlName="is_active">Aktif</mat-checkbox>

      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button mat-stroked-button type="button" (click)="onCancel()">İptal</button>
        <button mat-flat-button color="primary" type="button" (click)="onSave()" [disabled]="form.invalid">Kaydet</button>
      </div>
    </form>
  `
})
export class ObservanceFormDialogComponent {
  form: any;

  constructor(private fb: FormBuilder, private dialogRef: MatDialogRef<ObservanceFormDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: ObservanceFormData) {
    this.form = this.fb.group({
      name: [data?.name || '', Validators.required],
      description: [data?.description || ''],
      start_date: [data?.start_date || null],
      end_date: [data?.end_date || null],
      is_active: [data?.is_active !== undefined ? data.is_active : true],
      source_year: [data?.source_year || null]
    });
  }

  onCancel() { this.dialogRef.close(); }

  onSave() {
    if (this.form.invalid) return;
    const out: ObservanceFormData = Object.assign({}, this.data || {}, this.form.value) as ObservanceFormData;
    this.dialogRef.close(out);
  }
}
