import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private auth: AuthService) {}

  // Robust permission check: super_admin -> always true.
  // Otherwise expect user to have `permissions` array (strings) or `permissionsMap` object.
  hasPermission(permissionName: string): boolean {
    const user = this.auth.getCurrentUser();
    if (!user) return false;
    // Super admin bypass
    if (user.role && String(user.role).toLowerCase() === 'super_admin') return true;
    // normalize helper: remove diacritics, lowercase and strip non-alphanumerics
    const normalize = (s: any) => {
      if (s == null) return '';
      try {
        const str = String(s);
        // remove diacritics (works for Turkish characters), then lowercase and remove non-alphanum
        return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
      } catch (e) {
        return String(s).toLowerCase();
      }
    };

    const target = normalize(permissionName);

    // permissions array (strings or objects)
    const anyPerms: any = (user as any).permissions || (user as any).Permissions;
    if (Array.isArray(anyPerms)) {
      return anyPerms.some((p: any) => {
        if (p == null) return false;
        if (typeof p === 'string') return normalize(p) === target;
        // object permission: try common fields
        const candidate = p.name || p.permission || p.key || p.slug || p.label || p.title;
        return normalize(candidate) === target;
      });
    }

    // permissions map/object where keys may be permission names
    const map = (user as any).permissionsMap || (user as any).permissions_obj || (user as any).permissionsObject || (user as any).PermissionsMap;
    if (map && typeof map === 'object') {
      // try direct key match first
      if (map[permissionName]) return true;
      // try normalized keys
      for (const k of Object.keys(map)) {
        if (normalize(k) === target && map[k]) return true;
      }
    }

    // Fallback: if user has a single string permissions field with comma-separated values
    const permString = (user as any).permissionsString || (user as any).perms || (user as any).permission;
    if (typeof permString === 'string') {
      return permString.split(',').map(s => normalize(s)).includes(target);
    }

    // --- If we reached here, permission not found. Emit debug info to help troubleshooting ---
    try {
      // eslint-disable-next-line no-console
      console.debug('PermissionService.hasPermission: permission not matched', {
        requested: permissionName,
        normalizedRequested: target,
        userPreview: { id: (user as any).id, role: (user as any).role },
        anyPerms: (user as any).permissions || (user as any).Permissions,
        permMap: (user as any).permissionsMap || (user as any).permissions_obj || (user as any).PermissionsMap,
        bySchool: (user as any).permissions_by_school || (user as any).permissionsBySchool || (user as any).school_permissions,
        schools: (user as any).schools || (user as any).Schools
      });
    } catch(e) {}

    // --- School-scoped permission checks ---
    // Many backends attach school-specific permissions either as:
    // - user.permissions_by_school = { [schoolId]: ['Perm A', ...] }
    // - user.school_permissions = { [schoolId]: { 'Perm A': true } }
    // - user.schools = [{ id, name, assignment: { permissions: [...] } , permissions: [...] }, ...]
    // We'll check common variants using the currently selected school from AuthService.
    try {
      const selected = this.auth.getSelectedSchool && this.auth.getSelectedSchool();
      const schoolId = selected && (selected as any).id;
      if (schoolId) {
        // check permissions_by_school or school_permissions maps
        const bySchool = (user as any).permissions_by_school || (user as any).permissionsBySchool || (user as any).school_permissions || (user as any).permissions_map_by_school;
        if (bySchool && typeof bySchool === 'object') {
          const entry = bySchool[schoolId] || bySchool[String(schoolId)];
          if (entry) {
            if (Array.isArray(entry)) {
              if (entry.some((p: any) => normalize(p) === target)) return true;
            } else if (typeof entry === 'object') {
              // object map e.g. { 'Personel Yönetimi': true }
              for (const k of Object.keys(entry)) {
                if (normalize(k) === target && entry[k]) return true;
              }
            }
          }
        }

        // check user.schools entries
        const schoolsArr: any[] = (user as any).schools || (user as any).Schools;
        if (Array.isArray(schoolsArr)) {
          const s = schoolsArr.find(x => (x && (x.id === schoolId || x.id === Number(schoolId))));
          if (s) {
            // possible locations for perms on school entry
            const sp = s.permissions || s.Permissions || (s.assignment && s.assignment.permissions) || s.assignment?.permissions || s.assignment?.permissions_obj || s.permission;
            if (Array.isArray(sp)) {
              if (sp.some((p: any) => normalize(p) === target)) return true;
            } else if (sp && typeof sp === 'object') {
              for (const k of Object.keys(sp)) {
                if (normalize(k) === target && !!sp[k]) return true;
              }
            }
          }
        }
      }
    } catch (e) {
      // swallow and proceed to deny
    }

    // Fallback: check if role contains admin-like wording (conservative: deny)
    return false;
  }

  canView(permissionName: string): boolean { return this.hasPermission(permissionName); }

  // helper used by route guards: returns true or false and leaves navigation to caller
  requireOrFalse(permissionName: string): boolean {
    return this.hasPermission(permissionName);
  }
}
