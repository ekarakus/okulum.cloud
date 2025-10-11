import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export interface SchoolDialogData {
  school?: {
    id?: number;
    name: string;
    code: string;
  };
  mode: 'add' | 'edit';
}

@Component({
  selector: 'app-school-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon fontSet="material-symbols-outlined">{{ data.mode === 'add' ? 'add_business' : 'edit_square' }}</mat-icon>
          {{ data.mode === 'add' ? 'Yeni Okul Ekle' : 'Okul Düzenle' }}
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon fontSet="material-symbols-outlined">close</mat-icon>
        </button>
      </div>

      <div mat-dialog-content class="dialog-content">
  <form [formGroup]="schoolForm" class="school-form" (ngSubmit)="onSave()" (keydown.enter)="onFormEnter($event)">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Okul Adı</mat-label>
            <mat-icon matPrefix fontSet="material-symbols-outlined">school</mat-icon>
            <input matInput
                   formControlName="name"
                   placeholder="Örn: Atatürk İlkokulu"
                   maxlength="100">
            <mat-error *ngIf="schoolForm.get('name')?.hasError('required')">
              Okul adı zorunludur
            </mat-error>
            <mat-error *ngIf="schoolForm.get('name')?.hasError('minlength')">
              Okul adı en az 3 karakter olmalıdır
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Okul Kodu</mat-label>
            <mat-icon matPrefix fontSet="material-symbols-outlined">tag</mat-icon>
            <input matInput
                   formControlName="code"
                   placeholder="Örn: ATK001"
                   maxlength="20"
                   style="text-transform: uppercase;">
            <mat-hint>Okul için benzersiz kod (büyük harflerle)</mat-hint>
            <mat-error *ngIf="schoolForm.get('code')?.hasError('required')">
              Okul kodu zorunludur
            </mat-error>
            <mat-error *ngIf="schoolForm.get('code')?.hasError('minlength')">
              Okul kodu en az 3 karakter olmalıdır
            </mat-error>
            <mat-error *ngIf="schoolForm.get('code')?.hasError('pattern')">
              Okul kodu sadece harf ve rakam içerebilir
            </mat-error>
          </mat-form-field>
          <div style="display:none"><button type="submit"></button></div>
        </form>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button mat-button
                mat-dialog-close
                type="button"
                class="cancel-button">
          <mat-icon fontSet="material-symbols-outlined">cancel</mat-icon>
          İptal
        </button>
  <button mat-raised-button
    color="primary"
    type="submit"
    (click)="onSave()"
    [disabled]="schoolForm.invalid || isLoading"
    class="save-button">
          <mat-icon fontSet="material-symbols-outlined">{{ isLoading ? 'pending' : 'save' }}</mat-icon>
          {{ isLoading ? 'Kaydediliyor...' : (data.mode === 'add' ? 'Ekle' : 'Güncelle') }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 100%;
      max-width: 500px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1rem 1.5rem 0 1.5rem;
      margin-bottom: 0;
    }

    .dialog-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.2rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .dialog-content {
      padding: 1rem 1.5rem;
      min-height: 200px;
    }

    .school-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field {
      width: 100%;
    }

    .dialog-actions {
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      border-top: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .cancel-button {
      color: #666;
    }

    .save-button {
      min-width: 120px;
    }

    .save-button[disabled] {
      opacity: 0.6;
    }

    mat-form-field {
      margin-bottom: 1rem;
    }

    mat-hint {
      font-size: 0.75rem;
      color: #666;
    }

    @media (max-width: 768px) {
      .dialog-container {
        max-width: 95vw;
      }

      .dialog-header,
      .dialog-content,
      .dialog-actions {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .dialog-actions {
        flex-direction: column-reverse;
        gap: 0.5rem;
      }

      .cancel-button,
      .save-button {
        width: 100%;
      }
    }
  `]
})
export class SchoolDialogComponent implements OnInit {
  schoolForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SchoolDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SchoolDialogData
  ) {
    this.schoolForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      code: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[A-Z0-9]+$/)]]
    });
  }

  ngOnInit(): void {
    if (this.data.mode === 'edit' && this.data.school) {
      this.schoolForm.patchValue({
        name: this.data.school.name,
        code: this.data.school.code
      });
    }

    // Code alanını büyük harfe çevir
    this.schoolForm.get('code')?.valueChanges.subscribe(value => {
      if (value && typeof value === 'string') {
        const upperValue = value.toUpperCase();
        if (value !== upperValue) {
          this.schoolForm.get('code')?.setValue(upperValue, { emitEvent: false });
        }
      }
    });
  }

  onSave(): void {
    if (this.schoolForm.valid) {
      const formValue = this.schoolForm.value;

      const result = {
        ...formValue,
        id: this.data.school?.id
      };

      this.dialogRef.close(result);
    } else {
      // Form'daki tüm alanları touch yap ki hatalar görünsün
      this.schoolForm.markAllAsTouched();
    }
  }

  onFormEnter(event: Event) {
    try { const target = event.target as HTMLElement; if (target && target.tagName === 'TEXTAREA') return; } catch (e) {}
    event.preventDefault(); this.onSave();
  }
}
