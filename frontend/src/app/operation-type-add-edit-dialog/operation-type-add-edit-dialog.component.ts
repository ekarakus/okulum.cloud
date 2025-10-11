import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-operation-type-add-edit-dialog',
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{data.operationType ? 'İşlem Türü Düzenle' : 'Yeni İşlem Türü Ekle'}}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="onSave()" (keydown.enter)="onFormEnter($event)">
        <mat-form-field style="width: 100%; margin-bottom: 1rem;">
          <mat-label>İşlem Türü Adı</mat-label>
          <input matInput formControlName="name" placeholder="İşlem türü adını girin">
          <mat-error *ngIf="form.get('name')?.hasError('required')">
            İşlem türü adı gereklidir
          </mat-error>
        </mat-form-field>
        <div style="display:none"><button type="submit"></button></div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">İptal</button>
      <button mat-raised-button color="primary" type="submit" (click)="onSave()" [disabled]="form.invalid">
        {{data.operationType ? 'Güncelle' : 'Ekle'}}
      </button>
    </mat-dialog-actions>
  `,
})
export class OperationTypeAddEditDialogComponent {
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<OperationTypeAddEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      name: [data.operationType?.name || '', [Validators.required]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onFormEnter(event: Event) {
    try {
      const target = event.target as HTMLElement;
      if (target && target.tagName === 'TEXTAREA') return;
    } catch (e) {}
    event.preventDefault();
    this.onSave();
  }
}
