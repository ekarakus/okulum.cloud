import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { PermissionService } from '../services/permission.service';

export const PermissionGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  // Expect the route to provide data.permission string
  const permission = route.data && (route.data as any).permission;
  if (!permission) {
    // If no permission declared, allow by default
    return true;
  }

  const allowed = permissionService.hasPermission(permission as string);
  if (allowed) return true;

  // redirect to no-permission page and include the missing permission name as a query param
  const missing = encodeURIComponent(permission as string);
  return router.parseUrl(`/no-permission?perm=${missing}`) as UrlTree;
};
