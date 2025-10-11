import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  // Public device detail (QR erişimi için anonim)
  {
    path: 'device-detail/:id',
    loadComponent: () => import('./layouts/public-device-layout.component').then(m => m.PublicDeviceLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./device-detail/device-detail.component').then(m => m.DeviceDetailComponent)
      }
    ]
  },

  // Auth Layout Routes (Login/Register)
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent) }
    ]
  },

  // Dashboard Layout Routes (All other pages)
  {
    path: '',
    loadComponent: () => import('./layouts/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      // Ana dashboard - tüm kullanıcılar
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { requiresSchool: true }
      },

      // Super Admin only routes
      {
        path: 'schools',
        loadComponent: () => import('./school-list/school-list.component').then(m => m.SchoolListComponent),
        data: { role: 'super_admin' }
      },
      {
        path: 'users',
        loadComponent: () => import('./user-list/user-list.component').then(m => m.UserListComponent),
        data: { role: 'super_admin' }
      },
      {
        path: 'global-settings',
        loadComponent: () => import('./global-settings/global-settings.component').then(m => m.GlobalSettingsComponent),
        data: { role: 'super_admin' }
      },

      // Global tables - Super Admin only
      {
        path: 'device-types',
        loadComponent: () => import('./device-type-list/device-type-list.component').then(m => m.DeviceTypeListComponent),
        data: { role: 'super_admin' }
      },
      {
        path: 'operation-types',
        loadComponent: () => import('./operation-type-list/operation-type-list.component').then(m => m.OperationTypeListComponent),
        data: { role: 'super_admin' }
      },
      {
        path: 'features',
        loadComponent: () => import('./feature-list/feature-list.component').then(m => m.FeatureListComponent),
        data: { role: 'super_admin' }
      },

      // School-specific routes - tüm kimlik doğrulaması yapılmış kullanıcılar
      {
        path: 'devices',
        loadComponent: () => import('./device-list/device-list.component').then(m => m.DeviceListComponent),
        data: { requiresSchool: true }
      },
      // device-detail public'a taşındı
      {
        path: 'locations',
        loadComponent: () => import('./location-list/location-list.component').then(m => m.LocationListComponent),
        data: { requiresSchool: true }
      },
      {
        path: 'technicians',
        loadComponent: () => import('./technician-list/technician-list.component').then(m => m.TechnicianListComponent),
        data: { requiresSchool: true }
      },
      {
        path: 'operations',
        loadComponent: () => import('./operation-list/operation-list.component').then(m => m.OperationListComponent),
        data: { requiresSchool: true, prerender: false }
      }
      ,
      {
        path: 'reports/preview',
        loadComponent: () => import('./report-preview/report-preview.component').then(m => m.ReportPreviewComponent),
        data: { requiresSchool: true }
      }
    ]
  },

  // Compatibility redirects for old URLs
  { path: 'login', redirectTo: '/auth/login' },
  { path: 'register', redirectTo: '/auth/register' }
];
