import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { apiBase } from '../runtime-config';

@Component({
  selector: 'app-operation-support-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div style="padding:16px; max-width:720px">
      <h2 style="display:flex; align-items:center; gap:10px; margin:0 0 8px 0;">
        <span class="material-symbols-outlined">support_agent</span>
        Destek Talebi #{{ summary?.id || data?.supportId || '-' }}
      </h2>

  <div *ngIf="loading" style="padding:12px; color:#666; display:flex; align-items:center; gap:8px"><mat-progress-spinner diameter="20" mode="indeterminate"></mat-progress-spinner>Yükleniyor...</div>
      <div *ngIf="error" style="padding:12px; color:#b00020">{{error}}</div>

      <div *ngIf="!loading && !error && !summary" style="padding:12px; color:#666">Destek bilgisi bulunamadı.</div>

      <div *ngIf="summary" style="display:flex; gap:1rem; flex-direction:column;">
        <div style="color:#666; font-size:13px">{{summary.created_at | date:'short'}}</div>
        <div><strong>Detay:</strong> {{summary.issue_details || '-'}}</div>
        <div><strong>Durum:</strong> {{ statusLabel(summary.status) }}</div>
        <div><strong>Demirbaş:</strong> {{summary.device_name || (summary.Device?.name) || '-'}}</div>
        <div>
          <strong>Oluşturan:</strong>
          <div style="margin-left:8px">{{creatorLabel(summary.Creator, summary.created_by_user_id)}}</div>
        </div>
        <div *ngIf="summary.RequestedByEmployee || summary.requested_by_employee_name">
          <strong>Talep Eden:</strong>
          <div style="margin-left:8px">{{ summary.RequestedByEmployee?.name || summary.requested_by_employee_name || '-' }}</div>
        </div>
        <div *ngIf="summary.image">
          <strong>Görsel:</strong>
          <div style="margin-top:6px">
            <a (click)="openImage(summary.image)" style="cursor:pointer; display:inline-block; border:1px solid #eee; padding:4px; border-radius:6px;">
              <img [src]="thumbnailUrl(summary.image)" style="max-width:140px; max-height:120px; display:block; object-fit:cover;" />
            </a>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
        <button mat-stroked-button (click)="dialogRef.close();">Kapat</button>
      </div>
    </div>
  `
})
export class OperationSupportDialogComponent {
  summary: any = null;
  loading = false;
  error: string | null = null;

  constructor(public dialogRef: MatDialogRef<OperationSupportDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private http: HttpClient, private cdr: ChangeDetectorRef) {
    if (data && data.supportId) this.loadSummary(data.supportId);
  }

  thumbnailUrl(path: string) {
    // For now use the API server directly — ensure path starts with '/'
    if (!path) return '';
    const p = path.startsWith('/') ? path : '/' + path;
    // do not attempt special resizing, just return full path (browser will shrink via CSS)
    const base = (apiBase || '').endsWith('/') ? (apiBase || '').slice(0, -1) : (apiBase || '');
    return `${base}${p}`;
  }

  openImage(path: string) {
    if (!path) return;
    const p = path.startsWith('/') ? path : '/' + path;
    const base = (apiBase || '').endsWith('/') ? (apiBase || '').slice(0, -1) : (apiBase || '');
    const url = `${base}${p}`;
    try { window.open(url, '_blank'); } catch (e) { console.error('openImage failed', e); }
  }

  private getToken(): string | null { try { return localStorage.getItem('token'); } catch(e) { return null; } }

  loadSummary(id: number) {
    this.loading = true; this.error = null;
    const token = this.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined as any;
    console.debug('OperationSupportDialog: fetching fault', id);
    this.http.get(`${apiBase}/api/faults/${id}`, { headers }).subscribe({
      next: (resp: any) => {
        console.debug('OperationSupportDialog: got resp', resp);
        this.summary = resp && resp.fault ? resp.fault : resp;
        this.loading = false;
        try { this.cdr.detectChanges(); } catch(e) { /* swallow */ }
      },
      error: (err: any) => {
        console.error('Error loading fault summary', err);
        this.error = err?.error?.message || err?.message || 'Destek verisi yüklenemedi';
        this.loading = false;
        try { this.cdr.detectChanges(); } catch(e) { /* swallow */ }
      }
    });
  }

  statusLabel(status: string | null | undefined): string {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'open': return 'Bekliyor';
      case 'in_progress': return 'İşlemde';
      case 'closed': return 'Kapandı';
      default: return status || '-';
    }
  }

  creatorLabel(creatorObj: any, fallbackId: any): string {
    if (creatorObj) {
      const parts: string[] = [];
      if (creatorObj.name) parts.push(creatorObj.name);
      else if (creatorObj.username) parts.push(creatorObj.username);
      if (creatorObj.email) parts.push(`<${creatorObj.email}>`);
      return parts.join(' ');
    }
    return fallbackId ? String(fallbackId) : '-';
  }
}
