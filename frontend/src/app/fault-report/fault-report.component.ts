import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { apiBase } from '../runtime-config';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-fault-report',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
  template: `
    <div class="container">
      <mat-card>
  <h2>Destek Talepleri</h2>

        <div *ngIf="isLoading" class="loader"><mat-progress-spinner mode="indeterminate"></mat-progress-spinner></div>

        <div style="margin-top:12px">
          <label>Kayıtlı Demirbaş (isteğe bağlı)</label>
          <mat-form-field style="width:100%">
            <mat-select [(ngModel)]="deviceId" placeholder="Demirbaş seçin (opsiyonel)">
              <mat-option [value]="null">-- Seçme --</mat-option>
              <mat-option *ngFor="let d of devices" [value]="d.id">{{d.name}} ({{d.identity_no || d.serial_no}})</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div style="margin-top:12px">
          <label>Arıza Detayı</label>
          <mat-form-field style="width:100%">
            <textarea matInput rows="6" [(ngModel)]="issueDetails" placeholder="Arıza ile ilgili detayları girin"></textarea>
          </mat-form-field>
        </div>

        <div style="margin-top:12px">
          <label>Görsel (isteğe bağlı)</label>
          <input type="file" (change)="onFileChange($event)" />
          <div *ngIf="uploading">Yükleniyor...</div>
          <div *ngIf="imagePreviewUrl" style="margin-top:8px">
            <div style="margin-bottom:6px;">Önizleme:</div>
            <img [src]="imagePreviewUrl" alt="preview" style="max-width:100%; max-height:240px; border-radius:6px; border:1px solid #e0e0e0;" />
          </div>
          <div *ngIf="imagePath" style="margin-top:8px">Sunucu yolu: <a [href]="'/'+imagePath" target="_blank">{{imagePath}}</a></div>
        </div>

        <div style="margin-top:18px; display:flex; gap:8px;">
          <button mat-raised-button color="primary" (click)="submit()" [disabled]="submitting || uploading">Kaydet</button>
          <button mat-stroked-button (click)="resetForm()">Temizle</button>
        </div>

        <div *ngIf="error" style="color:#b00020; margin-top:8px">{{error}}</div>
        <div *ngIf="success" style="color:green; margin-top:8px">Kayıt başarıyla oluşturuldu.</div>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { padding: 1rem; max-width: 900px; margin: 0 auto; }
    mat-card { padding: 1rem; border-radius: 10px; }
  `]
})
export class FaultReportComponent implements OnInit {
  devices: any[] = [];
  deviceId: number | null = null;
  issueDetails = '';
  imagePath: string | null = null;
  imagePreviewUrl: string | null = null;
  uploading = false;
  submitting = false;
  isLoading = false;
  error: string | null = null;
  success = false;

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadDevices();
  }

  getHeaders(json = true) {
    const token = this.auth.getToken();
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (json) headers['Content-Type'] = 'application/json';
    return { headers };
  }

  loadDevices() {
    const token = this.auth.getToken();
    const opts: any = {};
    if (token) opts.headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const selected = this.auth.getSelectedSchool();
  if (!selected) return;
  this.isLoading = true;
  let url = `${apiBase}/api/devices`;
  url += `?school_id=${selected.id}`;
  this.http.get<any[]>(url, opts as any).subscribe({ next: (res: any) => { this.devices = res || []; this.isLoading = false; }, error: (e: any) => { console.error('load devices', e); this.isLoading = false; } });
  }

  async onFileChange(ev: any) {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    this.uploading = true;
    this.error = null;
    // create object URL for instant preview
    try {
      if (this.imagePreviewUrl) URL.revokeObjectURL(this.imagePreviewUrl);
      this.imagePreviewUrl = URL.createObjectURL(f);
    } catch (e) { /* ignore on server or unsupported env */ }
    try {
      const fd = new FormData();
      fd.append('file', f);
      const token = this.auth.getToken();
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res: any = await this.http.post(`${apiBase}/api/upload/fault-image`, fd, { headers }).toPromise();
      if (res && res.path) this.imagePath = res.path;
    } catch (err:any) {
      console.error('upload error', err);
      this.error = err?.error?.message || err?.message || 'Yükleme hatası';
    } finally {
      this.uploading = false;
    }
  }

  submit() {
  const selected = this.auth.getSelectedSchool();
  if (!selected) { this.error = 'Okul seçimi gerekli.'; return; }
  if (!this.issueDetails || this.issueDetails.trim().length < 10) { this.error = 'Arıza detayı en az 10 karakter olmalı.'; return; }
    this.submitting = true;
    this.error = null;
    this.success = false;
    const payload: any = {
      school_id: selected.id,
      device_id: this.deviceId || null,
      issue_details: this.issueDetails,
      image: this.imagePath || null
    };
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }) : new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post(`${apiBase}/api/faults`, payload, { headers }).subscribe({ next: (res) => { this.success = true; this.resetForm(); this.submitting = false; }, error: (e) => { console.error('create fault', e); this.error = e?.error?.message || 'Kayıt sırasında hata oldu'; this.submitting = false; } });
  }

  resetForm() {
    this.deviceId = null;
    this.issueDetails = '';
    this.imagePath = null;
    if (this.imagePreviewUrl) { try { URL.revokeObjectURL(this.imagePreviewUrl); } catch(e){} }
    this.imagePreviewUrl = null;
    this.error = null;
    this.success = false;
  }
}
