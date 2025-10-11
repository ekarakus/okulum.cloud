import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule, JsonPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { OfflineQueueService } from '../offline-queue.service';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-operation-add',
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatIconModule],
  providers: [JsonPipe],
  host: { 'ngSkipHydration': '' },
  template: `
    <mat-card>
      <div style="display: flex; align-items: center; margin-bottom: 1rem;">
        <button mat-icon-button (click)="goToDashboard()" style="margin-right: 1rem;">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 style="margin: 0; flex-grow: 1;">İşlem Ekle</h2>
      </div>
      <form [formGroup]="form" (ngSubmit)="addOperation()">
        <mat-form-field appearance="outline" style="width:100%; margin-bottom: 1rem;">
          <mat-label>Cihaz</mat-label>
          <mat-select formControlName="device_id" required>
            <mat-option *ngFor="let device of devices" [value]="device.id">
              {{device.name}} ({{device.identity_no}}) - {{device.Location?.name}}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%; margin-bottom: 1rem;">
          <mat-label>İşlem Türü</mat-label>
          <mat-select formControlName="operation_type_id" required>
            <mat-option *ngFor="let opType of operationTypes" [value]="opType.id">
              {{opType.name}}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%; margin-bottom: 1rem;">
          <mat-label>Teknisyen</mat-label>
          <mat-select formControlName="technician_id" required>
            <mat-option *ngFor="let tech of technicians" [value]="tech.id">
              {{tech.name}} - {{tech.specialization}}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%; margin-bottom: 1rem;">
          <mat-label>Açıklama</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
          <mat-hint>İsteğe bağlı</mat-hint>
        </mat-form-field>

        <div style="display: flex; gap: 1rem;">
          <button mat-raised-button color="primary" type="submit" [disabled]="!form.valid">
            İşlem Ekle
          </button>
          <button mat-button type="button" (click)="resetForm()">
            Temizle
          </button>
        </div>
      </form>

      <div *ngIf="offlineQueue.length" style="margin-top: 2rem;">
        <h3>Offline Kuyruk</h3>
        <ul>
          <li *ngFor="let op of offlineQueue">{{ op | json }}</li>
        </ul>
        <button mat-raised-button color="accent" (click)="syncQueue()">Senkronize Et</button>
      </div>
    </mat-card>
  `,
})
export class OperationAddComponent implements OnInit {
  form: FormGroup;
  offlineQueue: any[] = [];
  devices: any[] = [];
  operationTypes: any[] = [];
  technicians: any[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private offlineQueueService: OfflineQueueService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.form = this.fb.group({
      device_id: [''],
      operation_type_id: [''],
      description: [''],
      technician_id: ['']
    });
    if (isPlatformBrowser(this.platformId)) {
      this.offlineQueueService.loadQueue();
      this.offlineQueue = this.offlineQueueService.getQueue();
    }
  }

  ngOnInit() {
    this.loadDevices();
    this.loadOperationTypes();
    this.loadTechnicians();
  }

  private getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  loadDevices() {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.get<any[]>(`${environment.apiUrl}/api/devices`, { headers }).subscribe({
        next: data => this.devices = data,
        error: err => console.error('Error loading devices:', err)
      });
    }
  }

  loadOperationTypes() {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.get<any[]>(`${environment.apiUrl}/api/operation-types`, { headers }).subscribe({
        next: data => this.operationTypes = data,
        error: err => console.error('Error loading operation types:', err)
      });
    }
  }

  loadTechnicians() {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.get<any[]>(`${environment.apiUrl}/api/technicians`, { headers }).subscribe({
        next: data => this.technicians = data,
        error: err => console.error('Error loading technicians:', err)
      });
    }
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  resetForm() {
    this.form.reset();
  }

  addOperation() {
    if (!this.form.valid) {
      alert('Lütfen tüm alanları doldurun!');
      return;
    }

    if (isPlatformBrowser(this.platformId) && !navigator.onLine) {
      this.offlineQueueService.addOperation(this.form.value);
      this.offlineQueue = this.offlineQueueService.getQueue();
      alert('İşlem offline olarak kaydedildi!');
      this.resetForm();
    } else {
      const token = this.getToken();
      if (token) {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http.post(`${environment.apiUrl}/api/operations`, this.form.value, { headers }).subscribe({
          next: (res) => {
            alert('İşlem başarıyla eklendi!');
            this.resetForm();
          },
          error: (err) => {
            console.error('Error adding operation:', err);
            alert('İşlem eklenirken bir hata oluştu!');
          }
        });
      }
    }
  }
  syncQueue() {
    if (isPlatformBrowser(this.platformId) && navigator.onLine) {
      const token = this.getToken();
      if (token) {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        const queue = this.offlineQueueService.getQueue();

        if (queue.length === 0) {
          alert('Senkronize edilecek işlem yok!');
          return;
        }

        let syncedCount = 0;
        queue.forEach(op => {
          this.http.post(`${environment.apiUrl}/api/operations`, op, { headers }).subscribe({
            next: () => {
              syncedCount++;
              if (syncedCount === queue.length) {
                this.offlineQueueService.clearQueue();
                this.offlineQueue = [];
                alert('Offline işlemler başarıyla senkronize edildi!');
              }
            },
            error: (err) => {
              console.error('Sync error:', err);
              alert('Bazı işlemler senkronize edilemedi!');
            }
          });
        });
      }
    } else {
      alert('Bağlantı yok, senkronizasyon mümkün değil!');
    }
  }
}
