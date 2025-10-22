import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { apiBase } from '../runtime-config';
import { AuthService } from '../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-fault-add-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatSelectModule, MatOptionModule],
  template: `
    <h2 mat-dialog-title>{{ editMode ? 'Destek Talebi Düzenle' : 'Yeni Destek Talebi' }}</h2>
  <mat-dialog-content class="dialog-content">
      <div style="display:flex; flex-direction:column; gap:8px; min-width:360px;">
        <mat-form-field appearance="outline">
          <mat-label>Lokasyon (zorunlu)</mat-label>
          <input type="text" matInput [formControl]="locationCtrl" [matAutocomplete]="locAuto" placeholder="Lokasyon ara veya seç">
          <mat-autocomplete #locAuto="matAutocomplete" (optionSelected)="onLocationSelected($event.option.value)" [displayWith]="displayLocation">
            <mat-option *ngFor="let l of filteredLocations" [value]="l">{{l.name}} <span *ngIf="l.room_number">(Oda: {{l.room_number}})</span></mat-option>
          </mat-autocomplete>
        </mat-form-field>
        <div *ngIf="submittedAttempt && !selectedLocation" style="color:#b00020; font-size:0.9rem; margin-top:-8px;">Lokasyon seçimi zorunlu.</div>

        <mat-form-field appearance="outline">
          <mat-label>Demirbaş (zorunlu)</mat-label>
          <input type="text" matInput [formControl]="deviceCtrl" [matAutocomplete]="devAuto" placeholder="Demirbaş ara veya seç">
          <mat-autocomplete #devAuto="matAutocomplete" (optionSelected)="onDeviceSelected($event.option.value)" [displayWith]="displayDevice">
            <mat-option *ngFor="let d of filteredDevices" [value]="d">{{d.name}} ({{d.identity_no || d.serial_no}})</mat-option>
          </mat-autocomplete>
        </mat-form-field>
        <div *ngIf="submittedAttempt && !deviceId" style="color:#b00020; font-size:0.9rem; margin-top:-8px;">Demirbaş seçimi zorunlu.</div>

    <label>Arıza Detayı</label>
  <textarea rows="6" [(ngModel)]="issueDetails" style="width:100%;font-size:12pt;padding:10px;"></textarea>
  <div style="font-size:0.85rem; color:#666; margin-top:6px;">Not: Detay en az 10 karakter olmalıdır.</div>
        <div *ngIf="submittedAttempt && (!issueDetails || issueDetails.trim().length < 10)" style="color:#b00020; font-size:0.9rem; margin-top:-8px;">Detay en az 10 karakter olmalı.</div>

        <mat-form-field appearance="outline">
          <mat-label>Talep Eden Personel (opsiyonel)</mat-label>
          <mat-select [(value)]="selectedRequestedByEmployeeId">
            <mat-option [value]="null">Tümü / Seçme</mat-option>
            <mat-option *ngFor="let e of employees" [value]="e.id">{{ e.name || e.full_name || ('#' + e.id) }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" *ngIf="editMode">
          <mat-label>Durum</mat-label>
          <mat-select [(value)]="selectedStatus">
            <mat-option value="pending">Bekliyor</mat-option>
            <mat-option value="in_progress">İşlemde</mat-option>
            <mat-option value="closed">Kapandı</mat-option>
          </mat-select>
        </mat-form-field>

        <label>Görsel (opsiyonel)</label>
        <input type="file" (change)="onFileChange($event)" />
        <div *ngIf="imagePreviewUrl" style="margin-top:8px; display:flex; gap:8px; align-items:flex-start;">
          <img [src]="imagePreviewUrl" style="max-width:200px; max-height:200px; border-radius:6px; border:1px solid #eee" />
          <div style="display:flex; flex-direction:column; gap:6px;">
            <button mat-stroked-button color="warn" (click)="clearImage($event)">Görseli Kaldır</button>
            <div style="font-size:0.85rem; color:#666;">Mevcut: <span *ngIf="imagePath">{{imagePath}}</span><span *ngIf="!imagePath">(yok)</span></div>
          </div>
        </div>
        <div *ngIf="uploading">Yükleniyor...</div>
        <div *ngIf="error" style="color:#b00020">{{error}}</div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions style="margin-top:12px;">
      <button mat-stroked-button (click)="onCancel()">İptal</button>
  <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!canSubmit">{{ editMode ? 'Güncelle' : 'Ekle' }}</button>
    </mat-dialog-actions>
  `
})
export class FaultAddDialogComponent {
  devices: any[] = [];
  deviceId: number | null = null;
  selectedLocation: any | null = null;
  issueDetails = '';
  imagePath: string | null = null;
  imagePreviewUrl: string | null = null;
  selectedFile: File | null = null; // file chosen but not yet uploaded
  uploading = false;
  clearedImage = false; // user explicitly cleared the image
  submitting = false;
  error: string | null = null;
  // location/device controls
  locationCtrl = new FormControl('');
  deviceCtrl = new FormControl('');
  locations: any[] = [];
  filteredLocations: any[] = [];
  filteredDevices: any[] = [];
  // school employees for optional 'requested by' selection
  employees: any[] = [];
  selectedRequestedByEmployeeId: number | null = null;
  // edit-mode
  editMode = false;
  faultId: number | null = null;
  selectedStatus: string | null = null;

