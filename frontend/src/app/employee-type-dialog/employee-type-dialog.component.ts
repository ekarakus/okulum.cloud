import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { EmployeeTypeService } from '../services/employee-type.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee-type-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule, MatDialogModule],
  styles: [`.dialog-title { padding-left:24px; margin-bottom:8px; font-weight:500 }`],
  template: `
  <h2 mat-dialog-title class="dialog-title">{{ data.type ? 'Düzenle' : 'Yeni Personel Tipi' }}</h2>
    <form [formGroup]="form" (ngSubmit)="onSave()">
      <mat-dialog-content style="min-width:320px;padding:0 24px 16px;">
      <div style="margin-top:12px;">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Ad</mat-label>
          <input matInput formControlName="name" required />
        </mat-form-field>

  <mat-checkbox [checked]="form.get('is_teacher').value" (change)="toggleExclusive('is_teacher', $event.checked)">Öğretmen</mat-checkbox>
  <br />
  <mat-checkbox [checked]="form.get('is_principal').value" (change)="toggleExclusive('is_principal', $event.checked)">Müdür</mat-checkbox>
  <br />
  <mat-checkbox [checked]="form.get('is_vice_principal').value" (change)="toggleExclusive('is_vice_principal', $event.checked)">Müdür Yardımcısı</mat-checkbox>
  </div>
  </mat-dialog-content>
      <mat-dialog-actions align="end" style="padding:0 24px 16px;">
        <button mat-button type="button" (click)="onCancel()">İptal</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Kaydet</button>
      </mat-dialog-actions>
    </form>
  `
})
export class EmployeeTypeDialogComponent implements OnInit {
  form: any;

  constructor(
    public dialogRef: MatDialogRef<EmployeeTypeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { type?: any },
    private fb: FormBuilder,
    private svc: EmployeeTypeService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({ name: ['', Validators.required], is_teacher: [false], is_principal: [false], is_vice_principal: [false] });
    if (this.data && this.data.type) {
      this.form.patchValue(this.data.type);
    }
  }

  toggleExclusive(controlName: string, checked: boolean) {
    // If checked, set other flags to false. If unchecked, just set this one to false.
    const flags = ['is_teacher', 'is_principal', 'is_vice_principal'];
    if (checked) {
      flags.forEach(f => this.form.get(f).setValue(f === controlName));
    } else {
      this.form.get(controlName).setValue(false);
    }
  }

  onCancel() { this.dialogRef.close(null); }

  onSave() {
    if (this.form.invalid) return;
    const payload = this.form.value;
    if (this.data && this.data.type && this.data.type.id) {
      this.svc.update(this.data.type.id, payload).subscribe({ next: (r) => this.dialogRef.close({ saved: true }), error: () => this.dialogRef.close({ saved: false }) });
    } else {
      this.svc.create(payload).subscribe({ next: (r) => this.dialogRef.close({ saved: true }), error: () => this.dialogRef.close({ saved: false }) });
    }
  }
}
