import { Component, ChangeDetectorRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-container">
      <div class="login-card">
        <!-- Ana Logo -->
        <div style="display:flex; align-items:center; justify-content:center; gap:0.5rem;">
          <!-- Place your PNG at frontend/public/odys-logo.png so it is copied into the build output root -->
          <img [src]="logoSrc" (error)="onLogoError($event)" alt="Okul Demirbaş" class="app-logo" />
        </div>

        <!-- Technology Icons -->
        <div style="display: flex; justify-content: center; gap: 1rem; margin-bottom: 1.5rem; opacity: 0.7;">
          <span class="material-symbols-outlined" style="font-size: 20px; color: #667eea;">memory</span>
          <span class="material-symbols-outlined" style="font-size: 20px; color: #667eea;">developer_board</span>
          <span class="material-symbols-outlined" style="font-size: 20px; color: #667eea;">settings</span>
          <span class="material-symbols-outlined" style="font-size: 20px; color: #667eea;">build</span>
          <span class="material-symbols-outlined" style="font-size: 20px; color: #667eea;">hub</span>
        </div>



        <p style="margin: 1rem 0 0 0; color: #666; font-size: 0.9rem;">
          <span class="material-symbols-outlined" style="font-size: 16px; margin-right: 0.3rem; vertical-align: middle;">admin_panel_settings</span>
          Hesabınızla giriş yapın
        </p>

        <!-- Form alanlarını card içine taşıyoruz -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" style="margin-top: 2rem;">
          <!-- Email Field with Enhanced Styling -->
          <mat-form-field appearance="outline" class="enhanced-field" style="width:100%; margin-bottom: 1rem;">
            <mat-label>
              <span class="material-symbols-outlined" style="font-size: 16px; margin-right: 0.3rem; vertical-align: middle;">alternate_email</span>
              Email Adresi
            </mat-label>
            <input matInput formControlName="email" type="email" required />
            <mat-hint>
              <span class="material-symbols-outlined" style="font-size: 12px; margin-right: 0.2rem; vertical-align: middle;">info</span>
              Sisteme kayıtlı email adresinizi girin
            </mat-hint>
            <mat-error *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
              <span class="material-symbols-outlined" style="font-size: 16px; margin-right: 0.3rem;">error</span>
              <span *ngIf="loginForm.get('email')?.errors?.['required']">Email adresi gereklidir</span>
              <span *ngIf="loginForm.get('email')?.errors?.['email']">Geçerli bir email adresi giriniz</span>
            </mat-error>
          </mat-form-field>

          <!-- Password Field with Enhanced Styling -->
          <mat-form-field appearance="outline" class="enhanced-field" style="width:100%; margin-bottom: 1.5rem;">
            <mat-label>
              <span class="material-symbols-outlined" style="font-size: 16px; margin-right: 0.3rem; vertical-align: middle;">key</span>
              Şifre
            </mat-label>
            <input matInput formControlName="password" [type]="hidePassword ? 'password' : 'text'" required />
            <span matSuffix class="material-symbols-outlined" style="cursor: pointer; color: #667eea; opacity: 0.8; margin-right: 12px;"
                      (click)="hidePassword = !hidePassword">
              {{ hidePassword ? 'visibility' : 'visibility_off' }}
            </span>
            <mat-hint>
              <span class="material-symbols-outlined" style="font-size: 12px; margin-right: 0.2rem; vertical-align: middle;">security</span>
              Güvenli şifrenizi girin
            </mat-hint>
            <mat-error *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              <span class="material-symbols-outlined" style="font-size: 16px; margin-right: 0.3rem;">error</span>
              <span *ngIf="loginForm.get('password')?.errors?.['required']">Şifre alanı boş bırakılamaz</span>
            </mat-error>
          </mat-form-field>

          <!-- Enhanced Login Button -->
          <button mat-raised-button color="primary" type="submit" [disabled]="isLoading || loginForm.invalid"
          style="margin-top:0px;"
          class="login-button">
            <div class="button-content">
              <mat-spinner *ngIf="isLoading" diameter="20" style="margin-right: 0.5rem;"></mat-spinner>
              <span>{{ isLoading ? 'Giriş yapılıyor...' : 'Sisteme Giriş Yap' }}</span>
              <span *ngIf="!isLoading" class="material-symbols-outlined" style="margin-left: 0.5rem;">login</span>
            </div>
          </button>

          <!-- Footer Info -->
          <div class="footer-info">
            <p style="margin: 0; font-size: 0.8rem; color: #999;">
              <span class="material-symbols-outlined" style="font-size: 14px; margin-right: 0.3rem; vertical-align: middle;">verified_user</span>
              Güvenli oturum açma sistemi
            </p>
            <p style="margin: 0.3rem 0 0 0; font-size: 0.75rem; color: #bbb;">v1.0 | Teknoloji Departmanı</p>
          </div>
        </form>
        <!-- Google Sign-In -->
        <div style="margin-top: 0.5rem;">
          <div id="google-signin-button" style="display:flex; justify-content:center;"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: transparent;
    }

  .login-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      padding: 2.5rem;
      box-shadow:
        0 25px 50px rgba(0, 0, 0, 0.2),
        0 10px 20px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.2);
      text-align: center;
  max-width: 500px;
      width: 100%;
      /* static card: removed float/shake animation for stability */
      transform: none;
    }

    /* animation removed intentionally */

    .enhanced-field {
      transition: all 0.3s ease;
    }

    .enhanced-field:hover {
      transform: translateY(-2px);
    }

    .login-button {
      width: 100%;
      height: 50px;
      margin: 1.5rem 0;
      border-radius: 25px;
      background: linear-gradient(45deg, #667eea, #764ba2) !important;
      color: white !important;
      font-weight: 600;
      font-size: 1rem;
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
    }

    .login-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
    }

    .button-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .footer-info {
      margin-top: 2rem;
      text-align: center;
    }

    .mat-mdc-form-field {
      --mdc-outlined-text-field-focus-outline-color: #667eea;
      --mdc-outlined-text-field-hover-outline-color: #764ba2;
    }

    .material-symbols-outlined {
      font-variation-settings:
        'FILL' 0,
        'wght' 400,
        'GRAD' 0,
        'opsz' 24;
    }

    /* Logo image used on login page - put frontend/public/odys-logo.png */
    .app-logo {
      width: 250px;
      height: auto;
      display: block;
      margin: 0 auto 0.5rem;
    }

    /* Global Snackbar Styles */
    ::ng-deep .success-snackbar {
      background-color: #4caf50 !important;
      color: white !important;
    }

    ::ng-deep .error-snackbar {
      background-color: #f44336 !important;
      color: white !important;
    }

    ::ng-deep .mat-snack-bar-container {
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  // start with an absolute path; if it 404s we'll fall back to an embedded data URL
  logoSrc = '/odys-logo.png';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private title: Title
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onLogoError(event: Event) {
    // Fallback to embedded base64 (in case the static file isn't served). Replace with your own if needed.
    this.logoSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
    // prevent infinite loop in case data URL also fails
    (event.target as HTMLImageElement).onerror = null;
  }

  ngAfterViewInit() {
    // Set the browser tab title for the login page
    try { this.title.setTitle('Okul Demirbaş Sistemi - Giriş'); } catch (e) { /* ignore if Title service unavailable */ }
    // Initialize Google Identity Services button if available
    try {
      const env = (window as any).__env || null;
      // prefer angular environment import
      // lazy read of environment to avoid SSR issues
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { environment } = require('../../environments/environment');
      const clientId = environment?.googleClientId;
      if (clientId && (window as any).google && (window as any).google.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
              console.log('Google Identity response callback:', response);
              if (response && response.credential) {
                this.handleGoogleCredential(response.credential);
              } else {
                console.warn('Google callback did not contain credential:', response);
              }
          }
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { theme: 'outline', size: 'large', width: '260' }
        );
      }
    } catch (e) {
      // if require fails in the browser or environment not available, ignore
      console.warn('Google Sign-In init failed', e);
    }
  }

  handleGoogleCredential(id_token: string) {
    // Defer UI state changes to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.isLoading = true;
    }, 0);

    console.log('Sending id_token to backend (truncated):', id_token ? id_token.substring(0, 40) + '...' : id_token);
    this.authService.loginWithGoogle(id_token).subscribe({
      next: (response) => {
        // Defer to next tick so change detection stabilizes
        setTimeout(() => {
          this.isLoading = false;
          this.snackBar.open('Google ile giriş başarılı! Yönlendiriliyorsunuz...', 'Tamam', {
            duration: 2000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          setTimeout(() => this.router.navigate(['/dashboard']), 800);
        }, 0);
      },
      error: (err) => {
        setTimeout(() => {
          this.isLoading = false;
          let msg = 'Google ile giriş başarısız oldu.';
          if (err.status === 404) msg = 'Google hesabınız sistemde kayıtlı değil.';
          if (err.status === 403) msg = 'Hesabınız aktif değil veya okulu atanmamış.';
          this.snackBar.open(msg, 'Tamam', { duration: 5000, panelClass: ['error-snackbar'] });
        }, 0);
      }
    });
  }

  onSubmit() {
    console.log('onSubmit called', this.loginForm.value); // Debug log

    if (this.loginForm.valid) {
      // Defer to next tick to avoid change-detection race
      setTimeout(() => {
        this.isLoading = true;
        this.cdr.detectChanges(); // Manuel change detection
      }, 0);
      console.log('Form is valid, attempting login...'); // Debug log

      const { email, password } = this.loginForm.value;

      try {
        this.authService.login(email, password).subscribe({
          next: (response) => {
            console.log('Login successful:', response); // Debug log
            setTimeout(() => {
              this.isLoading = false;
              this.cdr.detectChanges(); // Manuel change detection

              this.snackBar.open('Giriş başarılı! Yönlendiriliyorsunuz...', 'Tamam', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              });

              // Dashboard'a yönlendir
              setTimeout(() => {
                this.router.navigate(['/dashboard']);
              }, 1000);
            }, 0);
          },
          error: (error) => {
            console.error('Login error occurred:', error); // Debug log
            this.isLoading = false;

            // setTimeout ile asenkron hale getir
            setTimeout(() => {
              // Farklı hata türlerine göre mesaj ayarla
              let errorMessage = '';
              if (error.status === 401) {
                errorMessage = 'Email adresi veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.';
              } else if (error.status === 0) {
                errorMessage = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
              } else if (error.status === 500) {
                errorMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
              } else if (error.status === 403) {
                errorMessage = 'Hesabınız devre dışı bırakılmış. Yöneticiye başvurun.';
              } else if (error.error?.message) {
                errorMessage = error.error.message;
              } else {
                errorMessage = 'Giriş yapılırken beklenmedik bir hata oluştu. Lütfen tekrar deneyin.';
              }

              console.log('Error message set to:', errorMessage); // Debug log
              this.cdr.detectChanges(); // Manuel change detection

              // SnackBar ile hata göster
              this.snackBar.open(errorMessage, 'Tamam', {
                duration: 5000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              });
            }, 0);
          }
        });
      } catch (e) {
        console.error('Unexpected error in login:', e); // Debug log
        this.isLoading = false;

        setTimeout(() => {
          const errorMessage = 'Beklenmedik bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.';
          this.cdr.detectChanges(); // Manuel change detection

          this.snackBar.open(errorMessage, 'Tamam', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }, 0);
      }
    } else {
      console.log('Form is invalid'); // Debug log

      setTimeout(() => {
        // Form geçerli değilse tüm alanları touch et ki hata mesajları görünsün
        Object.keys(this.loginForm.controls).forEach(key => {
          this.loginForm.get(key)?.markAsTouched();
        });
        const errorMessage = 'Lütfen tüm gerekli alanları doğru şekilde doldurun.';
        console.log('Validation error message set to:', errorMessage); // Debug log
        this.cdr.detectChanges(); // Manuel change detection

        // SnackBar ile validation hatası göster
        this.snackBar.open(errorMessage, 'Tamam', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }, 0);
    }
  }
}
