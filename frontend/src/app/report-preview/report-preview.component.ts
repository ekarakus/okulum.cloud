import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
// no settings dialog for QR printing — we use fixed 35mm squares
import QRCode from 'qrcode';
import { AuthService } from '../services/auth.service';
import { apiBase } from '../runtime-config';

@Component({
  selector: 'app-report-preview',
  imports: [CommonModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  standalone: true,
  template: `
    <div class="page-container">
      <div *ngIf="isWaitingForSchool" style="padding:2rem;text-align:center;color:#666">
        Okul seçiliyor... Lütfen bekleyin veya üst menüden bir okul seçin.
      </div>
      <ng-container *ngIf="!isWaitingForSchool">
        <div class="page-header">
          <div class="left">
            <button mat-icon-button (click)="close()" aria-label="Geri">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <div class="page-title-wrap">
              <div class="page-title">{{ title }}</div>
              <div class="page-subtitle" *ngIf="subTitle">{{ subTitle }}</div>
            </div>
          </div>
          <div class="center-controls">
            <mat-form-field *ngIf="showTypeFilter" appearance="outline" class="type-filter">
              <mat-label>Demirbaş Türü</mat-label>
              <mat-select [(value)]="selectedDeviceType" (selectionChange)="onDeviceTypeChange($event.value)">
                <mat-option [value]="'all'">Tümü</mat-option>
                <mat-option *ngFor="let t of deviceTypes" [value]="t.id">{{ t.name }} - {{ t.count || 0 }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field *ngIf="showLocationFilter" appearance="outline" class="type-filter">
              <mat-label>Lokasyon</mat-label>
              <mat-select [(value)]="selectedLocation" (selectionChange)="onLocationChange($event.value)">
                <mat-option [value]="'all'">Tümü</mat-option>
                <mat-option *ngFor="let l of locations" [value]="l.id">{{ l.name }} - {{ l.count || 0 }}</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-stroked-button color="primary" class="print-button" (click)="print()">
              <span class="material-symbols-outlined">print</span>
              <span class="btn-label">Yazdır</span>
            </button>
            <button mat-stroked-button color="primary" class="print-button" (click)="printQr()">
              <span class="material-symbols-outlined">qr_code</span>
              <span class="btn-label">QR Yazdır</span>
            </button>
          </div>
        </div>
        <div class="report-iframe-wrap">
          <iframe id="reportFrame" #reportFrameRef width="100%" class="report-iframe"></iframe>
        </div>
      </ng-container>
    </div>
  `,
  styles: [
    `.page-container{padding:12px}
  .page-header{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;margin-bottom:12px}
  .page-header .left{display:flex;align-items:center;gap:12px}
  .center-controls{display:flex;align-items:center;justify-content:center;gap:10px}
     .page-title{font-size:1.1rem;font-weight:600}
     .page-subtitle{font-size:0.85rem;color:#666}
  .type-filter{min-width:180px}
  /* Force consistent height for Material form-field and select */
  .type-filter .mat-form-field-wrapper, .type-filter .mat-form-field-infix{height:48px;box-sizing:border-box}
  .type-filter .mat-form-field-infix{display:flex;align-items:center;padding:0 8px}
  .type-filter .mat-select-trigger{height:48px;display:flex;align-items:center}
  .type-filter .mat-select-value-text{display:inline-flex;align-items:center;height:48px}
      .print-button{height:48px;min-height:48px;display:inline-flex;align-items:center;gap:8px;padding:0 18px;border-radius:8px;background:none;border:1px solid #c4c4c4;color:#333;box-shadow:none;box-sizing:border-box;font-weight:500}
      .print-button .material-symbols-outlined{font-size:20px;color:inherit}
      .print-button .btn-label{font-weight:600;color:inherit}
      .print-button:hover{background:#f5f5f5}
  .report-iframe{height:calc(100vh - 120px);border:0}
     @media(max-width:600px){
       .center-controls{width:100%;justify-content:center}
       .type-filter{width:50%}
     }
  `]
})
export class ReportPreviewComponent implements OnInit {
  title = 'Rapor Önizleme';
  previewUrl: SafeResourceUrl | null = null;
  private objectUrl: string | null = null;
  @ViewChild('reportFrameRef', { static: false }) reportFrameRef?: ElementRef<HTMLIFrameElement>;
  deviceTypes: any[] = [];
  selectedDeviceType: any = 'all';
  locations: any[] = [];
  selectedLocation: any = 'all';
  showTypeFilter = false;
  showLocationFilter = false;
  subTitle: string | null = null; // will hold school + device type for display under title
  isWaitingForSchool = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private auth: AuthService
  ) {}
  async ngOnInit(){
    const groupBy = this.route.snapshot.queryParamMap.get('groupBy') || 'location';
    this.isWaitingForSchool = false;
    let selected = this.auth.getSelectedSchool();
    if (!selected) {
      this.isWaitingForSchool = true;
      selected = await this.getOrSelectSchool();
      this.isWaitingForSchool = false;
    }
    const schoolId = this.route.snapshot.queryParamMap.get('school_id') || (selected ? String(selected.id) : null);
  const filterDeviceType = this.route.snapshot.queryParamMap.get('filter_device_type') || null;
  const filterLocation = this.route.snapshot.queryParamMap.get('filter_location') || null;
  this.title = groupBy === 'location' ? 'Okuldaki demirbaşlar - Lokasyona göre' : 'Okuldaki demirbaşlar - Demirbaş türüne göre';
    this.showTypeFilter = groupBy === 'device_type';
  this.showLocationFilter = groupBy === 'location';
    try {
      const headers = this.auth.getToken() ? new HttpHeaders().set('Authorization', `Bearer ${this.auth.getToken()}`) : undefined;
  let url = `${apiBase}/api/reports/devices/grouped-by-${groupBy === 'location' ? 'location' : 'device-type'}`;
      const params: string[] = [];
  if (schoolId) params.push(`school_id=${schoolId}`);
  if (filterDeviceType) params.push(`filter_device_type=${encodeURIComponent(filterDeviceType)}`);
  if (filterLocation) params.push(`filter_location=${encodeURIComponent(filterLocation)}`);
      if (params.length) url += `?${params.join('&')}`;
      const resp: any = await this.http.get(url, { headers }).toPromise();

  // If device_type grouping, also load available device types for filter
      this.subTitle = null;
      if (groupBy === 'device_type') {
        try {
          // Load all device types, compute counts from grouped response, sort by count desc
          const types: any = await this.http.get(`${apiBase}/api/device-types`, { headers }).toPromise();
          const allTypes = Array.isArray(types) ? types : [];
          const counts: Record<string, number> = {};
          if (resp && resp.grouped) Object.keys(resp.grouped).forEach(k => counts[k] = resp.grouped[k].length);
          this.deviceTypes = allTypes.map((t:any) => ({ id: t.id, name: t.name, count: counts[t.name] || 0 }));
          this.deviceTypes.sort((a:any,b:any) => (b.count||0) - (a.count||0));
          // apply query param selection if present
          if (filterDeviceType && filterDeviceType !== 'all') {
            this.selectedDeviceType = filterDeviceType;
          }
        } catch(e) { this.deviceTypes = []; }
      }

      // If location grouping, load locations and compute counts from grouped response
      if (groupBy === 'location') {
        try {
          const types: any = await this.http.get(`${apiBase}/api/locations?school_id=${schoolId}`, { headers }).toPromise();
          const allLocs = Array.isArray(types) ? types : [];
          const counts: Record<string, number> = {};
          if (resp && resp.grouped) Object.keys(resp.grouped).forEach(k => counts[k] = resp.grouped[k].length);
          this.locations = allLocs.map((l:any) => ({ id: l.id, name: l.name, count: counts[l.name] || 0 }));
          this.locations.sort((a:any,b:any)=> (b.count||0) - (a.count||0));
          if (filterLocation && filterLocation !== 'all') this.selectedLocation = filterLocation;
        } catch(e){ this.locations = []; }
      }

      const schoolName = selected ? selected.name : null;
      let selectedDeviceTypeName: string | null = null;
      let selectedLocationName: string | null = null;
      if (this.selectedDeviceType && this.selectedDeviceType !== 'all') {
        const found = this.deviceTypes.find((t:any)=> String(t.id) === String(this.selectedDeviceType));
        if (found) selectedDeviceTypeName = found.name;
      }
      if (this.selectedLocation && this.selectedLocation !== 'all'){
        const found = this.locations.find((l:any)=> String(l.id) === String(this.selectedLocation));
        if (found) selectedLocationName = found.name;
      }
      // subtitle for display below title
  const parts: string[] = [];
  if (schoolName) parts.push(schoolName);
  if (selectedDeviceTypeName) parts.push(selectedDeviceTypeName);
  if (selectedLocationName) parts.push(selectedLocationName);
      this.subTitle = parts.length ? parts.join(' — ') : null;

      const headerTitle = this.title;
  const html = this.buildHtml(resp.grouped, groupBy === 'location' ? 'location' : 'device_type', `${headerTitle}${parts.length ? ' — ' + parts.join(' — ') : ''}`);
      const blob = new Blob([html], { type: 'text/html' });
  const objUrl = URL.createObjectURL(blob);
  // revoke previous
  if (this.objectUrl) { try { URL.revokeObjectURL(this.objectUrl); } catch(e){} }
  this.objectUrl = objUrl;
  // set iframe src programmatically to avoid Angular resource-url sanitization issues
  this.setIframeSrc(this.objectUrl);
  this.cdr.detectChanges();
    } catch(e){ console.error(e); alert('Rapor alınamadı'); this.close(); }
  }

  async onDeviceTypeChange(val: any){
    // regenerate preview in-place without navigation
    const groupBy = 'device_type';
    const selected = this.auth.getSelectedSchool();
    const schoolId = selected ? String(selected.id) : null;
    const filterDeviceType = val && val !== 'all' ? String(val) : null;
    await this.loadAndRender(groupBy, schoolId, filterDeviceType);
  }

  async onLocationChange(val: any){
    const groupBy = 'location';
    const selected = this.auth.getSelectedSchool();
    const schoolId = selected ? String(selected.id) : null;
    const filterLocation = val && val !== 'all' ? String(val) : null;
    await this.loadAndRender(groupBy, schoolId, null, filterLocation);
  }

  private async loadAndRender(groupBy: string, schoolId: string | null, filterDeviceType: string | null, filterLocation: string | null = null){
    // reuse core logic from ngOnInit but isolated
    try {
      const selected = this.auth.getSelectedSchool() || await this.getOrSelectSchool();
      const headers = this.auth.getToken() ? new HttpHeaders().set('Authorization', `Bearer ${this.auth.getToken()}`) : undefined;
  let url = `${apiBase}/api/reports/devices/grouped-by-${groupBy === 'location' ? 'location' : 'device-type'}`;
      const params: string[] = [];
  if (schoolId) params.push(`school_id=${schoolId}`);
  if (filterDeviceType) params.push(`filter_device_type=${encodeURIComponent(filterDeviceType)}`);
  if (filterLocation) params.push(`filter_location=${encodeURIComponent(filterLocation)}`);
      if (params.length) url += `?${params.join('&')}`;
      const resp: any = await this.http.get(url, { headers }).toPromise();

  const schoolName = this.auth.getSelectedSchool()?.name || null;
  let selectedDeviceTypeName: string | null = null;
  let selectedLocationName: string | null = null;
  if (groupBy === 'device_type') {
        // If deviceTypes not populated yet (edge), populate counts from resp
        if (!this.deviceTypes || this.deviceTypes.length === 0) {
          try {
            const types: any = await this.http.get(`${apiBase}/api/device-types`, { headers }).toPromise();
            const allTypes = Array.isArray(types) ? types : [];
            const counts: Record<string, number> = {};
            if (resp && resp.grouped) Object.keys(resp.grouped).forEach(k => counts[k] = resp.grouped[k].length);
            this.deviceTypes = allTypes.map((t:any) => ({ id: t.id, name: t.name, count: counts[t.name] || 0 }));
            this.deviceTypes.sort((a:any,b:any) => (b.count||0) - (a.count||0));
          } catch(e){ this.deviceTypes = []; }
        }
      }
      if (groupBy === 'location') {
        // If locations not populated yet (edge), populate counts from resp
        if (!this.locations || this.locations.length === 0) {
          try {
            const types: any = await this.http.get(`${apiBase}/api/locations?school_id=${schoolId}`, { headers }).toPromise();
            const allLocs = Array.isArray(types) ? types : [];
            const counts: Record<string, number> = {};
            if (resp && resp.grouped) Object.keys(resp.grouped).forEach(k=> counts[k] = resp.grouped[k].length);
            this.locations = allLocs.map((l:any)=> ({ id: l.id, name: l.name, count: counts[l.name] || 0 }));
            this.locations.sort((a:any,b:any)=> (b.count||0) - (a.count||0));
          } catch(e){ this.locations = []; }
        }
      }
      if (filterDeviceType && filterDeviceType !== 'all') {
        const found = this.deviceTypes.find((t:any)=> String(t.id) === String(filterDeviceType));
        if (found) selectedDeviceTypeName = found.name;
      }
      if (filterLocation && filterLocation !== 'all'){
        const found = this.locations.find((l:any)=> String(l.id) === String(filterLocation));
        if (found) selectedLocationName = found.name;
      }
  const parts: string[] = [];
  if (schoolName) parts.push(schoolName);
  if (selectedDeviceTypeName) parts.push(selectedDeviceTypeName);
  if (selectedLocationName) parts.push(selectedLocationName);

      const headerTitle = this.title;
  const html = this.buildHtml(resp.grouped, groupBy === 'location' ? 'location' : 'device_type', `${headerTitle}${parts.length ? ' — ' + parts.join(' — ') : ''}`);
  const blob = new Blob([html], { type: 'text/html' });
  const objUrl = URL.createObjectURL(blob);
  if (this.objectUrl) { try { URL.revokeObjectURL(this.objectUrl); } catch(e){} }
  this.objectUrl = objUrl;
  this.subTitle = parts.length ? parts.join(' — ') : null;
  this.setIframeSrc(this.objectUrl);
  this.cdr.detectChanges();
    } catch(e){ console.error(e); alert('Filtre uygulanamadı'); }
  }

  buildHtml(grouped: any, groupBy: string, headerTitle?: string){
    const displayTitle = headerTitle || this.title;
    // headerTitle may contain 'Title — School — DeviceType' but we want school on its own line
    let schoolLine = '';
    let titleLine = displayTitle;
    // if headerTitle contains ' — ' separators, attempt to split out school and device
    const parts = String(displayTitle).split(' — ');
    if (parts.length > 1) {
      titleLine = parts[0];
      schoolLine = parts.slice(1).join(' — '); // rest becomes subtitle line
    }

    // Build HTML with consistent styles for A4 preview. If schoolLine exists, render it inside the same sheet
    let html = `<!doctype html><html><head><meta charset="utf-8"><title>${titleLine}</title><style>
      /* Page background to show paper */
      html,body{height:100%;background:#eee;margin:0;padding:0}
      body{display:flex;align-items:start;justify-content:center;padding:20px;font-family:Arial,Helvetica,sans-serif}
      .sheet{width:210mm;min-height:297mm;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,0.12);padding:16mm;box-sizing:border-box}
      .school-line{font-weight:700;margin-bottom:8px}
      h1{font-size:18px;margin:0 0 12px}
      h2{font-size:14px;margin:18px 0 8px}
      table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:12px}
      th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
      th{background:#f4f4f4}
      @media print{ html,body{background:#fff} .sheet{box-shadow:none;margin:0;padding:6mm;width:auto;min-height:auto} }
    </style></head><body>`;
    html += `<div class="sheet">`;
    if (schoolLine) html += `<div class="school-line">${schoolLine}</div>`;
    html += `<h1>${titleLine}</h1>`;
    for (const groupName of Object.keys(grouped)){
      const items = grouped[groupName];
      html += `<h2>${groupName} (${items.length})</h2>`;
      html += `<table><thead><tr>`;
  html += `<th>Demirbaş Kimlik No</th><th>Demirbaş Adı</th><th>Seri No</th><th>Kullanıcı</th><th>Demirbaş Tipi</th><th>Lokasyon</th>`;
      html += `</tr></thead><tbody>`;
      items.forEach((it:any)=>{
        html += `<tr>`;
        html += `<td>${it.identity_no||''}</td>`;
        html += `<td>${it.name||''}</td>`;
        html += `<td>${it.serial_no||''}</td>`;
  html += `<td>${(it.AssignedEmployee?.name || it.user) || ''}</td>`;
        html += `<td>${it.device_type||''}</td>`;
        html += `<td>${it.location||''}</td>`;
        html += `</tr>`;
      });
      html += `</tbody></table>`;
    }
    html += `</div></body></html>`;
    return html;
  }

  // Build a QR code sheet: fetch devices according to current filters and render QR codes
  async printQr(){
    try {
  // No dialog: Use fixed 35mm x 35mm squares, no gap, arranged left-to-right, wrap to next row.
  const finalCardMm = 35; // fixed outer edge in millimeters
  const pageWidthMm = 210;
  const cols = Math.max(1, Math.floor(pageWidthMm / finalCardMm)); // should be 6 for 35mm
  const identityFontMm = Math.max(2.5, Math.round(finalCardMm * 0.12 * 10) / 10);

  const selected = this.auth.getSelectedSchool() || await this.getOrSelectSchool();
    const schoolId = selected ? String(selected.id) : null;
      const headers = this.auth.getToken() ? new HttpHeaders().set('Authorization', `Bearer ${this.auth.getToken()}`) : undefined;
      // Build query to fetch devices filtered by school, device_type and location if selected
      const params: string[] = [];
      if (schoolId) params.push(`school_id=${schoolId}`);
      if (this.selectedDeviceType && this.selectedDeviceType !== 'all') params.push(`device_type_id=${encodeURIComponent(this.selectedDeviceType)}`);
      if (this.selectedLocation && this.selectedLocation !== 'all') params.push(`location_id=${encodeURIComponent(this.selectedLocation)}`);
  let url = `${apiBase}/api/devices`;
      if (params.length) url += `?${params.join('&')}`;
      const devices: any = await this.http.get(url, { headers }).toPromise();

      // build HTML with QR codes for A4 portrait
      const host = (typeof window !== 'undefined' && window.location) ? `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':'+window.location.port : ''}` : '';
      // CSS: A4 portrait, margin 0 so we can tightly pack 35x35mm tiles across the 210mm width
      let html = `<!doctype html><html><head><meta charset="utf-8"><title>QR Yazdır</title><style>
        @page { size: A4 portrait; margin: 0 }
        html,body{height:100%;background:#fff;margin:0;padding:0}
        .sheet{width:210mm;min-height:297mm;background:#fff;padding:0;margin:0;box-sizing:border-box}
        .grid{display:flex;flex-wrap:wrap;gap:0;margin:0;padding:0}
  .card{width:${finalCardMm}mm;height:${finalCardMm}mm;display:flex;flex-direction:column;align-items:center;justify-content:center;border:0;box-sizing:border-box;padding:0;margin:0}
  /* QR should be exactly 25mm and centered; identity sits below it and both are centered together */
  .card .qrwrap{width:25mm;height:25mm;display:flex;align-items:center;justify-content:center;margin:0}
  .card img{width:100%;height:100%;object-fit:contain;display:block}
  .identity{display:block;width:100%;text-align:center;margin-top:2px;font-weight:600;font-size:${identityFontMm}mm;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        @media print{ @page { size: A4 portrait; margin: 0 } .sheet{box-shadow:none;margin:0;padding:0} }
      </style></head><body><div class="sheet"><div class="grid">`;

      // For each device, generate data URLs using bundled QRCode and embed directly
      for (const d of devices){
  const urlFor = `${host}/device-detail/${d.id}`;
        const identity = (d.identity_no || '').toString();
        // scale identity font per length: reduce font mm in small steps for long strings
        let fontMm = identityFontMm;
        if (identity.length > 12) {
          const extra = identity.length - 12;
          const reduce = Math.ceil(extra / 6) * 0.5; // 0.5mm step per 6 chars
          fontMm = Math.max(2, Math.round((fontMm - reduce) * 10) / 10);
        }
        const identityStyle = `font-size:${fontMm}mm;`;
        try{
          // QR target physical size in mm
          const qrMm = 25;
          // convert mm to approx pixels (1 mm ≈ 3.78 px at 96dpi)
          const px = Math.max(48, Math.round(qrMm * 3.78));
          const dataUrl = await QRCode.toDataURL(urlFor, { width: px, margin: 0 });
          html += `<div class="card"><div class="qrwrap"><img src="${dataUrl}" alt="QR"/></div><div class="identity" style="${identityStyle}">${identity}</div></div>`;
        }catch(e){
          html += `<div class="card"><img src="" alt="QR"/><div class="identity" style="${identityStyle}">${identity}</div></div>`;
        }
      }
      html += `</div></div>`;

  const blob = new Blob([html], { type: 'text/html' });
  const objUrl = URL.createObjectURL(blob);
  if (this.objectUrl) { try { URL.revokeObjectURL(this.objectUrl); } catch(e){} }
  this.objectUrl = objUrl;
  this.setIframeSrc(this.objectUrl);
  this.cdr.detectChanges();
    } catch(e){ console.error(e); alert('QR kodlar oluşturulamadı'); }
  }

  // Try to get selected school; if none selected and user has schools, auto-select the first one
  // Ensure there's a selected school. If none is selected yet, try to pick the first school from the current user.
  // If still none, wait briefly for selectedSchool$ (useful when AuthService initializes from localStorage).
  private async getOrSelectSchool(): Promise<any|null> {
    let school = this.auth.getSelectedSchool();
    if (school) return school;

    const user = this.auth.getCurrentUser && this.auth.getCurrentUser();
    if (user && (user.schools || []).length > 0) {
      const first = user.schools[0];
      try { this.auth.setSelectedSchool(first); } catch(e) {}
      return first;
    }

    // wait up to 2 seconds for selectedSchool$ to emit (AuthService may be restoring state)
    return new Promise(resolve => {
      const sub = this.auth.selectedSchool$.subscribe(s => {
        try { sub.unsubscribe(); } catch(e) {}
        resolve(s || null);
      });
      setTimeout(() => { try { sub.unsubscribe(); } catch(e){}; resolve(null); }, 2000);
    });
  }

  print(){
    const iframe: HTMLIFrameElement | null = document.getElementById('reportFrame') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow){ iframe.contentWindow.print(); }
  }

  // Set the iframe src by assigning a sanitized SafeResourceUrl so Angular's
  // resource URL security check (NG0904) is satisfied. We previously wrote the
  // object URL directly into the DOM which triggers the runtime error when
  // Angular also tries to bind the property.
  private setIframeSrc(url: string | null){
    try {
      // remove previous
      if (this.reportFrameRef && this.reportFrameRef.nativeElement) {
        const el = this.reportFrameRef.nativeElement as HTMLIFrameElement;
        if (!url) {
          try { el.src = ''; } catch(e) {}
          return;
        }
        // assign directly to the element to bypass Angular resource URL checks
        try { el.src = url; } catch(e) { console.error('Failed to assign iframe src directly', e); }
      } else {
        // fallback: keep previewUrl for older consumers (shouldn't be used)
        if (!url) { this.previewUrl = null; }
        else { this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url) as SafeResourceUrl; }
      }
    } catch(e) {
      console.error('Failed to set iframe src', e);
      this.previewUrl = null;
    }
  }

  close(){
    if (this.objectUrl) { try { URL.revokeObjectURL(this.objectUrl); } catch(e){} this.objectUrl = null; }
    this.router.navigate(['/dashboard']);
  }
}
