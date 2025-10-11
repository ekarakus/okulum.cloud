import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  host: { 'ngSkipHydration': '' },
  template: `
    <mat-card style="max-width: 400px; margin: 2rem auto; padding: 2rem;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <span class="material-symbols-outlined" style="font-size: 48px; color: #f093fb; margin-bottom: 1rem; display: block;">person_add</span>
        <h2 style="margin: 0; color: #2c3e50;">Kayıt Ol</h2>
      </div>
      <form [formGroup]="form" (ngSubmit)="register()">
        <mat-form-field style="width:100%; margin-bottom: 1rem;">
          <mat-label>Ad Soyad</mat-label>
          <input matInput formControlName="name" required />
        </mat-form-field>
        <mat-form-field style="width:100%; margin-bottom: 1rem;">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" required />
        </mat-form-field>
        <mat-form-field style="width:100%; margin-bottom: 1.5rem;">
          <mat-label>Şifre</mat-label>
          <input matInput formControlName="password" type="password" required />
        </mat-form-field>
        <button mat-raised-button color="primary" type="submit" style="width: 100%; padding: 12px;">
          <span class="material-symbols-outlined" style="margin-right: 0.5rem;">person_add</span>
          Kayıt Ol
        </button>
      </form>
    </mat-card>
  `,
  styles: [`
    @media (max-width: 768px) {
      mat-card {
        max-width: 90% !important;
        margin: 1rem auto !important;
        padding: 1.5rem !important;
      }

      .material-symbols-outlined {
        font-size: 40px !important;
      }

      h2 {
        font-size: 1.5rem !important;
      }

      mat-form-field {
        margin-bottom: 0.5rem !important;
      }

      button {
        padding: 10px !important;
        font-size: 0.9rem !important;
      }
    }

    @media (max-width: 480px) {
      mat-card {
        max-width: 95% !important;
        margin: 0.5rem auto !important;
        padding: 1rem !important;
      }
    }
  `]
})
export class RegisterComponent {
  form: FormGroup;
  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.form = this.fb.group({ name: '', email: '', password: '' });
  }
  register() {
    this.http.post(`${environment.apiUrl}/api/auth/register`, this.form.value).subscribe({
      next: () => {
        alert('Kayıt başarılı!');
      },
      error: () => {
        alert('Kayıt başarısız!');
      }
    });
  }
}
