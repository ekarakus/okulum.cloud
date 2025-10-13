import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { EmployeeTypeService } from '../services/employee-type.service';
import { SchoolEmployeeService } from '../services/school-employee.service';

@Component({
  selector: 'app-school-employee-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'edit' ? 'Personel Düzenle' : 'Yeni Personel' }}</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit($event)">
      <mat-dialog-content>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Ad Soyad</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Görevi</mat-label>
          <mat-select formControlName="employee_type_id">
            <mat-option *ngFor="let t of types" [value]="t.id">{{ t.name }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Branş</mat-label>
          <input matInput formControlName="branch" />
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>E-mail</mat-label>
          <input matInput formControlName="email" />
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">İptal</button>
        <button mat-raised-button color="primary" type="submit">Kaydet</button>
      </mat-dialog-actions>
    </form>
  `
})
export class SchoolEmployeeDialogComponent implements OnInit {
  form: any;
  types: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<SchoolEmployeeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'add' | 'edit', employee?: any, schoolId?: number },
    private fb: FormBuilder,
    private typeSvc: EmployeeTypeService,
    private empSvc: SchoolEmployeeService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({ name: ['', Validators.required], email: [''], branch: [''], employee_type_id: [null] });
    // Load employee types first, then patch form so the select can resolve the selected value
    this.typeSvc.list().subscribe({ next: (res) => {
      this.types = res || [];
      if (this.data.mode === 'edit' && this.data.employee) {
        const emp = this.data.employee as any;
        // prefer explicit employee_type_id, fall back to nested EmployeeType id when available
        const employee_type_id = emp.employee_type_id ?? emp.EmployeeType?.id ?? null;
        this.form.patchValue({ ...emp, employee_type_id });
      }
    }});
  }

  onCancel() { this.dialogRef.close(null); }

  onSubmit(e: Event) {
    e.preventDefault();
    if (!this.form.valid) return;

    const payload = { ...this.form.value, school_id: this.data.schoolId };
    if (this.data.mode === 'edit' && this.data.employee?.id) {
      this.empSvc.update(this.data.employee.id, payload).subscribe({ next: (res) => this.dialogRef.close({ saved: true }), error: () => this.dialogRef.close({ saved: false }) });
    } else {
      this.empSvc.create(payload).subscribe({ next: (res) => this.dialogRef.close({ saved: true }), error: () => this.dialogRef.close({ saved: false }) });
    }
  }
}
