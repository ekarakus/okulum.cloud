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

      <div *ngIf="summary" style="display:flex; gap:1rem; flex-direction:row; flex-wrap:wrap; align-items:flex-start;">
        <div style="flex:1 1 40%; display:flex; flex-direction:column; gap:6px;">
          <div style="color:#666; font-size:13px">{{summary.created_at | date:'short'}}</div>
          <div><strong>Detay:</strong> {{summary.issue_details || '-'}}</div>
        </div>
        <div style="flex:1 1 20%; display:flex; flex-direction:column; gap:6px;">
          <div><strong>Durum:</strong> <span class="status-badge" [ngClass]="statusBadgeClass(summary.status)">{{ statusLabel(summary.status) }}</span></div>
          <div><strong>Demirbaş:</strong> {{summary.device_name || (summary.Device?.name) || '-'}}</div>
        </div>
        <div style="flex:1 1 30%; display:flex; flex-direction:column; gap:6px;">
          <div><strong>Oluşturan:</strong> {{creatorLabel(summary.Creator, summary.created_by_user_id)}}</div>
          <div *ngIf="summary.RequestedByEmployee || summary.requested_by_employee_name"><strong>Talep Eden:</strong> {{ summary.RequestedByEmployee?.name || summary.requested_by_employee_name || '-' }}</div>
        </div>
        <div *ngIf="summary.image" style="flex:0 0 120px;">
          <a (click)="openImage(summary.image)" style="cursor:pointer; display:inline-block; border:1px solid #eee; padding:4px; border-radius:6px;">
            <img [src]="thumbnailUrl(summary.image)" style="max-width:120px; max-height:96px; display:block; object-fit:cover;" />
          </a>
        </div>
      </div>

      <div *ngIf="!loading && !error" style="margin-top:16px">
        <h3 style="margin:0 0 8px 0">İşlem Geçmişi</h3>

        <div *ngIf="loadingOperations" style="padding:8px; color:#666; display:flex; align-items:center; gap:8px">
          <mat-progress-spinner diameter="18" mode="indeterminate"></mat-progress-spinner>
          Yükleniyor...
        </div>

        <div *ngIf="!loadingOperations && operations.length === 0" style="padding:8px; color:#666">İşlem kaydı yok.</div>

        <!-- Table with TR rows stacked vertically -->
        <div *ngIf="operations.length > 0" style="overflow:auto; max-height:320px; border:1px solid #eee; border-radius:6px; padding:8px; background:#fff;">
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr style="background:#f7f7f7; color:#333;">
                <th style="text-align:left; padding:8px; font-weight:600; border-bottom:1px solid #e6e6e6; width:160px;">Tarih</th>
                <th style="text-align:left; padding:8px; font-weight:600; border-bottom:1px solid #e6e6e6; width:120px;">Tür</th>
                <th style="text-align:left; padding:8px; font-weight:600; border-bottom:1px solid #e6e6e6; width:140px;">Teknisyen</th>
                <th style="text-align:left; padding:8px; font-weight:600; border-bottom:1px solid #e6e6e6; width:120px;">Tamamlandı</th>
                <th style="text-align:left; padding:8px; font-weight:600; border-bottom:1px solid #e6e6e6;">Açıklama</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let op of operations" style="border-bottom:1px solid #f0f0f0;">
                <td style="padding:10px 8px; vertical-align:top; color:#666; font-size:13px;">
                  {{ op.date ? (op.date | date:'short') : (op.created_at | date:'short') }}
                </td>
                <td style="padding:10px 8px; vertical-align:top; color:#666; font-size:13px;">
                  {{ op.OperationType?.name || op.operation_type_name || op.type || '-' }}
                </td>
                <td style="padding:10px 8px; vertical-align:top; font-size:14px;">
                  {{ op.Technician?.name || op.technician_name || op.technician || '-' }}
                </td>
                <td style="padding:10px 8px; vertical-align:top; font-size:14px;">
                  <span class="op-completed-badge" [ngClass]="opCompletedClass(op)">{{ opCompletedLabel(op) }}</span>
                </td>
                <td style="padding:10px 8px; vertical-align:top; font-size:14px; color:#333;">
                  {{ op.description || op.details || op.note || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
        <button mat-stroked-button (click)="printOperations()" aria-label="Yazdır"><span class="material-symbols-outlined">print</span>&nbsp;Yazdır</button>
        <button mat-stroked-button (click)="dialogRef.close();">Kapat</button>
      </div>
    </div>
  `,
  styles: [`
    /* Status badge styles */
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #fff;
      min-width: 72px;
      text-align: center;
      box-shadow: 0 1px 0 rgba(0,0,0,0.06);
    }
    .status-pending, .status-open { background: #f6a623; /* amber */ }
    .status-in_progress { background: #1976d2; /* blue */ }
    .status-closed { background: #2e7d32; /* green */ }
    .status-other { background: #9e9e9e; /* grey */ }

    /* Operation completion badge base */
    .op-completed-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #fff;
      min-width: 72px;
      text-align: center;
      box-shadow: 0 1px 0 rgba(0,0,0,0.06);
    }
    /* Completed */
    .op-completed-yes { background: #2e7d32; /* green */ }
    /* Not completed / pending */
    .op-completed-no { background: #f6a623; /* amber */ color: #000; }
    /* Unknown/other */
    .op-completed-other { background: #9e9e9e; }

    /* Optional: small size adjustments for tighter table cells */
    table td .op-completed-badge { min-width: 64px; padding: 3px 8px; font-size: 0.8rem; }
  `]
})
export class OperationSupportDialogComponent {
  summary: any = null;
  loading = false;
  error: string | null = null;
  operations: any[] = [];
  loadingOperations = false;

  constructor(public dialogRef: MatDialogRef<OperationSupportDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private http: HttpClient, private cdr: ChangeDetectorRef) {
    if (data && data.supportId) this.loadSummary(data.supportId);
  }

  // Helper to return CSS class for a given status so we can color-code badges
  statusBadgeClass(status: string | null | undefined): string {
    const s = String(status || '').toLowerCase();
    if (s === 'pending' || s === 'open') return 'status-pending';
    if (s === 'in_progress') return 'status-in_progress';
    if (s === 'closed') return 'status-closed';
    return 'status-other';
  }

  // Operation completion helpers
  opCompletedLabel(op: any): string {
    // Prefer explicit boolean field 'is_completed', fallback to 'completed' or 'status' checks
    if (!op) return '-';
    if (typeof op.is_completed === 'boolean') return op.is_completed ? 'Tamamlandı' : 'Bekliyor';
    if (typeof op.completed !== 'undefined') return op.completed ? 'Tamamlandı' : 'Bekliyor';
    // Some operations may store status like 'done' or 'pending'
    const s = String(op.status || op.state || '').toLowerCase();
    if (s === 'done' || s === 'completed' || s === 'tamamlandi' || s === 'finished') return 'Tamamlandı';
    return 'Bekliyor';
  }

  opCompletedClass(op: any): string {
    if (!op) return 'op-completed-other';
    if (typeof op.is_completed === 'boolean') return op.is_completed ? 'op-completed-yes' : 'op-completed-no';
    if (typeof op.completed !== 'undefined') return op.completed ? 'op-completed-yes' : 'op-completed-no';
    const s = String(op.status || op.state || '').toLowerCase();
    if (s === 'done' || s === 'completed' || s === 'tamamlandi' || s === 'finished') return 'op-completed-yes';
    return 'op-completed-no';
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
        // After we have the summary, also load related operations for this support
        try { this.loadOperationsForSupport(id); } catch(e) { /* ignore */ }
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

  loadOperationsForSupport(supportId: number) {
    if (!supportId) return;
    this.loadingOperations = true;
    this.operations = [];
    const token = this.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined as any;
    this.http.get(`${apiBase}/api/operations?support_id=${encodeURIComponent(String(supportId))}`, { headers }).subscribe({
      next: (resp: any) => {
        // Normalize response (either array or { operations: [] })
        const list = Array.isArray(resp) ? resp : (resp && Array.isArray(resp.operations) ? resp.operations : []);
        this.operations = list.sort((a:any,b:any) => { try { return new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime(); } catch(e) { return 0; } });
        this.loadingOperations = false;
        try { this.cdr.detectChanges(); } catch(e) {}
      },
      error: (err:any) => {
        console.error('Error loading operations for support', err);
        this.loadingOperations = false;
        try { this.cdr.detectChanges(); } catch(e) {}
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

  // Open a printer-friendly window with the current support summary and operations, then call print().
  printOperations() {
    try {
      const summary = this.summary || {};
      const ops = Array.isArray(this.operations) ? this.operations : [];

      // Build simple, clean HTML for printing (inline minimal styles)
      const htmlParts: string[] = [];
      htmlParts.push('<!doctype html><html><head><meta charset="utf-8"><title>Destek Talebi Yazdır</title>');
      htmlParts.push('<style>body{font-family:Arial,Helvetica,sans-serif;color:#222;padding:20px}h1{font-size:18px;margin-bottom:8px}h2{font-size:14px;margin:8px 0}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:13px}th{background:#f7f7f7}</style>');
      htmlParts.push('</head><body>');

      htmlParts.push(`<h1>Destek Talebi #${summary.id || ''}</h1>`);
      htmlParts.push(`<div><strong>Tarih:</strong> ${summary.created_at ? new Date(summary.created_at).toLocaleString() : '-'}</div>`);
      htmlParts.push(`<div><strong>Durum:</strong> ${this.statusLabel(summary.status)}</div>`);
      // Creator and requester details
      const creator = summary.Creator || null;
      const requestedBy = summary.RequestedByEmployee || null;
      const creatorLabel = creator ? this.escapeHtml(creator.name || creator.username || '') : this.escapeHtml(summary.created_by_user_id || '-');
      const creatorEmail = creator && creator.email ? this.escapeHtml(creator.email) : '';
      const requesterLabel = requestedBy ? this.escapeHtml(requestedBy.name || requestedBy.username || '') : this.escapeHtml(summary.requested_by_employee_name || '-');
      const requesterContact = requestedBy && (requestedBy.phone || requestedBy.mobile) ? this.escapeHtml(requestedBy.phone || requestedBy.mobile) : (summary.requester_phone ? this.escapeHtml(summary.requester_phone) : '');
      htmlParts.push(`<div style="margin-top:8px"><strong>Oluşturan:</strong> ${creatorLabel}${creatorEmail ? ' &nbsp;<' + creatorEmail + '>' : ''}</div>`);
      htmlParts.push(`<div><strong>Talep Eden:</strong> ${requesterLabel}${requesterContact ? ' &nbsp;(' + requesterContact + ')' : ''}</div>`);
      // Device extra info if available, and location details
      const deviceName = summary.device_name || (summary.Device && (summary.Device.name)) || '';
      const deviceCode = summary.Device && (summary.Device.serial_number || summary.Device.code || summary.Device.tag) ? this.escapeHtml(summary.Device.serial_number || summary.Device.code || summary.Device.tag) : '';
      // Location from Device.Location or summary.location_name
      const loc = (summary.Device && summary.Device.Location) ? summary.Device.Location : (summary.Location ? summary.Location : null);
      const locationLabel = loc ? this.escapeHtml((loc.name || '') + (loc.room_number ? ' (' + loc.room_number + ')' : '')) : (summary.location_name ? this.escapeHtml(summary.location_name) : '');
      if (deviceName || deviceCode || locationLabel) {
        htmlParts.push(`<div><strong>Demirbaş:</strong> ${this.escapeHtml(deviceName)}${deviceCode ? ' &nbsp;(' + deviceCode + ')' : ''}${locationLabel ? ' &nbsp;— Lokasyon: ' + locationLabel : ''}</div>`);
      }
      htmlParts.push(`<div style="margin-top:8px"><strong>Detay:</strong><div style="margin-top:4px">${this.escapeHtml(summary.issue_details || '-')}</div></div>`);

      htmlParts.push('<h2>İşlem Geçmişi</h2>');
      if (ops.length === 0) {
        htmlParts.push('<div>İşlem kaydı yok.</div>');
      } else {
        htmlParts.push('<table><thead><tr><th>Tarih</th><th>Tür</th><th>Teknisyen</th><th>Tamamlandı</th><th>Açıklama</th></tr></thead><tbody>');
        for (const op of ops) {
          const date = op.date ? new Date(op.date).toLocaleString() : (op.created_at ? new Date(op.created_at).toLocaleString() : '-');
          const type = this.escapeHtml(op.OperationType?.name || op.operation_type_name || op.type || '-');
          const tech = this.escapeHtml(op.Technician?.name || op.technician_name || op.technician || '-');
          const completed = this.escapeHtml(this.opCompletedLabel(op));
          const desc = this.escapeHtml(op.description || op.details || op.note || '-');
          htmlParts.push(`<tr><td>${date}</td><td>${type}</td><td>${tech}</td><td>${completed}</td><td>${desc}</td></tr>`);
        }
        htmlParts.push('</tbody></table>');
      }

      htmlParts.push('</body></html>');

      const html = htmlParts.join('');
      const w = window.open('', '_blank');
      if (!w) { alert('Yazdırma penceresi açılamadı. Lütfen tarayıcı ayarlarını kontrol edin.'); return; }
      w.document.open();
      w.document.write(html);
      w.document.close();
      // Give the new window a short moment to render styles before printing
      setTimeout(() => { try { w.focus(); w.print(); } catch (e) { console.error('Print failed', e); } }, 250);
    } catch (e) {
      console.error('printOperations failed', e);
      alert('Yazdırma sırasında hata oluştu. Konsolu kontrol edin.');
    }
  }

  // Minimal HTML escaping to avoid injecting markup into printer output
  escapeHtml(input: any): string {
    if (input === null || input === undefined) return '';
    return String(input).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\'/g, '&#39;');
  }
}
