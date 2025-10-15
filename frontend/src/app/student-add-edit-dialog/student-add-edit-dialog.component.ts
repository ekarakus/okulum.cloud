import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-student-add-edit-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatRadioModule],
  template: `
    <h2 mat-dialog-title>{{ data.student ? 'Öğrenci Düzenle' : 'Yeni Öğrenci' }}</h2>
    <mat-dialog-content [formGroup]="form">
      <mat-form-field appearance="fill" style="width:100%">
        <mat-label>Öğrenci No</mat-label>
        <input matInput formControlName="student_no" />
      </mat-form-field>

      <mat-form-field appearance="fill" style="width:48%; margin-right:4%">
        <mat-label>Adı</mat-label>
        <input matInput formControlName="first_name" />
      </mat-form-field>

      <mat-form-field appearance="fill" style="width:48%">
        <mat-label>Soyadı</mat-label>
        <input matInput formControlName="last_name" />
      </mat-form-field>

      <div style="display:flex; gap:4%; width:100%; align-items:flex-start">
        <div style="flex:1">
          <label style="display:block;margin-bottom:6px">Cinsiyeti</label>
          <mat-radio-group formControlName="gender" style="display:flex;gap:12px">
            <mat-radio-button value="male">Erkek</mat-radio-button>
            <mat-radio-button value="female">Kız</mat-radio-button>
          </mat-radio-group>
        </div>

        <div style="flex:1">
          <mat-form-field appearance="fill" style="width:100%">
            <mat-label>Doğum Tarihi</mat-label>
            <input matInput type="date" formControlName="birth_date" />
          </mat-form-field>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="close()">İptal</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">Kaydet</button>
    </mat-dialog-actions>
  `
})
export class StudentAddEditDialogComponent {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  dialogRef: MatDialogRef<any> | null = null;
  data: any;

  form = this.fb.group({
    student_no: ['', Validators.required],
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    gender: ['male', Validators.required],
    birth_date: ['']
  });

  constructor(@Inject(MAT_DIALOG_DATA) data: any, dialogRef: MatDialogRef<StudentAddEditDialogComponent>) {
    this.data = data || {};
    this.dialogRef = dialogRef;
    if (this.data.student) {
      const s = this.data.student;
      this.form.patchValue({
        student_no: s.student_no,
        first_name: s.first_name,
        last_name: s.last_name,
  gender: s.gender || 'male',
        birth_date: s.birth_date ? s.birth_date.split('T')[0] : ''
      });
    }
  }

  close() { this.dialogRef?.close(); }

  save() {
    const v = this.form.value;
    const payload = {
      student_no: v.student_no,
      first_name: v.first_name,
      last_name: v.last_name,
      gender: v.gender,
      birth_date: v.birth_date || null
    };
    if (this.data.student) {
      this.http.put('/api/students/' + this.data.student.id, payload).subscribe({ next: () => this.dialogRef?.close(true), error: e => console.error(e) });
    } else {
      this.http.post('/api/students', payload).subscribe({ next: () => this.dialogRef?.close(true), error: e => console.error(e) });
    }
  }
}
