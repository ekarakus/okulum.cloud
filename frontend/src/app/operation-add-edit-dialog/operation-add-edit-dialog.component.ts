import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter, DateAdapter } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { apiBase } from '../runtime-config';

@Component({
  selector: 'app-operation-add-edit-dialog',
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatCheckboxModule, ReactiveFormsModule],
  providers: [provideNativeDateAdapter()],
  template: `
  <h2 mat-dialog-title>{{ (data && data.operation && data.operation.id) ? 'İşlem Düzenle' : 'İşlem Ekle' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="onSave()" (keydown.enter)="onFormEnter($event)">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Demirbaş</mat-label>
          <mat-select formControlName="device_id" required [disabled]="!!data.deviceDisabled">
            <mat-option *ngFor="let device of devices" [value]="device.id">
              {{device.name}} ({{device.identity_no}})
            </mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>İşlem Türü</mat-label>
          <mat-select formControlName="operation_type_id" required>
            <mat-option *ngFor="let type of operationTypes" [value]="type.id">
              {{type.name}}
            </mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Açıklama</mat-label>
          <input matInput formControlName="description" />
          <mat-hint>İsteğe bağlı</mat-hint>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>İşlem Tarihi</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="date" required />
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Teknisyen</mat-label>
          <mat-select formControlName="technician_id" required>
            <mat-option *ngFor="let tech of technicians" [value]="tech.id">
              {{tech.name}}
            </mat-option>
          </mat-select>
        </mat-form-field>
        <div style="margin: 1rem 0;">
          <mat-checkbox formControlName="is_completed">
            Tamamlandı mı?
          </mat-checkbox>
        </div>
        <!-- keep support_id so edits preserve the associated fault/support record -->
        <input type="hidden" formControlName="support_id" />
        <div style="display:none"><button type="submit"></button></div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>İptal</button>
      <button mat-raised-button color="primary" type="submit" [disabled]="!form.valid" (click)="onSave()">
        {{ data.operation ? 'Güncelle' : 'Ekle' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class OperationAddEditDialogComponent {
  form: FormGroup;
  devices: any[] = [];
  operationTypes: any[] = [];
  technicians: any[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<OperationAddEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      operation?: any,
      devices?: any[],
      operationTypes?: any[],
      technicians?: any[],
      selectedSchoolId?: number,
      deviceDisabled?: boolean
    },
    @Inject(PLATFORM_ID) private platformId: Object,
    private dateAdapter: DateAdapter<any>
  ) {
    // set Turkish locale for datepicker
    try { this.dateAdapter.setLocale('tr-TR'); } catch (e) { /* no-op */ }
    this.form = this.fb.group({
      device_id: [data.operation?.device_id || '', Validators.required],
      operation_type_id: [data.operation?.operation_type_id || '', Validators.required],
      description: [data.operation?.description || ''],
      date: [data.operation?.date ? new Date(data.operation.date) : new Date(), Validators.required],
      technician_id: [data.operation?.technician_id || '', Validators.required],
      is_completed: [data.operation?.is_completed || false],
      support_id: [data.operation?.support_id || null]
    });

    // Use passed data or load from API
    if (data.devices) {
      this.devices = data.devices;
    } else {
      this.loadDevices();
    }

    if (data.operationTypes) {
      this.operationTypes = data.operationTypes;
    } else {
      this.loadOperationTypes();
    }

    if (data.technicians) {
      this.technicians = data.technicians;
    } else {
      this.loadTechnicians();
    }

    // If caller requested the device to be disabled (preselected), disable the control
    try {
      if (data && data.deviceDisabled) {
        const ctl = this.form.get('device_id');
        if (ctl) ctl.disable({ onlySelf: true, emitEvent: false });
      }
    } catch (e) { /* noop */ }
  }

  private getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  private loadDevices() {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  let url = `${apiBase}/api/devices`;
      if (this.data.selectedSchoolId) {
        url += `?school_id=${this.data.selectedSchoolId}`;
      }
      this.http.get<any[]>(url, { headers }).subscribe({
        next: data => this.devices = data,
        error: err => console.error('Error loading devices:', err)
      });
    }
  }

  private loadOperationTypes() {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  this.http.get<any[]>(`${apiBase}/api/operation-types`, { headers }).subscribe({
        next: data => this.operationTypes = data,
        error: err => console.error('Error loading operation types:', err)
      });
    }
  }

  private loadTechnicians() {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  let url = `${apiBase}/api/technicians`;
      if (this.data.selectedSchoolId) {
        url += `?school_id=${this.data.selectedSchoolId}`;
      }
      this.http.get<any[]>(url, { headers }).subscribe({
        next: data => this.technicians = data,
        error: err => console.error('Error loading technicians:', err)
      });
    }
  }

  onSave() {
    // Use getRawValue so disabled controls (preselected device) are included
    const raw = this.form.getRawValue();
    // validate required fields manually when device control is disabled
    const valid = this.form.valid || (this.data && this.data.deviceDisabled && raw.device_id);
    if (valid) {
      const formValue = raw;
      // Convert date to ISO string for backend
      formValue.date = formValue.date.toISOString();
      this.dialogRef.close(formValue);
    }
  }

  onFormEnter(event: Event) {
    try {
      const target = event.target as HTMLElement;
      if (target && target.tagName === 'TEXTAREA') {
        // allow newline in textareas
        return;
      }
    } catch (e) { /* ignore */ }
    event.preventDefault();
    this.onSave();
  }
}
