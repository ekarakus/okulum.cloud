import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { apiBase } from '../runtime-config';
import { AuthService } from '../services/auth.service';
import { EmployeeTypeService } from '../services/employee-type.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-school-employees-upload-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>XLS ile Yükle</h2>
    <div mat-dialog-content style="position:relative;">
  <p>Lütfen XLS veya XLSX formatında dosya yükleyiniz. Beklenen başlıklar (sırası önemli): <strong>Ad Soyad, Görevi, Branş, E-mail</strong></p>
      <p>Görev (Görevi) sadece sistemde tanımlı <em>personel tipleri</em> ile eşleşmelidir.</p>
      <div style="display:flex; align-items:center; gap:8px;">
        <input type="file" accept=".xls,.xlsx" (change)="onFile($event)" [disabled]="isUploading" />
        <button mat-button (click)="downloadTemplate()" style="margin-left:8px;" [disabled]="isUploading">Örnek Dosya İndir</button>
      </div>

      <!-- prominent overlay while uploading -->
      <div *ngIf="isUploading" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background: rgba(255,235,59,0.5); z-index:50; flex-direction:column; gap:16px; padding:20px;">
        <!-- make spinner larger and dark for contrast against yellow -->
        <mat-progress-spinner style="color: rgba(33,33,33,0.95);" diameter="96" mode="indeterminate"></mat-progress-spinner>
        <div style="color:#212121; font-weight:800; font-size:1.15rem; text-align:center;">Yükleniyor — lütfen bekleyiniz...</div>
        <div style="color:#212121; opacity:0.95; font-size:0.95rem; text-align:center; max-width:360px;">İşlem tamamlandığında bu pencere otomatik olarak kapanacaktır. Lütfen sayfayı yenilemeyin veya pencereyi kapatmayın.</div>
      </div>

      <div *ngIf="headerErrors?.length" style="color:crimson; margin-top:8px;">
        <h4>Başlık Hataları</h4>
        <ul>
          <li *ngFor="let h of headerErrors">{{ h }}</li>
        </ul>
      </div>

      <div *ngIf="errors?.length" style="margin-top:8px;">
        <h4>Satır Hataları</h4>
        <ul>
          <li *ngFor="let e of errors" style="color:crimson">
            <strong>
              {{ e.name ? (e.name + (e.email ? ' (' + e.email + ')' : '')) : ('Satır ' + e.row) }}
            </strong>
            : {{ e.errors.join(', ') }}
          </li>
        </ul>
      </div>

      <div *ngIf="serverError" style="color:crimson; margin-top:8px;">{{ serverError }}</div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onClose()" [disabled]="isUploading">Kapat</button>
      <button mat-raised-button color="primary" (click)="upload()" [disabled]="!selectedFile || isUploading">Yükle</button>
    </div>
  `
})
export class SchoolEmployeesUploadDialogComponent {
  selectedFile: File | null = null;
  errors: any[] = [];
  serverError: string | null = null;
  headerErrors: string[] = [];
  isUploading: boolean = false;

  constructor(public dialogRef: MatDialogRef<SchoolEmployeesUploadDialogComponent>, private http: HttpClient, private auth: AuthService, private empTypeSvc: EmployeeTypeService, private snack: MatSnackBar, private cdr: ChangeDetectorRef) {}

  onFile(e: any) {
    const f: File = e.target.files && e.target.files[0];
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!ext || (ext !== 'xls' && ext !== 'xlsx')) { this.serverError = 'Sadece .xls veya .xlsx dosyası yükleyiniz'; return; }
    this.selectedFile = f; this.serverError = null; this.errors = [];
  }

  async downloadTemplate() {
    const headers = ['Ad Soyad','Görevi','Branş','E-mail'];
    // fetch employee types and build one sample row per type
    let sample: any[][] = [headers];
    try {
  const types: any[] = (await this.empTypeSvc.list().toPromise()) || [];
  if (Array.isArray(types) && types.length) {
        types.forEach(t => sample.push([`Örnek ${t.name}`, t.name || '', '', `${t.name?.toLowerCase().replace(/\s+/g,'') || 'example'}@example.com`]));
      } else {
        sample.push(['Ahmet Yılmaz','Öğretmen','Matematik','ahmet@example.com']);
        sample.push(['Ayşe Demir','Müdür','','ayse@example.com']);
      }
    } catch (e) {
      // if fetch fails, include two default rows
      sample.push(['Ahmet Yılmaz','Öğretmen','Matematik','ahmet@example.com']);
      sample.push(['Ayşe Demir','Müdür','','ayse@example.com']);
    }

    // Try to dynamically import SheetJS to generate a real .xlsx
    try {
  // @ts-ignore - dynamic import of optional dependency; types may not be installed in this project
  const XLSX = (await import('xlsx')) as any;
      const ws = XLSX.utils.aoa_to_sheet(sample);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      // write as array buffer to preserve UTF-8 characters
      const wbout: ArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'personel-template.xlsx'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      return;
    } catch (err) {
      console.warn('SheetJS not available or failed, falling back to CSV', err);
      // fallback to CSV (legacy behavior)
      const csvBody = sample.map(r => r.map(c => '"' + ('' + (c||'')).replace(/"/g, '""') + '"').join(',')).join('\r\n');
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvBody], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'personel-template.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      this.snack.open('Gerçek .xlsx oluşturulamadı — lütfen `npm install` çalıştırıp yeniden deneyin (xlsx paketini yükleyin).', 'Kapat', { duration: 5000 });
      return;
    }
  }

  upload() {
    if (!this.selectedFile) return;
    this.isUploading = true;
    const fd = new FormData();
    fd.append('file', this.selectedFile);
    const school = this.auth.getSelectedSchool();
    if (school) fd.append('schoolId', school.id.toString());

    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.http.post(`${apiBase}/api/school-employees/upload`, fd, { headers }).subscribe({ next: (res: any) => {
        // success: reset state, show snackbar, and close
        this.isUploading = false;
        this.selectedFile = null; this.errors = []; this.headerErrors = []; this.serverError = null;
        this.snack.open('Personeller yüklendi, liste güncelleniyor...', 'Kapat', { duration: 3000 });
        this.dialogRef.close(res);
      }, error: (err) => {
        // Robust error parsing: backend may return JSON or plain text
        console.error('Upload error response:', err);
        let e: any = err?.error;
        // If server returned a stringified JSON in err.error, try to parse
        if (typeof e === 'string') {
          try { e = JSON.parse(e); } catch (parseErr) { /* leave as string */ }
        }

        // Initialize
        this.headerErrors = [];
        this.errors = [];
        this.serverError = null;

        if (e) {
          if (typeof e === 'string') {
            // plain error message
            this.serverError = e;
          } else {
            // structured object
            if (Array.isArray(e.details)) this.headerErrors = e.details;
            if (Array.isArray(e.rows)) this.errors = e.rows;
            if (!this.headerErrors.length && !this.errors.length) {
              // try common fields
              this.serverError = e.error || e.message || null;
            }
          }
        } else {
          // no body, fallback to err.message
          this.serverError = err?.message || 'Yükleme hatası';
        }

        this.isUploading = false;
        // ensure UI updates immediately
        try { this.cdr.detectChanges(); } catch (dErr) { /* ignore */ }
      } });
  }

  onClose() { this.dialogRef.close(null); }
}
