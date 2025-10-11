import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-device-detail',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule, MatTooltipModule],
  providers: [DatePipe],
  host: { 'ngSkipHydration': '' },
  template: `
    <div class="device-detail-container">
      <!-- Header -->
      <mat-card class="header-card">
        <div class="header-content">
          <button *ngIf="isLoggedIn" mat-icon-button (click)="goBack()" class="back-button">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <div class="header-info" [class.no-margin]="!isLoggedIn">
            <span class="material-symbols-outlined device-icon">computer</span>
            <div class="device-title">
              <h1>{{ device?.name || 'Cihaz Detayı' }}</h1>
              <p class="device-subtitle">{{ device?.identity_no }}</p>
            </div>
          </div>
        </div>
      </mat-card>

      <!-- 2 Column Layout -->
      <div class="main-content">
        <!-- Sol Sütun - Cihaz Bilgileri -->
        <div class="left-column">
          <mat-card class="combined-info-card">
            <!-- Temel Bilgiler -->
            <div class="info-section">
              <div class="section-header">
                <span class="material-symbols-outlined card-icon">info</span>
                <h3>Temel Bilgiler</h3>
              </div>
              <div class="info-row">
                <span class="label">Kimlik No:</span>
                <span class="value">{{ device?.identity_no || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Cihaz Adı:</span>
                <span class="value">{{ device?.name || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Seri No:</span>
                <span class="value">{{ device?.serial_no || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Kullanıcı:</span>
                <span class="value">{{ device?.user || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Durum:</span>
                <mat-chip [class]="getStatusClass(device?.status)">
                  {{ device?.status || '-' }}
                </mat-chip>
              </div>
            </div>

            <mat-divider></mat-divider>

            <!-- Tür & Lokasyon -->
            <div class="info-section">
              <div class="section-header">
                <span class="material-symbols-outlined card-icon">category</span>
                <h3>Tür & Lokasyon</h3>
              </div>
              <div class="info-row">
                <span class="label">Cihaz Tipi:</span>
                <span class="value">{{ device?.DeviceType?.name || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Cihaz Kodu:</span>
                <span class="value">{{ device?.DeviceType?.device_code || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Lokasyon:</span>
                <span class="value">{{ device?.Location?.name || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Oda No:</span>
                <span class="value">{{ device?.Location?.room_number || '-' }}</span>
              </div>
            </div>

            <!-- Özellikler (Feature + Değer) -->
            <div class="info-section" *ngIf="device?.Features && device.Features.length > 0">
              <mat-divider></mat-divider>
              <div class="section-header">
                <span class="material-symbols-outlined card-icon">settings</span>
                <h3>Özellikler</h3>
              </div>
              <div class="features-container">
                <mat-chip *ngFor="let feature of device.Features" class="feature-chip" matTooltip="{{feature.name}}">
                  <strong>{{ feature.name }}:</strong>&nbsp;{{ feature.DeviceFeature?.value || '-' }}
                </mat-chip>
              </div>
            </div>

            <!-- QR Code -->
            <div class="info-section qr-section" *ngIf="device?.qr_code">
              <mat-divider></mat-divider>
              <div class="section-header">
                <span class="material-symbols-outlined card-icon">qr_code</span>
                <h3>QR Kod</h3>
              </div>
              <p class="qr-description">QR kodu taratarak cihaz detay sayfasına erişebilirsiniz.</p>
              <div class="qr-container">
                <div class="qr-wrapper">
                  <img [src]="device.qr_code" alt="QR Kod" class="qr-image" />
                  <div class="qr-info">
                    <p class="qr-identity">{{ device?.identity_no }}</p>
                  </div>
                </div>
              </div>
            </div>
          </mat-card>
        </div>

        <!-- Sağ Sütun - İşlem Geçmişi -->
        <div class="right-column">
          <mat-card class="operations-card">
            <mat-card-header>
              <span class="material-symbols-outlined card-icon">history</span>
              <mat-card-title>İşlem Geçmişi</mat-card-title>
              <div class="operations-count">{{ operations.length }} işlem</div>
            </mat-card-header>
            <mat-divider></mat-divider>
            <mat-card-content>
              <div *ngIf="operations.length === 0" class="no-operations">
                <span class="material-symbols-outlined">assignment</span>
                <p>Bu cihaz için henüz işlem kaydı bulunmuyor.</p>
              </div>

              <div *ngIf="operations.length > 0" class="operations-timeline">
                <div *ngFor="let operation of operations" class="operation-item">
                  <div class="operation-date">
                    <div class="date-circle" [class]="operation.is_completed ? 'completed' : 'pending'">
                      <span class="material-symbols-outlined">
                        {{ operation.is_completed ? 'check_circle' : 'schedule' }}
                      </span>
                    </div>
                    <div class="date-text">
                      {{ operation.date || operation.createdAt | date:'dd/MM/yyyy' }}
                      <br>
                      <small>{{ operation.date || operation.createdAt | date:'HH:mm' }}</small>
                    </div>
                  </div>

                  <div class="operation-content">
                    <div class="operation-header">
                      <h3>{{ operation.OperationType?.name || 'Bilinmeyen İşlem' }}</h3>
                      <mat-chip [class]="operation.is_completed ? 'completed-chip' : 'pending-chip'">
                        {{ operation.is_completed ? 'Tamamlandı' : 'Devam Ediyor' }}
                      </mat-chip>
                    </div>

                    <p class="operation-description">{{ operation.description || 'Açıklama bulunmuyor.' }}</p>

                    <div class="operation-footer">
                      <span class="technician">
                        <span class="material-symbols-outlined">engineering</span>
                        {{ operation.Technician?.name || 'Bilinmeyen Teknisyen' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .device-detail-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px 20px;
    }

    .header-card {
      margin-bottom: 32px;
      padding: 4px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 16px 20px;
    }

    .back-button {
      flex-shrink: 0;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }

    .header-info.no-margin {
      margin-left: 0;
    }

    .device-icon {
      font-size: 48px;
      color: #667eea;
    }

    .device-title h1 {
      margin: 0;
      font-size: 2rem;
      color: #2c3e50;
    }

    .device-subtitle {
      margin: 4px 0 0 0;
      color: #7f8c8d;
      font-size: 1.1rem;
    }

    /* 2 Column Layout */
    .main-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }

    .left-column,
    .right-column {
      min-height: 500px;
    }

    /* Combined Info Card */
    .combined-info-card {
      height: fit-content;
      padding: 8px;
    }

    .info-section {
      padding: 24px 20px;
    }

    .info-section:first-child {
      padding-top: 20px;
    }

    .info-section:last-child {
      padding-bottom: 20px;
    }

    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }

    .section-header h3 {
      margin: 0;
      font-size: 1.2rem;
      color: #2c3e50;
      font-weight: 500;
    }

    .card-icon {
      margin-right: 8px;
      color: #667eea;
      font-size: 20px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 4px;
      border-bottom: 1px solid #f0f2f5;
    }

    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 8px;
    }

    .label {
      font-weight: 500;
      color: #34495e;
      font-size: 0.95rem;
    }

    .value {
      color: #2c3e50;
      font-weight: 400;
      font-size: 0.95rem;
    }

    .status-active {
      background-color: #27ae60 !important;
      color: white !important;
    }

    .status-inactive {
      background-color: #e74c3c !important;
      color: white !important;
    }

    .features-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 12px;
      padding: 8px 0;
    }

    .feature-chip {
      background-color: #667eea !important;
      color: white !important;
      margin: 2px;
    }

    /* QR Section */
    .qr-section {
      text-align: center;
      padding: 20px 16px;
    }

    .qr-description {
      color: #6c757d;
      font-size: 0.9rem;
      margin: 0 0 16px 0;
      font-style: italic;
    }

    .qr-container {
      display: flex;
      justify-content: center;
      padding: 20px 0;
    }

    .qr-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #fafbfc;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e8eaed;
    }

    .qr-image {
      max-width: 180px;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
      margin-bottom: 16px;
    }

    .qr-info {
      text-align: center;
    }

    .qr-identity {
      font-size: 1.1rem;
      font-weight: 600;
      color: #000000;
      margin: 0 0 8px 0;
      padding: 8px 16px;
      background: #ffffff;
      border: 2px solid #000000;
      border-radius: 6px;
      display: inline-block;
    }

    .qr-url {
      font-size: 0.9rem;
      color: #2c3e50;
      margin: 0;
      word-break: break-all;
      font-family: 'Courier New', monospace;
      background: #f8f9fa;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #dee2e6;
      font-weight: 500;
    }

    /* Operations Card */
    .operations-card {
      height: fit-content;
      padding: 8px;
    }

    .operations-count {
      background: #667eea;
      color: white;
      padding: 6px 16px;
      border-radius: 16px;
      font-size: 0.875rem;
      font-weight: 500;
      margin-left: auto;
    }

    .no-operations {
      text-align: center;
      padding: 48px 24px;
      color: #7f8c8d;
    }

    .no-operations .material-symbols-outlined {
      font-size: 56px;
      display: block;
      margin-bottom: 20px;
      opacity: 0.4;
    }

    .no-operations p {
      margin: 0;
      font-size: 1.1rem;
    }

    .operations-timeline {
      padding: 24px 16px;
    }

    .operation-item {
      display: flex;
      gap: 20px;
      margin-bottom: 28px;
      padding: 16px 12px 20px 12px;
      border-bottom: 1px solid #f0f2f5;
      border-radius: 8px;
      transition: background-color 0.2s ease;
    }

    .operation-item:hover {
      background-color: #fafbfc;
    }

    .operation-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 16px;
    }

    .operation-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
      min-width: 85px;
      padding-top: 4px;
    }

    .date-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .date-circle.completed {
      background-color: #27ae60;
      color: white;
    }

    .date-circle.pending {
      background-color: #f39c12;
      color: white;
    }

    .date-circle .material-symbols-outlined {
      font-size: 18px;
    }

    .date-text {
      text-align: center;
      font-size: 0.8rem;
      color: #7f8c8d;
      line-height: 1.3;
    }

    .operation-content {
      flex: 1;
      padding-top: 2px;
    }

    .operation-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      gap: 16px;
    }

    .operation-header h3 {
      margin: 0;
      color: #2c3e50;
      font-size: 1.1rem;
      font-weight: 600;
      flex: 1;
      line-height: 1.3;
    }

    .completed-chip {
      background-color: #27ae60 !important;
      color: white !important;
      font-size: 0.75rem !important;
    }

    .pending-chip {
      background-color: #f39c12 !important;
      color: white !important;
      font-size: 0.75rem !important;
    }

    .operation-description {
      color: #34495e;
      line-height: 1.6;
      margin-bottom: 14px;
      font-size: 0.95rem;
      padding-right: 8px;
    }

    .operation-footer {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 8px;
    }

    .technician {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #7f8c8d;
      font-size: 0.8rem;
    }

    .technician .material-symbols-outlined {
      font-size: 14px;
    }

    /* Mobile Responsive */
    @media (max-width: 1024px) {
      .main-content {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .device-detail-container {
        max-width: 100%;
        padding: 20px 16px;
      }

      .header-content {
        padding: 16px;
      }

      .info-section {
        padding: 20px 16px;
      }

      .operations-timeline {
        padding: 20px 8px;
      }
    }    @media (max-width: 768px) {
      .device-detail-container {
        padding: 16px 12px;
      }

      .header-card {
        margin-bottom: 24px;
      }

      .header-content {
        padding: 12px 16px;
        gap: 16px;
      }

      .device-title h1 {
        font-size: 1.5rem;
      }

      .info-section {
        padding: 18px 12px;
      }

      .operation-item {
        gap: 16px;
        padding: 12px 8px 16px 8px;
        margin-bottom: 20px;
      }

      .operation-date {
        min-width: 75px;
      }

      .date-circle {
        width: 38px;
        height: 38px;
      }

      .operation-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .qr-image {
        max-width: 160px;
      }

      .qr-section {
        padding: 16px 12px;
      }
    }

    @media (max-width: 480px) {
      .device-detail-container {
        padding: 12px 8px;
      }

      .header-content {
        gap: 12px;
        padding: 12px;
      }

      .device-icon {
        font-size: 36px;
      }

      .device-title h1 {
        font-size: 1.3rem;
      }

      .main-content {
        gap: 16px;
      }

      .info-section {
        padding: 16px 8px;
      }

      .operation-item {
        flex-direction: column;
        gap: 12px;
        padding: 16px 8px;
        margin-bottom: 16px;
      }

      .operation-date {
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        gap: 12px;
        min-width: auto;
        padding-top: 0;
      }

      .date-circle {
        margin-bottom: 0;
      }

      .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        padding: 10px 4px;
      }

      .qr-section {
        padding: 12px 8px;
      }

      .qr-wrapper {
        padding: 16px;
      }

      .qr-image {
        max-width: 140px;
      }

      .qr-identity {
        font-size: 1rem;
        padding: 6px 12px;
      }

      .qr-url {
        font-size: 0.75rem;
        padding: 4px 8px;
      }

      .operations-timeline {
        padding: 16px 4px;
      }

      .no-operations {
        padding: 32px 16px;
      }
    }
  `]
})
export class DeviceDetailComponent implements OnInit {
  device: any = null;
  operations: any[] = [];
  deviceId: string = '';
  isLoggedIn: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // Oturum kontrolü
    this.checkLoginStatus();