  constructor(public dialogRef: MatDialogRef<FaultAddDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private http: HttpClient, private auth: AuthService, private cdr: ChangeDetectorRef) {
    this.loadLocations();
    this.loadEmployees();
    // watch input changes for client-side filtering
    this.locationCtrl.valueChanges.subscribe(v => {
      // if an object is present (user picked an option), set selectedLocation
      if (v && typeof v === 'object' && 'id' in v) {
        this.selectedLocation = v;
      } else {
        // if user is typing free text, clear selection
        this.selectedLocation = null;
      }
      const q = (v && typeof v === 'object' && 'name' in v) ? (v as any).name : (v || '');
      this.filteredLocations = this.locations.filter(l => String(l.name).toLowerCase().includes(String(q).toLowerCase()) || String(l.room_number || '').toLowerCase().includes(String(q).toLowerCase()));
    });
    this.deviceCtrl.valueChanges.subscribe(v => {
      // if user typed free text (string), clear deviceId because selection isn't confirmed
      if (v && typeof v === 'string') {
        this.deviceId = null;
      }
      const q = (v && typeof v === 'object' && 'name' in v) ? (v as any).name : (v || '');
      this.filteredDevices = this.devices.filter(d => String(d.name).toLowerCase().includes(String(q).toLowerCase()));
    });

    // if data contains id -> edit mode
    try {
      if (this.data && this.data.id) {
        this.editMode = true;
        this.faultId = Number(this.data.id);
        // load the fault details
        this.loadForEdit(this.faultId);
      }
    } catch (e) {}
  }
  submittedAttempt = false;

  private getToken(): string | null { return this.auth.getToken(); }

  loadDevices() {
    const token = this.getToken();
    const selected = this.auth.getSelectedSchool();
    if (!selected) return;
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    const devUrl = `${apiBase}/api/devices?school_id=${selected.id}`;
    try { console.debug('FaultAddDialog.loadDevices selectedSchool:', selected, 'url:', devUrl); } catch(e) {}
    this.http.get(devUrl, { headers, responseType: 'json' } as any).subscribe({ next: (d: any) => { this.devices = d || []; this.filteredDevices = this.devices; }, error: (e: any) => console.error('load devices', e) });
  }

  loadLocations(){
    const token = this.getToken();
    const selected = this.auth.getSelectedSchool();
    if (!selected) return Promise.resolve();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    const locUrl = `${apiBase}/api/locations?school_id=${selected.id}`;
    try { console.debug('FaultAddDialog.loadLocations selectedSchool:', selected, 'url:', locUrl); } catch(e) {}
    return new Promise<void>((resolve) => {
      this.http.get(locUrl, { headers, responseType: 'json' } as any).subscribe({ next: (d: any) => { this.locations = Array.isArray(d) ? d : []; this.filteredLocations = this.locations; resolve(); }, error: (e: any) => { console.error('load locations', e); this.locations = []; this.filteredLocations = []; resolve(); } });
    });
  }

  loadEmployees(){
    const token = this.getToken();
    const selected = this.auth.getSelectedSchool();
    if (!selected) return;
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
  const url = `${apiBase}/api/school-employees/school/${selected.id}`;
    this.http.get(url, { headers, responseType: 'json' } as any).subscribe({ next: (d:any) => { this.employees = Array.isArray(d) ? d : []; }, error: (e:any) => { console.error('load employees', e); this.employees = []; } });
  }

