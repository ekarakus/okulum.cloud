import { Component, Inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { apiBase } from '../runtime-config';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, FormsModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>Şifre Değiştir</h2>
  <form mat-dialog-content (ngSubmit)="submit()" autocomplete="on" novalidate>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Mevcut Şifre</mat-label>
  <input #currentInput matInput name="currentPassword" autocomplete="current-password" [type]="showCurrent ? 'text' : 'password'" [(ngModel)]="currentPassword" />
        <button mat-icon-button matSuffix type="button" (click)="toggleShow('current')" [attr.aria-label]="showCurrent ? 'Hide' : 'Show'">
          <mat-icon>{{ showCurrent ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-form-field>

      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Yeni Şifre</mat-label>
        <input matInput name="newPassword" autocomplete="new-password" [type]="showNew ? 'text' : 'password'" [(ngModel)]="newPassword" />
        <button mat-icon-button matSuffix type="button" (click)="toggleShow('new')" [attr.aria-label]="showNew ? 'Hide' : 'Show'">
          <mat-icon>{{ showNew ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-form-field>

      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Yeni Şifre (Tekrar)</mat-label>
        <input matInput name="confirmPassword" autocomplete="new-password" [type]="showConfirm ? 'text' : 'password'" [(ngModel)]="confirmPassword" />
        <button mat-icon-button matSuffix type="button" (click)="toggleShow('confirm')" [attr.aria-label]="showConfirm ? 'Hide' : 'Show'">
          <mat-icon>{{ showConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-form-field>
      <div mat-dialog-actions style="justify-content:flex-end; gap:.5rem;">
        <button mat-button type="button" (click)="close()">İptal</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="isSubmitting">Kaydet</button>
      </div>
    </form>
  `
})
export class ChangePasswordComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isSubmitting = false;
  showCurrent = false;
  showNew = false;
  showConfirm = false;
  @ViewChild('currentInput') currentInput!: ElementRef<HTMLInputElement>;

  ngAfterViewInit(): void {
    // focus the current password input when dialog opens
    try {
      setTimeout(() => this.currentInput?.nativeElement?.focus());
    } catch (e) {}
  }

  constructor(
    public dialogRef: MatDialogRef<ChangePasswordComponent>,
    private http: HttpClient,
    private auth: AuthService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close() {
    this.dialogRef.close();
  }

  toggleShow(which: 'current' | 'new' | 'confirm') {
    if (which === 'current') this.showCurrent = !this.showCurrent;
    if (which === 'new') this.showNew = !this.showNew;
    if (which === 'confirm') this.showConfirm = !this.showConfirm;
  }

  submit() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.snackBar.open('Lütfen tüm alanları doldurun', undefined, { duration: 3000 });
      return;
    }
    if (this.newPassword.length < 6) {
      this.snackBar.open('Yeni şifre en az 6 karakter olmalı', undefined, { duration: 3000 });
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.snackBar.open('Yeni şifre ve tekrarı eşleşmiyor', undefined, { duration: 3000 });
      return;
    }

    const token = this.auth.getToken();
    if (!token) {
      this.snackBar.open('Oturum bulunamadı', undefined, { duration: 3000 });
      return;
    }

  // set isSubmitting in next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
  setTimeout(() => this.isSubmitting = true);
    let headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    headers = headers.set('Content-Type', 'application/json');
  this.http.put(`${apiBase}/api/users/me/password`, { current_password: this.currentPassword, new_password: this.newPassword }, { headers }).subscribe({
      next: () => {
        // schedule state changes after the current change detection cycle
        setTimeout(() => {
          this.isSubmitting = false;
          this.snackBar.open('Şifre başarıyla değiştirildi', undefined, { duration: 3000 });
          this.dialogRef.close(true);
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.isSubmitting = false;
          const msg = err?.error?.message || 'Şifre değiştirilemedi';
          this.snackBar.open(msg, undefined, { duration: 4000 });
        });
      }
    });
  }
}
