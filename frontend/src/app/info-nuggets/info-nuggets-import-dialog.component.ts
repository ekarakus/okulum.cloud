import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChangeDetectorRef } from '@angular/core';
import { apiBase } from '../runtime-config';
import { AuthService } from '../services/auth.service';

import * as XLSX from 'xlsx';

@Component({
  selector: 'app-info-nuggets-import-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatListModule, MatFormFieldModule, MatInputModule, FormsModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>Bilgi Kartları - XLS İçeri Aktar</h2>
    <mat-dialog-content>
      <p>Buradan .xls veya .xlsx dosyası yükleyerek toplu bilgi kartı ekleyebilirsiniz.</p>

      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <input type="file" accept=".xls,.xlsx" (change)="onFileSelected($event)" />
        <button mat-stroked-button color="primary" (click)="downloadTemplate()">
          <mat-icon fontSet="material-symbols-outlined">download</mat-icon>
          Şablonu İndir
        </button>
      </div>

      <div style="font-size:0.9rem;color:#444;margin-bottom:8px">
        <div><strong>Tarih formatı:</strong> dd.mm.YYYY (ayırıcı olarak <code>.</code>, <code>-</code> veya <code>/</code> kabul edilir). Örnek: 31.12.2025 veya 31/12/2025</div>
        <div><strong>Saat formatı:</strong> HH:MM veya HH:MM:SS (24 saat). Örnek: 09:30 veya 14:05:00</div>
      </div>

      <div *ngIf="fileName">Seçilen dosya: <strong>{{ fileName }}</strong></div>

      <div *ngIf="isUploading" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.85); z-index:50; flex-direction:column; gap:12px; padding:20px;">
        <mat-progress-spinner diameter="80" mode="indeterminate"></mat-progress-spinner>
        <div style="font-weight:800; font-size:1.05rem; text-align:center;">Yükleniyor — lütfen bekleyiniz...</div>
        <div style="max-width:420px; text-align:center; opacity:0.95;">İşlem uzun sürebilir; dosya boyutuna göre birkaç saniye veya daha fazla sürebilir. İşlem tamamlandığında bu pencere otomatik olarak kapanacaktır.</div>
      </div>

      <div *ngIf="foundCategories?.length">
        <h4>Dosyada bulunan kategoriler</h4>
        <mat-list>
          <mat-list-item *ngFor="let c of foundCategories">
            <span>{{c}}</span>
            <span style="flex:1 1 auto"></span>
            <span *ngIf="!isCategoryKnown(c)" style="color:#d32f2f;font-weight:600">(Sistemde yok)</span>
          </mat-list-item>
        </mat-list>
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
          <li *ngFor="let e of errors" style="color:crimson">Satır {{ e.row }}: {{ e.errors.join(', ') }}</li>
        </ul>
      </div>

      <div style="margin-top:8px">
        <h4>Beklenen kategori isimleri (sistem)</h4>
        <mat-list>
          <mat-list-item *ngFor="let sc of categories">{{ sc.name }}</mat-list-item>
        </mat-list>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isUploading">İptal</button>
      <button mat-raised-button color="primary" (click)="onUpload()" [disabled]="!selectedFile || isUploading">Yükle</button>
    </mat-dialog-actions>
  `
})
export class InfoNuggetsImportDialogComponent implements OnInit {
  selectedFile: File | null = null;
  fileName = '';
  foundCategories: string[] = [];
  unknownCategories: string[] = [];
  categories: any[] = [];
  isUploading: boolean = false;
  headerErrors: string[] = [];
  errors: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<InfoNuggetsImportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private auth: AuthService
    , private snack: MatSnackBar, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // load categories passed via data or fetch
    if (this.data && this.data.categories) this.categories = this.data.categories;
    else this.loadCategories();
  }

  loadCategories() {
    const token = this.auth.getToken();
    if (!token) return;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>(`${apiBase}/api/info-nugget-categories`, { headers }).subscribe(r => this.categories = r || []);
  }

  onFileSelected(ev: any) {
    const f: File = ev.target.files[0];
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!ext || (ext !== 'xls' && ext !== 'xlsx')) { alert('Sadece .xls veya .xlsx dosyaları yükleyebilirsiniz.'); return; }
    this.selectedFile = f; this.fileName = f.name;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });
        // assume there is a column named 'category' (case-insensitive)
        const catCol = this.detectCategoryColumn(sheet);
        const cats = new Set<string>();
        if (catCol) {
          json.forEach((row: any) => {
            const val = (row[catCol] || '').toString().trim(); if (val) cats.add(val);
          });
        }
        this.foundCategories = Array.from(cats).sort();
        this.unknownCategories = this.foundCategories.filter(c => !this.categories.find(x => x.name === c));
      } catch (err) { console.error('XLS parse hata', err); alert('Dosya okunurken hata oluştu.'); }
    };
    reader.readAsArrayBuffer(f);
  }

  detectCategoryColumn(sheet: any): string | null {
    // read header row and try to match 'category' ignoring case
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: '' }) || [];
    const headers: any[] = rows[0] || [];
    for (let i = 0; i < headers.length; i++) {
      const h = (headers[i] || '').toString().toLowerCase();
      if (['category', 'kategori', 'category_name', 'kategori_ad'].includes(h)) return headers[i];
    }
    // fallback: try 'category' as key in object rows
    return 'category';
  }

  isCategoryKnown(name: string) { return !!this.categories.find(c => c.name === name); }

  downloadTemplate() {
    // build a simple workbook with headers + one example row (Turkish)
    const wb = XLSX.utils.book_new();
    const sampleCategory = (this.categories && this.categories.length) ? (this.categories[0].name || 'Duyurular') : 'Duyurular';
    const data = [
      [
        'Başlık',
        'İçerik',
        'Kategori',
        'Başlangıç Tarihi',
        'Bitiş Tarihi',
        'Yayın Başlangıç Saati',
        'Yayın Bitiş Saati'
      ],
      [
        'Okul Duyurusu',
        'Okulumuzda yeni kütüphane açıldı. Detaylar okul panosunda ve web sitesinde yayınlanacaktır.',
        sampleCategory,
        '01.11.2025',
        '30.11.2025',
        '09:00',
        '17:00'
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'info-nuggets-template.xlsx'; a.click(); URL.revokeObjectURL(url);
  }

  onUpload() {
    if (!this.selectedFile) return;
    const token = this.auth.getToken(); if (!token) { this.snack.open('Yetkilendirme yok', 'Kapat', { duration: 4000 }); return; }
    this.isUploading = true; this.headerErrors = []; this.errors = [];
    const form = new FormData(); form.append('file', this.selectedFile);
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.post(`${apiBase}/api/info-nuggets/upload`, form, { headers }).subscribe({ next: (res:any) => {
        this.isUploading = false; this.snack.open('Yükleme tamamlandı', 'Kapat', { duration: 3000 });
        this.dialogRef.close({ success: true, result: res });
      }, error: (err) => {
        console.error('Upload error response:', err);
        let e: any = err?.error;
        try { if (typeof e === 'string') e = JSON.parse(e); } catch (parseErr) { /* ignore */ }

        this.headerErrors = []; this.errors = [];
        if (e) {
          if (typeof e === 'string') {
            this.snack.open(e, 'Kapat', { duration: 6000 });
          } else {
            if (Array.isArray(e.missing)) {
              this.headerErrors = e.missing.map((m: any) => 'Eksik başlık: ' + m);
            }
            if (Array.isArray(e.rows)) this.errors = e.rows;
            if (!this.headerErrors.length && !this.errors.length) {
              const msg = e.error || e.message || 'Yükleme hatası';
              this.snack.open(msg, 'Kapat', { duration: 6000 });
            }
          }
        } else {
          this.snack.open(err?.message || 'Yükleme hatası', 'Kapat', { duration: 6000 });
        }

        this.isUploading = false;
        try { this.cdr.detectChanges(); } catch (dErr) {}
      } });
  }

  onCancel() { this.dialogRef.close(null); }
}
