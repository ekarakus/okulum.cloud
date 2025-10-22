import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
// ...existing imports
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';

import { Router } from '@angular/router';
import { AuthService, User, School } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { environment } from '../../environments/environment';
import { apiBase } from '../runtime-config';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatMenuModule, MatChipsModule, MatDividerModule, MatDialogModule],
  host: { 'ngSkipHydration': '' },
  template: `
    <div class="dashboard-container">

      <!-- Personnel-support-only view: shown to users with 'Personel Destek Talebi' permission -->
      <ng-container *ngIf="isPersonnelSupportView()">
        <h2 class="section-title">Destek Taleplerim</h2>
        <div class="my-supports-list">
          <div *ngIf="mySupports && mySupports.length > 0">
            <mat-card *ngFor="let s of mySupports" class="support-card">
              <div class="support-row">
                <div class="support-main">
                  <div class="support-title">#{{ s.id }} — {{ s.issue_details || s.summary || 'Destek Talebi' }}</div>
                  <div class="support-meta">{{ s.device_name || s.device?.name || s.device_identity || '' }} • {{ s.location_name || (s.Device && s.Device.Location && s.Device.Location.name) || '' }}</div>
                </div>
                <div class="support-actions">
                  <button mat-button color="primary" (click)="openSupportModal($event, s)">İşlem Geçmişi</button>
                  <span class="status-badge" [class]="statusBadgeClass(s.status)">{{ statusLabel(s.status) }}</span>
                </div>
              </div>
            </mat-card>
          </div>
          <div *ngIf="!mySupports || mySupports.length === 0" class="no-data">
            <p>Henüz oluşturduğunuz destek talebi bulunmamaktadır.</p>
            <button mat-stroked-button color="primary" (click)="navigateTo('/faults')">Yeni Destek Talebi Oluştur</button>
          </div>
        </div>
      </ng-container>

      <!-- Default full dashboard (shown when not personnel-support user) -->
      <ng-container *ngIf="!isPersonnelSupportView()">

      <!-- Ana İstatistikler - 3'lü Grid -->
      <div class="main-stats-section">
        <h2 class="section-title">Genel Durum</h2>
        <div class="main-stats-grid">
          <!-- Toplam Demirbaş -->
          <mat-card class="main-stat-card device-card" (click)="navigateTo('/devices')">
            <div class="main-stat-content">
              <div class="main-stat-icon-wrapper">
                <span class="material-symbols-rounded main-stat-icon" aria-hidden="true">devices</span>
                <div class="icon-bg device-bg"></div>
              </div>
              <div class="main-stat-text">
                <div class="main-stat-number">{{ totalDevices }}</div>
                <div class="main-stat-label">Toplam Demirbaş</div>
                <div class="main-stat-subtitle">Kayıtlı demirbaşlar</div>
              </div>
              <div class="card-corner-accent device-accent"></div>
            </div>
          </mat-card>

          <!-- Toplam İşlem -->
          <mat-card class="main-stat-card operation-card" (click)="navigateTo('/operations')">
            <div class="main-stat-content">
              <div class="main-stat-icon-wrapper">
                <span class="material-symbols-rounded main-stat-icon" aria-hidden="true">assignment</span>
                <div class="icon-bg operation-bg"></div>
              </div>
              <div class="main-stat-text">
                <div class="main-stat-number">{{ totalOperations }}</div>
                <div class="main-stat-label">Toplam İşlem</div>
                <div class="main-stat-subtitle">Tüm kayıtlar</div>
              </div>
              <div class="card-corner-accent operation-accent"></div>
            </div>
          </mat-card>

          <!-- İşlem Bekleyen -->
          <mat-card class="main-stat-card pending-card">
            <div class="main-stat-content">
              <div class="main-stat-icon-wrapper">
                <span class="material-symbols-rounded main-stat-icon" aria-hidden="true">pending</span>
                <div class="icon-bg pending-bg"></div>
              </div>
              <div class="main-stat-text">
                <div class="main-stat-number">{{ pendingOperations }}</div>
                <div class="main-stat-label">İşlem Bekleyen</div>
                <div class="main-stat-subtitle">Tamamlanmamış</div>
              </div>
              <div class="card-corner-accent pending-accent"></div>
            </div>
          </mat-card>
        </div>
      </div>

      <!-- Tamamlanan İşlemler - 3'lü Grid -->
      <div class="completed-stats-section">
        <h2 class="section-title">✅ Tamamlanan İşlemler</h2>
        <div class="completed-stats-grid">
          <!-- Toplam Tamamlanan -->
          <mat-card class="completed-stat-card total-completed-card">
            <div class="completed-stat-content">
              <div class="completed-stat-header">
                <span class="material-symbols-rounded completed-stat-icon">check_circle</span>
                <div class="completed-stat-badge total-badge">TOPLAM</div>
              </div>
              <div class="completed-stat-main">
                <div class="completed-stat-number">{{ completedOperations }}</div>
                <div class="completed-stat-text">
                  <div class="completed-stat-label">Tamamlanan İşlem</div>
                  <div class="completion-text">{{ getCompletionPercentage() | number:'1.0-0' }}% tamamlandı</div>
                </div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill total-progress" [style.width.%]="getCompletionPercentage()"></div>
              </div>
            </div>
          </mat-card>

          <!-- Son 30 Gün Tamamlanan -->
          <mat-card class="completed-stat-card monthly-completed-card">
            <div class="completed-stat-content">
              <div class="completed-stat-header">
                <span class="material-symbols-rounded completed-stat-icon">calendar_month</span>
                <div class="completed-stat-badge monthly-badge">30 GÜN</div>
              </div>
              <div class="completed-stat-main">
                <div class="completed-stat-number">{{ completedLast30Days }}</div>
                <div class="completed-stat-text">
                  <div class="completed-stat-label">Son 30 Gün</div>
                  <div class="completion-text">{{ operationsLast30Days }} toplam işlemden</div>
                </div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill monthly-progress" [style.width.%]="getMonthlyCompletionPercentage()"></div>
              </div>
            </div>
          </mat-card>

          <!-- Son 7 Gün Tamamlanan -->
          <mat-card class="completed-stat-card weekly-completed-card">
            <div class="completed-stat-content">
              <div class="completed-stat-header">
                <span class="material-symbols-rounded completed-stat-icon">today</span>
                <div class="completed-stat-badge weekly-badge">7 GÜN</div>
              </div>
              <div class="completed-stat-main">
                <div class="completed-stat-number">{{ completedLast7Days }}</div>
                <div class="completed-stat-text">
                  <div class="completed-stat-label">Son 7 Gün</div>
                  <div class="completion-text">{{ operationsLast7Days }} toplam işlemden</div>
                </div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill weekly-progress" [style.width.%]="getWeeklyCompletionPercentage()"></div>
              </div>
            </div>
          </mat-card>
        </div>
      </div>

  <!-- Hızlı İşlemler -->
      <div class="quick-operations-section">
        <h2 class="section-title">⚡ Hızlı İşlemler</h2>
        <div class="quick-operations-grid">
          <!-- Sol Sütun - Son İşlem Yapılan Demirbaşlar -->
          <mat-card class="quick-ops-card">
            <mat-card-header>
              <span class="material-symbols-outlined card-icon">devices</span>
              <mat-card-title>Son 4 İşlem Yapılan Demirbaş</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="ops-list">
                <div *ngFor="let device of recentDevices" class="ops-item" (click)="navigateTo('/device-detail/' + device.id)">
                  <div class="ops-icon">
                    <span class="material-symbols-outlined">devices</span>
                  </div>
                  <div class="ops-content">
                    <div class="ops-title">{{ device.name }}</div>
                    <div class="ops-subtitle">{{ device.identity_no }}</div>
                    <div class="ops-meta">{{ device.location_name }} • {{ device.last_operation_date | date:'dd/MM/yyyy' }}</div>
                  </div>
                  <div class="ops-arrow">
                    <span class="material-symbols-outlined">arrow_forward_ios</span>
                  </div>
                </div>
                <div *ngIf="recentDevices.length === 0" class="no-data">
                  <span class="material-symbols-outlined">info</span>
                  <p>Henüz işlem yapılan demirbaş bulunmuyor.</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Sağ Sütun - Son İşlemler -->
          <mat-card class="quick-ops-card">
            <mat-card-header>
              <span class="material-symbols-outlined card-icon">assignment</span>
              <mat-card-title>Son 4 İşlem</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="ops-list">
                <div *ngFor="let operation of recentOperations" class="ops-item" (click)="navigateTo('/operations')">
                  <div class="ops-icon" [class]="operation.is_completed ? 'completed' : 'pending'">
                    <span class="material-symbols-outlined">{{ operation.is_completed ? 'check_circle' : 'schedule' }}</span>
                  </div>
                  <div class="ops-content">
                    <div class="ops-title">{{ operation.operation_type_name }}</div>
                    <div class="ops-subtitle">{{ operation.device_name }} ({{ operation.device_identity }})</div>
                    <div class="ops-meta">{{ operation.technician_name }} • {{ operation.date | date:'dd/MM/yyyy HH:mm' }}</div>
                  </div>
                  <div class="ops-status">
                    <span class="status-chip" [class]="operation.is_completed ? 'completed-chip' : 'pending-chip'">
                      {{ operation.is_completed ? 'Tamamlandı' : 'Devam Ediyor' }}
                    </span>
                  </div>
                </div>
                <div *ngIf="recentOperations.length === 0" class="no-data">
                  <span class="material-symbols-outlined">info</span>
                  <p>Henüz işlem kaydı bulunmuyor.</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
  </div>

  </ng-container>

    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 16px;
      max-width: 1400px;
      margin: 0 auto;
      background: #f8f9fa;
      min-height: calc(100vh - 120px);
      overflow-y: auto;
    }

    /* Header styles removed (simplified dashboard) */

    /* Admin Section */
    .admin-section {
      margin-bottom: 2rem;
    }

    .admin-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .admin-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 12px;
      overflow: hidden;
    }

    .admin-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .admin-card-content {
      display: flex;
      align-items: center;
      padding: 1.5rem;
      gap: 1rem;
    }

    .admin-icon {
      font-size: 2.5rem;
      color: #667eea;
    }

    .admin-text {
      flex: 1;
    }

    .admin-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
      color: #2c3e50;
    }

    .admin-subtitle {
      font-size: 0.9rem;
      color: #666;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 8px;
        min-height: calc(100vh - 100px);
      }
    }

    .section-title {
      margin: 0 0 16px 0;
      font-size: 1.3rem;
      font-weight: 500;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .my-supports-list { margin-bottom: 16px; }
    .support-card { margin-bottom: 12px; padding: 12px; border-radius: 10px; }
    .support-row { display:flex; align-items:center; justify-content:space-between; }
    .support-main { flex:1; }
    .support-title { font-weight:600; }
    .support-meta { font-size:0.9rem; color:#666; }
    .support-actions { display:flex; align-items:center; gap:12px; }
    .status-badge { padding:6px 10px; border-radius:12px; font-weight:600; }
    .status-badge.pending { background:#fff3cd; color:#856404; }
    .status-badge.inprogress { background:#cce5ff; color:#004085; }
    .status-badge.closed { background:#d4edda; color:#155724; }

    @media (max-width: 768px) {
      .section-title {
        font-size: 1.1rem;
        margin-bottom: 12px;
      }
    }

    /* Ana İstatistikler */
    .main-stats-section {
      margin-bottom: 24px;
    }

    .main-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    @media (max-width: 768px) {
      .main-stats-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }

    .main-stat-card {
      position: relative;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }

    .main-stat-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 12px 32px rgba(0,0,0,0.15);
    }

    .main-stat-content {
      padding: 16px;
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    @media (max-width: 480px) {
      .main-stat-content {
        padding: 12px;
        gap: 8px;
      }
    }

    .main-stat-icon-wrapper {
      position: relative;
      flex-shrink: 0;
    }

    .main-stat-icon {
      font-size: 32px;
      z-index: 2;
      position: relative;
      color: white;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .icon-bg {
      position: absolute;
      top: -8px;
      left: -8px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      z-index: 1;
    }

    .device-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .operation-bg { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    .pending-bg { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); }

    .main-stat-text {
      flex: 1;
      min-width: 0;
    }

    .main-stat-number {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 4px;
      background: linear-gradient(135deg, #2c3e50, #34495e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
    }

    .main-stat-label {
      font-size: 1rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 2px;
      line-height: 1.2;
    }

    .main-stat-subtitle {
      font-size: 0.8rem;
      color: #7f8c8d;
      line-height: 1.2;
    }

    .card-corner-accent {
      position: absolute;
      top: 0;
      right: 0;
      width: 60px;
      height: 60px;
      clip-path: polygon(100% 0, 0 0, 100% 100%);
    }

    .device-accent { background: linear-gradient(135deg, #667eea, #764ba2); }
    .operation-accent { background: linear-gradient(135deg, #f093fb, #f5576c); }
    .pending-accent { background: linear-gradient(135deg, #ffecd2, #fcb69f); }

    /* Tamamlanan İşlemler */
    .completed-stats-section {
      margin-bottom: 20px;
    }

    .completed-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    @media (max-width: 768px) {
      .completed-stats-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }

    .completed-stat-card {
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .completed-stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }

    .completed-stat-content {
      padding: 16px;
    }

    .completed-stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .completed-stat-main {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .completed-stat-text {
      flex: 1;
      min-width: 0;
    }

    .completed-stat-icon {
      font-size: 32px;
    }

    .total-completed-card .completed-stat-icon { color: #27ae60; }
    .monthly-completed-card .completed-stat-icon { color: #3498db; }
    .weekly-completed-card .completed-stat-icon { color: #e74c3c; }

    .completed-stat-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .total-badge { background: #27ae60; }
    .monthly-badge { background: #3498db; }
    .weekly-badge { background: #e74c3c; }

    .completed-stat-number {
      font-size: 2rem;
      font-weight: 700;
      color: #2c3e50;
      line-height: 1;
      flex-shrink: 0;
    }

    .completed-stat-label {
      font-size: 1rem;
      font-weight: 500;
      color: #34495e;
      margin-bottom: 4px;
      line-height: 1.2;
    }

    .progress-bar {
      width: 100%;
      height: 6px;
      background: #ecf0f1;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .total-progress { background: linear-gradient(90deg, #27ae60, #2ecc71); }
    .monthly-progress { background: linear-gradient(90deg, #3498db, #5dade2); }
    .weekly-progress { background: linear-gradient(90deg, #e74c3c, #ec7063); }

    .completion-text {
      font-size: 0.8rem;
      color: #7f8c8d;
      font-weight: 500;
      line-height: 1.2;
    }

    /* Hızlı İşlemler */
    .quick-operations-section {
      margin-bottom: 32px;
    }

    .quick-operations-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      width: 100%;
      margin: 0; /* full width inside container */
    }

    @media (min-width: 1024px) {
      .quick-operations-section {
        margin-left: -16px; /* negate container horizontal padding */
        margin-right: -16px;
        padding-left: 16px; /* preserve inner spacing */
        padding-right: 16px;
      }
    }

    .quick-ops-card {
      height: fit-content;
    }

    .quick-ops-card .mat-mdc-card-header {
      padding-bottom: 8px;
    }

    .quick-ops-card .card-icon {
      color: #667eea;
      font-size: 24px;
      margin-right: 8px;
    }

    .ops-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .ops-item {
      display: flex;
      align-items: center;
      padding: 12px 8px;
      border-bottom: 1px solid #f0f2f5;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .ops-item:hover {
      background-color: #f8f9fa;
    }

    .ops-item:last-child {
      border-bottom: none;
    }

    .ops-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      background-color: #667eea;
      color: white;
    }

    .ops-icon.completed {
      background-color: #27ae60;
    }

    .ops-icon.pending {
      background-color: #f39c12;
    }

    .ops-icon .material-symbols-outlined {
      font-size: 20px;
    }

    .ops-content {
      flex: 1;
      min-width: 0;
    }

    .ops-title {
      font-weight: 600;
      color: #2c3e50;
      font-size: 0.95rem;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ops-subtitle {
      color: #7f8c8d;
      font-size: 0.85rem;
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ops-meta {
      color: #95a5a6;
      font-size: 0.75rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ops-arrow {
      flex-shrink: 0;
      color: #bdc3c7;
    }

    .ops-arrow .material-symbols-outlined {
      font-size: 16px;
    }

    .ops-status {
      flex-shrink: 0;
      margin-left: 8px;
    }

    .status-chip {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 500;
      color: white;
    }

    .completed-chip {
      background-color: #27ae60;
    }




    .pending-chip {
      background-color: #f39c12;
    }

    .no-data {
      text-align: center;
      padding: 32px 16px;
      color: #7f8c8d;
    }

    .no-data .material-symbols-outlined {
      font-size: 48px;
      opacity: 0.5;
      display: block;
      margin-bottom: 12px;
    }

    .no-data p {
      margin: 0;
      font-size: 0.9rem;
    }

    /* Hızlı Erişim */
    .quick-actions-section {
      margin-bottom: 20px;
    }

    /* On desktop show actions in a single non-wrapping row so buttons don't drop
       to a second line. On smaller screens fall back to grid layout. */
    .actions-grid {
      display: flex;
      flex-wrap: nowrap;
      gap: 16px;
      max-width: 1400px;
      margin: 0 auto;
      justify-content: center;
      align-items: stretch;
    }

    /* Each action button should grow equally but keep a sensible minimum width */
    .actions-grid .action-btn {
      flex: 1 1 140px;
      min-width: 140px;
      max-width: 240px;
    }

    @media (max-width: 1200px) {
      /* Keep them on one line for medium desktops but allow more flexible sizing */
      .actions-grid { gap: 12px; }
      .actions-grid .action-btn { flex: 1 1 120px; min-width: 120px; }
    }

    @media (max-width: 1024px) {
      /* For smaller screens use the grid layout (wrap into multiple rows) */
      .actions-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        max-width: none;
      }
      .actions-grid .action-btn { flex: initial; max-width: none; }
    }

    @media (max-width: 768px) {
      .actions-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        max-width: none;
      }
    }

    @media (max-width: 480px) {
      .actions-grid {
        grid-template-columns: 1fr;
        gap: 8px;
      }
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 12px;
      min-height: 80px;
      text-transform: none;
      font-size: 0.9rem;
      border-radius: 12px;
      transition: all 0.3s ease;
      font-weight: 500;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }

    /* Make all quick-action buttons share a unified background and white text */
    .actions-grid .action-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      border: none;
    }
    .actions-grid .action-btn .action-icon { color: #fff; }

    .action-btn mat-icon {
      margin-bottom: 12px;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    /* Action Button Material Symbols Icons */
    .action-icon {
      margin-bottom: 8px;
      font-size: 28px;
      color: white;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    /* Renkli Buton Stilleri */
    .primary-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    /* Make report button visually consistent with other action buttons */
    .report-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
    }

    .accent-btn {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .info-btn {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    .success-btn {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      color: white;
    }

    .warning-btn {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      color: white;
    }

    .secondary-btn {
      background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
      color: #2c3e50;
    }

    .feature-btn {
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
      color: #2c3e50;
    }

    .primary-btn:hover, .accent-btn:hover, .info-btn:hover,
    .success-btn:hover, .warning-btn:hover, .secondary-btn:hover, .feature-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.2);
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }

      .dashboard-header {
        padding: 20px 16px;
      }

      .quick-operations-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .ops-item {
        padding: 10px 4px;
      }

      .ops-content {
        margin-right: 8px;
      }

      .dashboard-header h1 {
        font-size: 2rem;
      }

      .main-stats-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .completed-stats-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .main-stat-number {
        font-size: 2.5rem;
      }

      .completed-stat-number {
        font-size: 2rem;
      }

      .actions-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }

      .action-btn {
        min-height: 80px;
        padding: 16px 12px;
        font-size: 0.9rem;
      }

      .action-btn mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .action-icon {
        width: 24px;
        height: 24px;
      }
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .header-center {
        align-self: stretch;
      }

      .school-selector {
        min-width: auto;
        width: 100%;
        max-width: none;
      }
    }

    @media (max-width: 480px) {
      .main-stats-grid {
        grid-template-columns: 1fr;
      }

      .completed-stats-grid {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .action-btn {
        min-height: 70px;
        padding: 12px 8px;
        font-size: 0.8rem;
      }

      .action-btn mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        margin-bottom: 8px;
      }

      .action-icon {
        width: 20px;
        height: 20px;
        margin-bottom: 8px;
      }

      .section-title {
        font-size: 1.3rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats: any = null;
  recentDevices: any[] = [];
  recentOperations: any[] = [];

  // Auth-related properties
  currentUser: User | null = null;
  selectedSchool: School | null = null;

  // Getter methods for safer access
  get totalDevices(): number {
    return this.stats?.overview?.totalDevices || 0;
  }

  get completedOperations(): number {
    return this.stats?.overview?.completedOperations || 0;
  }

  get pendingOperations(): number {
    return this.stats?.overview?.pendingOperations || 0;
  }

  get completedLast7Days(): number {
    return this.stats?.overview?.completedLast7Days || 0;
  }

  get completedLast30Days(): number {
    return this.stats?.overview?.completedLast30Days || 0;
  }

  get operationsLast7Days(): number {
    return this.stats?.overview?.operationsLast7Days || 0;
  }

  get operationsLast30Days(): number {
    return this.stats?.overview?.operationsLast30Days || 0;
  }

  get totalOperations(): number {
    return this.stats?.overview?.totalOperations || 0;
  }

  // Percentage calculations
  getCompletionPercentage(): number {
    if (this.totalOperations === 0) return 0;
    return (this.completedOperations / this.totalOperations) * 100;
  }

  getWeeklyCompletionPercentage(): number {
    if (this.operationsLast7Days === 0) return 0;
    return (this.completedLast7Days / this.operationsLast7Days) * 100;
  }

  getMonthlyCompletionPercentage(): number {
    if (this.operationsLast30Days === 0) return 0;
    return (this.completedLast30Days / this.operationsLast30Days) * 100;
  }

  // Navigation
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  mySupports: any[] = [];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService,
    private permission: PermissionService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Subscribe to auth service observables
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      // Debug: print current user and permissions to console for troubleshooting
      try {
        console.log('Auth currentUser (dashboard):', user);
        const perms = (user as any)?.permissions || (user as any)?.Permissions || ((typeof localStorage !== 'undefined' && localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user') || '{}').permissions : undefined);
        console.log('Detected permissions for current user:', perms);
      } catch (e) {
        console.warn('Could not log permissions', e);
      }
      // Whenever the current user changes, refresh the mySupports list if needed
      if (this.isPersonnelSupportView()) {
        // small async delay to ensure selectedSchool is set
        setTimeout(() => this.loadMySupports(), 0);
      } else {
        this.mySupports = [];
      }
    });

    this.authService.selectedSchool$.subscribe(school => {
      this.selectedSchool = school;
      // Okul değiştiğinde tüm verileri yeniden yükle
      this.loadDashboardStats();
      this.loadRecentDevices();
      this.loadRecentOperations();
      // If user is personnel-support, also load their supports
      if (this.isPersonnelSupportView()) {
        this.loadMySupports();
      } else {
        this.mySupports = [];
      }
    });
  }  private loadDashboardStats() {
    const token = this.authService.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      // Okul ID'sini parametre olarak ekle - SÜPER ADMİN DAHİL HERKES SEÇİLİ OKULA GÖRE FİLTRELENECEK
  let url = `${apiBase}/api/stats`;
      if (this.selectedSchool) {
        url += `?school_id=${this.selectedSchool.id}`;
      }

      this.http.get(url, { headers }).subscribe({
        next: (data) => {
          this.stats = data;
          console.log('Dashboard stats loaded:', data);
          this.cdr.detectChanges();
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 0);
        },
        error: (error) => {
          console.error('Error loading dashboard stats:', error);
        }
      });
    }
  }

  isPersonnelSupportView(): boolean {
    try {
      const cur = this.authService.getCurrentUser();
      if (!cur) return false;
      // Require admin role and the special permission OR any user (non-superadmin) who has the permission
      if (String(cur.role).toLowerCase() === 'super_admin') return false;
      return this.permission.hasPermission('Personel Destek Talebi');
    } catch (e) { return false; }
  }

  statusLabel(status: any): string {
    if (!status) return '';
    const s = String(status).toLowerCase();
    if (s === 'pending' || s === 'open') return 'Bekliyor';
    if (s === 'in_progress') return 'İşlemde';
    if (s === 'closed') return 'Kapandı';
    return status;
  }

  statusBadgeClass(status: any): string {
    const s = (status||'').toString().toLowerCase();
    if (s === 'pending' || s === 'open') return 'status-badge pending';
    if (s === 'in_progress') return 'status-badge inprogress';
    if (s === 'closed') return 'status-badge closed';
    return 'status-badge';
  }

  private loadMySupports() {
    const token = this.authService.getToken();
    if (!token) return;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let url = `${apiBase}/api/faults`;
    const params: string[] = [];
    if (this.selectedSchool) params.push(`school_id=${this.selectedSchool.id}`);
    const cur = this.authService.getCurrentUser();
    if (cur && cur.id) {
      // backend may accept different param names for filtering by creator; include common variants
      params.push(`created_by_user_id=${cur.id}`);
      params.push(`created_by_id=${cur.id}`);
      params.push(`user_id=${cur.id}`);
      params.push(`requested_by_user_id=${cur.id}`);
    }
    if (params.length) url += `?${params.join('&')}`;
    this.http.get(url, { headers }).subscribe({ next: (data: any) => {
      this.mySupports = Array.isArray(data?.faults) ? data.faults : (Array.isArray(data) ? data : []);
      this.cdr.detectChanges();
    }, error: (err) => { console.error('loadMySupports', err); this.mySupports = []; this.cdr.detectChanges(); } });
  }

  openSupportModal(ev: Event, s: any) {
    if (ev) ev.stopPropagation();
    try {
      import('../operation-support-dialog/operation-support-dialog.component').then(m => m.OperationSupportDialogComponent).then(cmp => {
        this.dialog.open(cmp, { width: '720px', data: { supportId: s.id } });
      }).catch(err => console.error('openSupportModal import failed', err));
    } catch (e) { console.error('openSupportModal', e); }
  }

  // Preview state
  // ...existing code...

  private getAuthHeaders(){
    const token = this.authService.getToken();
    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
  }

  async printGroupedByLocation(){
    const params: any = { groupBy: 'location' };
    if (this.selectedSchool) params.school_id = this.selectedSchool.id;
    this.router.navigate(['/reports/preview'], { queryParams: params });
  }

  async printGroupedByDeviceType(){
    const params: any = { groupBy: 'device_type' };
    if (this.selectedSchool) params.school_id = this.selectedSchool.id;
    this.router.navigate(['/reports/preview'], { queryParams: params });
  }

  // ...existing code...

  private loadRecentDevices() {
    const token = this.authService.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  let url = `${apiBase}/api/devices/recent`;
      if (this.selectedSchool) {
        url += `?school_id=${this.selectedSchool.id}`;
      }

      this.http.get(url, { headers }).subscribe({
        next: (data: any) => {
          this.recentDevices = Array.isArray(data) ? data.slice(0, 4) : [];
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading recent devices:', error);
          this.recentDevices = [];
          this.cdr.detectChanges();
        }
      });
    }
  }

  private loadRecentOperations() {
    const token = this.authService.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  let url = `${apiBase}/api/operations/recent`;
      if (this.selectedSchool) {
        url += `?school_id=${this.selectedSchool.id}`;
      }

      this.http.get(url, { headers }).subscribe({
        next: (data: any) => {
          this.recentOperations = Array.isArray(data) ? data.slice(0, 4) : [];
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading recent operations:', error);
          this.recentOperations = [];
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Role-based methods
  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  // Removed role chip & header helpers per new simplified design

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
