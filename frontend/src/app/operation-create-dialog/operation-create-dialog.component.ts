import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-operation-create-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule, MatCheckboxModule],
  template: `
    <h2 style="margin:0 0 12px 0;">İşlem Ekle</h2>
    <mat-form-field appearance="outline" style="width:100%;">
      <textarea matInput rows="4" placeholder="İşlem açıklaması (isteğe bağlı)" [(ngModel)]="description"></textarea>
    </mat-form-field>
    <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
      <mat-checkbox [(ngModel)]="setStatus">Destek talebini 'İşlemde' olarak işaretle</mat-checkbox>
    </div>
    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
      <button mat-stroked-button (click)="onCancel()">İptal</button>
      <button mat-raised-button color="primary" (click)="onCreate()">Oluştur</button>
    </div>
  `
})
export class OperationCreateDialogComponent {
  description: string = '';
  setStatus = true;

  constructor(private dialogRef: MatDialogRef<OperationCreateDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    // data may include fault and device info for display in future
  }

  onCreate() {
    this.dialogRef.close({ description: this.description, setStatus: this.setStatus });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
