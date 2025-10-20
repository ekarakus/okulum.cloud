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
        path: 'employee-types',
        loadComponent: () => import('./employee-type-page/employee-type-page.component').then(m => m.EmployeeTypePageComponent),
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
      {
        path: 'permissions',
        loadComponent: () => import('./permission-list/permission-list.component').then(m => m.PermissionListComponent),
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
        path: 'duty-locations',
        loadComponent: () => import('./duty-location-list/duty-location-list.component').then(m => m.DutyLocationListComponent),
        data: { requiresSchool: true }
      },
      {
        path: 'duty-schedule',
        loadComponent: () => import('./duty-schedule/duty-schedule.component').then(m => m.DutyScheduleComponent),
        data: { requiresSchool: true }
      },
      {
        path: 'technicians',
        loadComponent: () => import('./technician-list/technician-list.component').then(m => m.TechnicianListComponent),
        data: { requiresSchool: true }
      },
      {
        path: 'school-employees',
        loadComponent: () => import('./school-employees/school-employees.component').then(m => m.SchoolEmployeesComponent),
        data: { requiresSchool: true }
      },
      {
        path: 'school-time-table',
        loadComponent: () => import('./school-time-table/school-time-table-list.component').then(m => m.SchoolTimeTableListComponent),
        data: { requiresSchool: true }
      },
      {
        path: 'announcements',
        loadComponent: () => import('./announcement-list/announcement-list.component').then(m => m.AnnouncementListComponent),
        data: { requiresSchool: true }
      },
      {
        path: 'info-nuggets',
        loadComponent: () => import('./info-nuggets/info-nuggets-list.component').then(m => m.InfoNuggetsListComponent),
        data: { requiresSchool: true }
      },
      {
        path: 'info-nugget-categories',
        loadComponent: () => import('./info-nuggets/info-nugget-categories.component').then(m => m.InfoNuggetCategoriesComponent),
        data: { requiresSchool: true }
      },
      {
        path: 'students',
        loadComponent: () => import('./student-list/student-list.component').then(m => m.StudentListComponent),
        data: { requiresSchool: true }
      },
      {
        path: 'operations',
        loadComponent: () => import('./operation-list/operation-list.component').then(m => m.OperationListComponent),
        data: { requiresSchool: true, prerender: false }
      }
      ,
      {
        path: 'observances',
        loadComponent: () => import('./observances/observances-list.component').then(m => m.ObservancesListComponent),
        data: { requiresSchool: true }
      }
      ,
      {
        path: 'reports/preview',
        loadComponent: () => import('./report-preview/report-preview.component').then(m => m.ReportPreviewComponent),
        data: { requiresSchool: true }
      }
      ,
      // Redirect for plain /reports (sidebar links may point to this)
      {
        path: 'reports',
        redirectTo: 'reports/preview',
        pathMatch: 'full'
      }
    ]
  },

  // Compatibility redirects for old URLs
  { path: 'login', redirectTo: '/auth/login' },
  { path: 'register', redirectTo: '/auth/register' }
];