  async loadForEdit(id: number) {
    const token = this.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    try {
      const res: any = await this.http.get(`${apiBase}/api/faults/${id}`, { headers } as any).toPromise();
      const f = res.fault; if (!f) return;
      // populate visible fields (read-only for most) and status
      this.issueDetails = f.issue_details || '';
      this.imagePath = f.image || null;
      // if an existing image path is present, create a preview URL to show it
      if (this.imagePath) {
        try {
          // backend returns relative path like 'uploads/faults/images/filename'
          this.imagePreviewUrl = (this.imagePath && String(this.imagePath).startsWith('http')) ? this.imagePath : `${apiBase}/${this.imagePath}`;
        } catch (e) {}
      }
  // Map legacy 'open' incoming value to canonical 'pending'
  this.selectedStatus = (f.status === 'open') ? 'pending' : (f.status || 'pending');
      // ensure locations loaded
      await this.loadLocations();
      if (f.Device && f.Device.Location) {
        this.selectedLocation = f.Device.Location;
      } else if (f.location_id) {
        this.selectedLocation = this.locations.find((l:any)=>Number(l.id)===Number(f.location_id)) || null;
      }
      // set location control so autocomplete shows the selection
      try { this.locationCtrl.setValue(this.selectedLocation); } catch(e){}
      // load devices for selected location
      await this.onLocationSelected(this.selectedLocation);
      this.deviceId = f.Device && f.Device.id ? f.Device.id : (f.device_id || null);
      if (this.deviceId) {
        const devObj = this.devices.find((d:any)=>Number(d.id)===Number(this.deviceId)) || null;
        try { this.deviceCtrl.setValue(devObj || ''); } catch(e){}
      }
      // if server returned requested_by_employee_id, populate selection
      this.selectedRequestedByEmployeeId = f.requested_by_employee_id || null;
      try { this.cdr.detectChanges(); } catch(e){}
    } catch (e) { console.error('loadForEdit', e); }
  }

  onLocationSelected(loc: any){
    // when a location is chosen, re-load devices for that location and set selectedLocation
    const token = this.getToken();
    const selected = this.auth.getSelectedSchool();
    if (!selected) return Promise.resolve();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    const lid = loc && loc.id ? loc.id : null;
    // set selected location and clear any previously selected device
    this.selectedLocation = loc && loc.id ? loc : null;
    this.deviceId = null;
    let url = `${apiBase}/api/devices?school_id=${selected.id}`;
    if (lid) url += `&location_id=${lid}`;
    try { console.debug('FaultAddDialog.onLocationSelected selectedSchool:', selected, 'locationId:', lid, 'url:', url); } catch(e) {}
    return new Promise<void>((resolve) => {
      this.http.get(url, { headers, responseType: 'json' } as any).subscribe({ next: (d: any) => { this.devices = d || []; this.filteredDevices = this.devices; resolve(); }, error: (e:any) => { console.error('load devices by location', e); this.devices = []; this.filteredDevices = []; resolve(); } });
    });
  }

  onDeviceSelected(dev: any){
    this.deviceId = dev && dev.id ? dev.id : null;
  }

  displayLocation = (loc: any) => {
    if (!loc) return '';
    return loc.room_number ? `${loc.name} (Oda: ${loc.room_number})` : `${loc.name}`;
  }

  displayDevice = (d: any) => {
    if (!d) return '';
    return d.identity_no ? `${d.name} (${d.identity_no})` : (d.serial_no ? `${d.name} (${d.serial_no})` : d.name);
  }


  // expose helper to determine whether submit should be enabled
  get canSubmit(): boolean {
    if (this.uploading || this.submitting) return false;
    if (!this.selectedLocation) return false;
    if (!this.deviceId) return false;
    if (!this.issueDetails || this.issueDetails.trim().length < 10) return false;
    return true;
  }

  async onFileChange(ev: any) {
    const f = ev.target.files && ev.target.files[0]; if (!f) return;
    // revoke previous preview if any
    if (this.imagePreviewUrl) { try { URL.revokeObjectURL(this.imagePreviewUrl); } catch(e){} this.imagePreviewUrl = null; }
    this.selectedFile = f;
    this.clearedImage = false; // user selected a new file
    this.imagePreviewUrl = URL.createObjectURL(f);
    // do not upload here; upload will happen on submit
  }

