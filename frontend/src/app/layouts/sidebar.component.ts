import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SidebarService } from './sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTooltipModule],
  template: `
    <aside class="app-sidebar" [class.collapsed]="collapsed">
      <div class="sidebar-header">
        <button class="collapse-btn" (click)="toggle()" aria-label="Toggle sidebar">{{ collapsed ? '»' : '«' }}</button>
        <div class="brand" *ngIf="!collapsed">Okulum.cloud</div>
      </div>

      <nav class="sidebar-nav">
        <!-- Giriş link placed just above Okul işlemleri -->
        <div class="nav-group home-group" style="margin-bottom: 0px;">
          <a routerLink="/" class="nav-link home-nav" [matTooltip]="'Giriş'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed">
            <span class="icon home-icon">🏠</span>
            <span class="label" *ngIf="!collapsed">Giriş</span>
          </a>
        </div>

        <div class="nav-group">
          <div class="group-title" *ngIf="!collapsed">🏫 Okul işlemleri</div>
          <a routerLink="/school-employees" class="nav-link" [matTooltip]="'Personel Yönetimi'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed">
            <span class="icon">👥</span>
            <span class="label" *ngIf="!collapsed">Personel Yönetimi</span>
          </a>
          <a routerLink="/students" class="nav-link" [matTooltip]="'Öğrenciler'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed">
            <span class="icon">🎓</span>
            <span class="label" *ngIf="!collapsed">Öğrenciler</span>
          </a>
        </div>

        <div class="nav-group">
          <div class="group-title" *ngIf="!collapsed">🖥️ Ekran İşlemleri</div>
          <a routerLink="/duty-locations" class="nav-link" [matTooltip]="'Nöbet Yerleri'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed"><span class="icon">📍</span><span class="label" *ngIf="!collapsed">Nöbet Yerleri</span></a>
          <a routerLink="/duty-schedule" class="nav-link" [matTooltip]="'Nöbetçi Tablosu'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed"><span class="icon">📅</span><span class="label" *ngIf="!collapsed">Nöbetçi Tablosu</span></a>
          <a routerLink="/school-time-table" class="nav-link" [matTooltip]="'Ders Saatleri'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed"><span class="icon">⏰</span><span class="label" *ngIf="!collapsed">Ders Saatleri</span></a>
          <a routerLink="/announcements" class="nav-link" [matTooltip]="'Duyurular'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed"><span class="icon">📢</span><span class="label" *ngIf="!collapsed">Duyurular</span></a>
          <a routerLink="/info-nuggets" class="nav-link" [matTooltip]="'Bilgi Kartları'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed"><span class="icon">💡</span><span class="label" *ngIf="!collapsed">Bilgi Kartları</span></a>
          <a routerLink="/observances" class="nav-link" [matTooltip]="'Belirli Gün ve Haftalar'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed"><span class="icon">📆</span><span class="label" *ngIf="!collapsed">Belirli Gün ve Haftalar</span></a>
        </div>

        <div class="nav-group">
          <div class="group-title" *ngIf="!collapsed">🚀 Demirbaş</div>
          <a routerLink="/devices" class="nav-link" [matTooltip]="'Demirbaşlar'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed"><span class="icon">🖥️</span><span class="label" *ngIf="!collapsed">Demirbaşlar</span></a>
          <a routerLink="/operations" class="nav-link" [matTooltip]="'İşlemler'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed"><span class="icon">⚙️</span><span class="label" *ngIf="!collapsed">İşlemler</span></a>
          <a routerLink="/technicians" class="nav-link" [matTooltip]="'Teknisyenler'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed"><span class="icon">🧑‍🔧</span><span class="label" *ngIf="!collapsed">Teknisyenler</span></a>
          <a routerLink="/locations" class="nav-link" [matTooltip]="'Lokasyonlar'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed"><span class="icon">📍</span><span class="label" *ngIf="!collapsed">Lokasyonlar</span></a>
          <a routerLink="/reports" class="nav-link" [matTooltip]="'Raporlar'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed"><span class="icon">📊</span><span class="label" *ngIf="!collapsed">Raporlar</span></a>
          <a routerLink="/device-types" *ngIf="isSuperAdmin()" class="nav-link" [matTooltip]="'Demirbaş Tipleri'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed"><span class="icon">🧾</span><span class="label" *ngIf="!collapsed">Demirbaş Tipleri</span></a>
          <a routerLink="/operation-types" *ngIf="isSuperAdmin()" class="nav-link" [matTooltip]="'İşlem Türleri'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed"><span class="icon">�</span><span class="label" *ngIf="!collapsed">İşlem Türleri</span></a>
          <a routerLink="/features" *ngIf="isSuperAdmin()" class="nav-link" [matTooltip]="'Özellikler'" matTooltipPosition="right" [matTooltipDisabled]="!collapsed"><span class="icon">⚙️</span><span class="label" *ngIf="!collapsed">Özellikler</span></a>
        </div>

        <div class="nav-group">
          <div class="group-title" *ngIf="!collapsed">Sistem Yönetimi</div>
          <a routerLink="/schools" class="nav-link" [attr.title]="collapsed ? 'Okul Yönetimi' : null"><span class="icon">🏫</span><span class="label" *ngIf="!collapsed">Okul Yönetimi</span></a>
          <a routerLink="/users" class="nav-link" [attr.title]="collapsed ? 'Kullanıcı Yönetimi' : null"><span class="icon">👤</span><span class="label" *ngIf="!collapsed">Kullanıcı Yönetimi</span></a>
          <a routerLink="/global-settings" class="nav-link" [attr.title]="collapsed ? 'Global Ayarlar' : null"><span class="icon">🔧</span><span class="label" *ngIf="!collapsed">Global Ayarlar</span></a>
        </div>
      </nav>
    </aside>
  `,
  styles: [
    `
    .app-sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: #fff; border-right: 1px solid #e6e6e6; padding: 12px; overflow:auto; transition: width 200ms ease; z-index: 1000; }
    .app-sidebar.collapsed { width: 60px; }
    .sidebar-header { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
  .home-link { display:flex; align-items:center; gap:8px; text-decoration:none; color:inherit; font-weight:600; }
  .home-icon { width:28px; display:inline-flex; justify-content:center; }
  .home-label { white-space:nowrap; }
    .collapse-btn { border: none; background: #1976d2; color: white; padding:6px 8px; border-radius:6px; cursor:pointer; }
    .brand { font-weight:700; font-size:1.1rem; }
  .sidebar-nav { display:flex; flex-direction:column; gap:10px; }
    .nav-group { padding:6px 4px; }
  .nav-group.home-group { margin-bottom:6px; }
    .group-title { font-size:0.9rem; font-weight:600; color:#444; margin-bottom:6px; }
  .nav-link { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:6px; text-decoration:none; color:#333; cursor:pointer; min-height:36px; }
    .nav-link .icon { width:28px; display:inline-flex; justify-content:center; }
    .nav-link .label { white-space:nowrap; }
    .nav-link:hover { background: rgba(0,0,0,0.04); }
    /* When collapsed, hide labels, center icons */
    .app-sidebar.collapsed .label { display:none; }
    .app-sidebar.collapsed .group-title { display:none; }
  .app-sidebar.collapsed .nav-link { justify-content:center; padding:8px; height:40px; }
    `
  ]
})
export class SidebarComponent {
  collapsed = false;
  constructor(private svc: SidebarService) {
    // initialize collapsed state from service
    this.svc.collapsed$.subscribe(v => this.collapsed = v);
  }
  toggle() { this.svc.toggle(); }
  isSuperAdmin() { try { const u = (window as any).__APP_USER; return u && u.is_super_admin; } catch(e){ return false; } }
}