    this.route.params.subscribe(params => {
      this.deviceId = params['id'];
      if (this.deviceId) {
        this.loadDeviceDetail();
        this.loadDeviceOperations();
      }
    });
  }

  private getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  private checkLoginStatus() {
    this.isLoggedIn = !!this.getToken();
  }

  loadDeviceDetail() {
    const options: any = {};
    if (this.isLoggedIn) {
      options.headers = this.getHeaders();
    }

    this.http.get(`${environment.apiUrl}/api/devices/${this.deviceId}`, options)
      .subscribe({
        next: (response: any) => {
          this.device = response;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Cihaz detayları yüklenirken hata:', error);
        }
      });
  }

  loadDeviceOperations() {
    const options: any = {};
    if (this.isLoggedIn) {
      options.headers = this.getHeaders();
    }

    this.http.get(`${environment.apiUrl}/api/operations?deviceId=${this.deviceId}`, options)
      .subscribe({
        next: (response: any) => {
          this.operations = response.sort((a: any, b: any) => {
            const dateA = new Date(a.date || a.createdAt);
            const dateB = new Date(b.date || b.createdAt);
            return dateB.getTime() - dateA.getTime(); // En yeni en üstte
          });
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Cihaz işlemleri yüklenirken hata:', error);
        }
      });
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'status-active' : 'status-inactive';
  }

  goBack() {
    if (this.isLoggedIn) {
      this.router.navigate(['/devices']);
    } else {
      window.history.back();
    }
  }
}
