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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-student-bulk-upload-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>XLS ile Öğrenci Yükle</h2>
    <div mat-dialog-content style="position:relative;">
  <p>Lütfen XLS veya XLSX formatında dosya yükleyiniz. Beklenen başlıklar (sırası önemli): <strong>SINIF, NO, ADI, SOYADI, DOĞUM TARİHİ (gg/aa/YYYY veya gg-aa-YYYY)</strong></p>
      <div style="display:flex; align-items:center; gap:8px;">
        <input type="file" accept=".xls,.xlsx" (change)="onFile($event)" [disabled]="isUploading" />
        <button mat-button (click)="downloadTemplate()" style="margin-left:8px;" [disabled]="isUploading">Örnek Dosya İndir</button>
      </div>

      <div *ngIf="isUploading" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background: rgba(255,235,59,0.5); z-index:50; flex-direction:column; gap:16px; padding:20px;">
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
              {{ e.student_no ? ('No: ' + e.student_no) : ('Satır ' + e.row) }}
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
export class StudentBulkUploadDialogComponent {
  selectedFile: File | null = null;
  errors: any[] = [];
  serverError: string | null = null;
  headerErrors: string[] = [];
  isUploading: boolean = false;

  constructor(public dialogRef: MatDialogRef<StudentBulkUploadDialogComponent>, private http: HttpClient, private auth: AuthService, private snack: MatSnackBar, private cdr: ChangeDetectorRef) {}

  onFile(e: any) {
    const f: File = e.target.files && e.target.files[0];
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!ext || (ext !== 'xls' && ext !== 'xlsx')) { this.serverError = 'Sadece .xls veya .xlsx dosyası yükleyiniz'; return; }
    this.selectedFile = f; this.serverError = null; this.errors = []; this.headerErrors = [];
  }

  async downloadTemplate() {
  // Column order requested by user: SINIF, NO, ADI, SOYADI, DOĞUM TARİHİ
  const headers = ['SINIF','NO','ADI','SOYADI','DOĞUM TARİHİ'];
  // Only include headers in the downloadable template to avoid shipping example/mock class values.
  const sample: any[][] = [headers];

    try {
      // @ts-ignore
      const XLSX = (await import('xlsx')) as any;
      const ws = XLSX.utils.aoa_to_sheet(sample);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const wbout: ArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'ogrenci-template.xlsx'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      return;
    } catch (err) {
      console.warn('SheetJS not available or failed, falling back to CSV', err);
      const csvBody = sample.map(r => r.map(c => '"' + ('' + (c||'')).replace(/"/g, '""') + '"').join(',')).join('\r\n');
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvBody], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'ogrenci-template.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
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

    this.http.post(`${apiBase}/api/students/upload`, fd, { headers }).subscribe({ next: (res: any) => {
        this.isUploading = false;
        this.selectedFile = null; this.errors = []; this.headerErrors = []; this.serverError = null;
        this.snack.open('Öğrenciler yüklendi, liste güncelleniyor...', 'Kapat', { duration: 3000 });
        this.dialogRef.close(res);
      }, error: (err) => {
        console.error('Upload error response:', err);
        let e: any = err?.error;
        if (typeof e === 'string') {
          try { e = JSON.parse(e); } catch (parseErr) { /* leave as string */ }
        }

        this.headerErrors = [];
        this.errors = [];
        this.serverError = null;

        if (e) {
          if (typeof e === 'string') {
            this.serverError = e;
          } else {
            if (Array.isArray(e.details)) this.headerErrors = e.details;
            if (Array.isArray(e.rows)) this.errors = e.rows;
            if (!this.headerErrors.length && !this.errors.length) {
              this.serverError = e.error || e.message || null;
            }
          }
        } else {
          this.serverError = err?.message || 'Yükleme hatası';
        }

        this.isUploading = false;
        try { this.cdr.detectChanges(); } catch (dErr) { /* ignore */ }
      } });
  }

  onClose() { this.dialogRef.close(null); }
}