  clearImage(ev?: Event) {
    if (ev) ev.stopPropagation();
    // revoke preview if it was a blob
    try { if (this.imagePreviewUrl && this.imagePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(this.imagePreviewUrl); } catch (e) {}
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.clearedImage = true;
    // keep imagePath so we know what to delete on submit; UI hides preview immediately
    this.cdr.detectChanges();
  }

  onCancel(){ this.dialogRef.close(null); }

  // ensure we free the object URL when dialog closed
  ngOnDestroy(){ if (this.imagePreviewUrl) { try { URL.revokeObjectURL(this.imagePreviewUrl); } catch(e){} this.imagePreviewUrl = null; } }

  async onSubmit(){
    this.submittedAttempt = true;
    const selected = this.auth.getSelectedSchool();
    if (!selected) { this.error = 'Okul seçimi gerekli.'; return; }
    if (!this.canSubmit) {
      // show validation errors inline
      if (!this.selectedLocation) this.error = 'Lokasyon seçimi zorunlu.';
      else if (!this.deviceId) this.error = 'Demirbaş seçimi zorunlu.';
      else if (!this.issueDetails || this.issueDetails.trim().length < 10) this.error = 'Detay en az 10 karakter olmalı.';
      return;
    }
    this.submitting = true; this.error = null;
    const token = this.getToken(); const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }) : new HttpHeaders({ 'Content-Type': 'application/json' });

    // If a file was selected, upload it first and get the path
    let newImagePath: string | null = this.imagePath || null;
    if (this.selectedFile) {
      this.uploading = true; this.error = null;
      try {
        const fd = new FormData(); fd.append('file', this.selectedFile);
        const authHeaders: any = {};
        if (token) authHeaders['Authorization'] = `Bearer ${token}`;
        const res: any = await this.http.post(`${apiBase}/api/upload/fault-image`, fd, { headers: authHeaders }).toPromise();
        if (res && res.path) newImagePath = res.path;
      } catch (err:any) { console.error('upload error', err); this.error = err?.error?.message || err?.message || 'Yükleme hatası'; this.submitting = false; this.uploading = false; return; }
      finally { this.uploading = false; }
    }

  // If the user explicitly cleared the image during edit, ensure we send null
  if (this.clearedImage) newImagePath = null;

    if (this.editMode && this.faultId) {
      // Send full PATCH payload to update multiple fields
      const payload: any = {};
      if (this.selectedLocation && this.selectedLocation.id) payload.location_id = this.selectedLocation.id;
      payload.device_id = this.deviceId || null;
      payload.issue_details = this.issueDetails || '';
      payload.image = newImagePath || null;
  payload.requested_by_employee_id = this.selectedRequestedByEmployeeId || null;
      if (this.selectedStatus) payload.status = this.selectedStatus;
      try {
        const oldImage = this.imagePath || null;
        await this.http.patch(`${apiBase}/api/faults/${this.faultId}`, payload, { headers }).toPromise();
        // if old image exists and newImagePath is different, request deletion of old file
        if (oldImage && newImagePath && oldImage !== newImagePath) {
          try { await this.http.request('delete', `${apiBase}/api/upload/fault-image`, { body: { path: oldImage }, headers }).toPromise(); } catch(e) { console.warn('failed to delete old image', e); }
        }
        // if user cleared the image, delete old image from server
        if (this.clearedImage && oldImage) {
          try { await this.http.request('delete', `${apiBase}/api/upload/fault-image`, { body: { path: oldImage }, headers }).toPromise(); } catch(e) { console.warn('failed to delete cleared image', e); }
        }
        this.submitting = false; this.dialogRef.close('updated');
      } catch (e:any) { console.error('update fault', e); this.error = e?.error?.message || 'Güncelleme hatası'; this.submitting = false; }
      return;
    }

    const payload: any = { school_id: selected.id, device_id: this.deviceId || null, issue_details: this.issueDetails, image: newImagePath || null };
    if (this.selectedLocation && this.selectedLocation.id) payload.location_id = this.selectedLocation.id;
  // include optional requested_by_employee_id if selected (allow null)
  if (typeof this.selectedRequestedByEmployeeId !== 'undefined') payload.requested_by_employee_id = this.selectedRequestedByEmployeeId || null;
    try { console.debug('FaultAddDialog.onSubmit payload:', payload); } catch(e) {}
    this.http.post(`${apiBase}/api/faults`, payload, { headers }).subscribe({ next: () => { this.submitting = false; this.dialogRef.close('created'); }, error: e => { console.error('create fault', e); this.error = e?.error?.message || 'Kayıt hatası'; this.submitting = false; } });
  }
}
