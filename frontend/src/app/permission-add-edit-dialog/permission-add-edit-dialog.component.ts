import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-permission-add-edit-dialog',
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{data.permission ? 'Yetki Düzenle' : 'Yeni Yetki Ekle'}}</h2>
    <mat-dialog-content>
  <form [formGroup]="form" (ngSubmit)="onSave()" (keydown.enter)="onFormEnter($event)">
        <mat-form-field style="width: 100%; margin-bottom: 1rem;">
          <mat-label>Yetki Adı</mat-label>
          <input matInput formControlName="name" placeholder="Yetki adını girin" autocomplete="off">
          <mat-error *ngIf="form.get('name')?.hasError('required')">
            Yetki adı gereklidir
          </mat-error>
        </mat-form-field>
        <mat-form-field style="width: 100%; margin-bottom: 1rem;">
          <mat-label>Açıklama</mat-label>
          <textarea matInput formControlName="description" placeholder="Yetki açıklamasını girin" rows="3"></textarea>
        </mat-form-field>
        <div style="display:none;"><button type="submit"></button></div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">İptal</button>
      <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid" (click)="onSave()">
        {{data.permission ? 'Güncelle' : 'Ekle'}}
      </button>
    </mat-dialog-actions>
  `,
})
export class PermissionAddEditDialogComponent {
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<PermissionAddEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      name: [data.permission?.name || '', [Validators.required]],
      description: [data.permission?.description || '']
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
    try { const target = event.target as HTMLElement; if (target && target.tagName === 'TEXTAREA') return; } catch (e) {}
    event.preventDefault(); this.onSave();
  }
}
