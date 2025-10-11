import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { apiBase } from '../runtime-config';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-global-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  template: `
    <div class="container">
      <h1 class="page-title">
        <span class="material-symbols-outlined">settings</span>
        Global Ayarlar (SMTP)
      </h1>

      <mat-card class="form-card">
        <form (ngSubmit)="save()" #smtpForm="ngForm">
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Sağlayıcı</mat-label>
              <mat-select [(ngModel)]="model.provider" name="provider">
                <mat-option value="gmail">Gmail</mat-option>
                <mat-option value="custom">Özel SMTP</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>SMTP Host</mat-label>
              <input matInput [(ngModel)]="model.smtp_host" name="smtp_host" placeholder="smtp.gmail.com" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>SMTP Port</mat-label>
              <input matInput type="number" [(ngModel)]="model.smtp_port" name="smtp_port" placeholder="465 veya 587" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Güvenli (SSL/TLS)</mat-label>
              <mat-select [(ngModel)]="model.smtp_secure" name="smtp_secure">
                <mat-option [value]="true">Evet</mat-option>
                <mat-option [value]="false">Hayır</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Kullanıcı (Email)</mat-label>
              <input matInput [(ngModel)]="model.smtp_user" name="smtp_user" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Parola / Uygulama Şifresi</mat-label>
              <input matInput [(ngModel)]="model.smtp_password" name="smtp_password" type="password" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Gönderen Adı</mat-label>
              <input matInput [(ngModel)]="model.from_name" name="from_name" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Gönderen Email</mat-label>
              <input matInput [(ngModel)]="model.from_email" name="from_email" />
            </mat-form-field>
          </div>

          <div class="actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="saving">
              <span class="material-symbols-outlined" *ngIf="!saving">save</span>
              <span class="material-symbols-outlined spin" *ngIf="saving">progress_activity</span>
              Kaydet
            </button>
            <button mat-stroked-button type="button" (click)="load()" [disabled]="saving">Yenile</button>
            <span class="spacer"></span>
            <mat-form-field appearance="outline" class="test-email-field">
              <mat-label>Test Email</mat-label>
              <input matInput [(ngModel)]="testEmail" name="test_email" placeholder="test@ornek.com" />
            </mat-form-field>
            <button mat-stroked-button color="accent" type="button" (click)="sendTest()" [disabled]="sendingTest || !testEmail">Test Gönder</button>
          </div>
          <div class="info-text">
            Gmail kullanıyorsanız 2FA açıkken <strong>Uygulama Şifresi</strong> girmeniz gerekir. Özel SMTP için host/port bilgilerini doldurun.
          </div>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { max-width: 900px; margin: 0 auto; padding: 1.5rem; }
    .page-title { display:flex; align-items:center; gap:.6rem; font-size:1.6rem; font-weight:600; margin:0 0 1.2rem; }
    .form-card { padding:1rem 1.25rem; border-radius:16px; }
    form { display:block; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap:1rem; }
    .col-span-2 { grid-column: span 2; }
    @media (max-width:600px){ .col-span-2 { grid-column: span 1; } }
    .actions { margin-top:1.5rem; display:flex; gap:.75rem; }
  .actions .spacer { flex:1; }
  .test-email-field { width:220px; }
    .info-text { margin-top:1rem; font-size:.8rem; color:#555; line-height:1.3; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
  `]
})
export class GlobalSettingsComponent implements OnInit {
  model: any = {
    provider: 'gmail',
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: ''
  };
  saving = false;
  sendingTest = false;
  testEmail = '';

  constructor(private http: HttpClient, private auth: AuthService, @Inject(PLATFORM_ID) private platformId: Object) {}

  private getHeaders() {
    const token = this.auth.getToken();
    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
  }

  ngOnInit(): void {
    this.load();
  }

  load() {
    const headers = this.getHeaders();
  this.http.get<any>(`${apiBase}/api/global-settings`, { headers }).subscribe({
      next: data => {
        if (data) this.model = { ...this.model, ...data };
      },
      error: err => console.error('Ayarlar alınamadı', err)
    });
  }

  save() {
    this.saving = true;
    const headers = this.getHeaders();
  this.http.put(`${apiBase}/api/global-settings`, this.model, { headers }).subscribe({
      next: _ => {
        this.saving = false;
        alert('Ayarlar kaydedildi');
      },
      error: err => {
        this.saving = false;
        alert('Kaydedilemedi');
        console.error(err);
      }
    });
  }

  sendTest() {
    if (!this.testEmail) return;
    this.sendingTest = true;
    const headers = this.getHeaders();
  this.http.post(`${apiBase}/api/global-settings/test-email`, { to: this.testEmail }, { headers }).subscribe({
      next: _ => { this.sendingTest = false; alert('Test email gönderildi'); },
      error: err => { this.sendingTest = false; alert('Test email gönderilemedi'); console.error(err); }
    });
  }
}
