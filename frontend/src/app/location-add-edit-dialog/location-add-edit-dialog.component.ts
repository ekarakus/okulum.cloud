import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-location-add-edit-dialog',
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>{{ data.location ? 'Lokasyon Düzenle' : 'Yeni Lokasyon Ekle' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="onSave()" (keydown.enter)="onFormEnter($event)">
        <mat-form-field style="width:100%">
          <mat-label>Ad</mat-label>
          <input matInput formControlName="name" required />
        </mat-form-field>
        <mat-form-field style="width:100%">
          <mat-label>Oda Numarası</mat-label>
          <input matInput formControlName="room_number" />
        </mat-form-field>
        <mat-form-field style="width:100%">
          <mat-label>Açıklama</mat-label>
          <input matInput formControlName="description" />
        </mat-form-field>
        <div style="display:none"><button type="submit"></button></div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>İptal</button>
      <button mat-raised-button color="primary" type="submit" (click)="onSave()" [disabled]="!form.valid">
        {{ data.location ? 'Güncelle' : 'Ekle' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class LocationAddEditDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<LocationAddEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { location?: any }
  ) {
    this.form = this.fb.group({
      name: [data.location?.name || ''],
      room_number: [data.location?.room_number || ''],
      description: [data.location?.description || '']
    });
  }

  onSave() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onFormEnter(event: Event) {
    try { const target = event.target as HTMLElement; if (target && target.tagName === 'TEXTAREA') return; } catch (e) {}
    event.preventDefault(); this.onSave();
  }
}
