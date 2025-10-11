import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feature-add-edit-dialog',
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>{{ data.feature ? 'Özellik Düzenle' : 'Yeni Özellik Ekle' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="onSave()" (keydown.enter)="onFormEnter($event)">
        <mat-form-field style="width:100%; margin-bottom: 1rem;">
          <mat-label>Özellik Adı</mat-label>
          <input matInput formControlName="name" placeholder="Özellik adını giriniz">
        </mat-form-field>

        <mat-form-field style="width:100%; margin-bottom: 1rem;">
          <mat-label>Açıklama</mat-label>
          <textarea matInput formControlName="description" placeholder="Açıklama (isteğe bağlı)" rows="3"></textarea>
        </mat-form-field>

            <mat-form-field style="width:100%; margin-bottom: 1rem;">
              <mat-label>Sort Order (smaller appears first)</mat-label>
              <input matInput type="number" formControlName="sort_order" placeholder="1,2,3..." />
            </mat-form-field>
        <div style="display:none"><button type="submit"></button></div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">İptal</button>
      <button mat-button color="primary" type="submit" (click)="onSave()" [disabled]="!form.valid">
        {{ data.feature ? 'Güncelle' : 'Ekle' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class FeatureAddEditDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FeatureAddEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { feature: any }
  ) {
    this.form = this.fb.group({
      name: [data.feature?.name || '', Validators.required],
      description: [data.feature?.description || ''],
  sort_order: [data.feature?.sort_order ?? 0]
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
      if (target && target.tagName === 'TEXTAREA') return; // allow new lines
    } catch (e) {}
    event.preventDefault();
    this.onSave();
  }
}
