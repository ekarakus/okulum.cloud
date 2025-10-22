import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private auth: AuthService) {}

  // Robust permission check: super_admin -> always true.
  // Otherwise expect user to have `permissions` array (strings) or `permissionsMap` object.
  hasPermission(permissionName: string): boolean {
    // If the client is currently fetching consolidated permissions from the server,
    // treat the state as "unknown" for UI rendering. Returning TRUE here causes
    // UI (sidebar) to render every menu item while the server request is in-flight
    // which creates the flicker (show everything then remove). Instead, we return
    // FALSE so the UI doesn't show items prematurely. Route guards will explicitly
    // allow navigation during fetch by checking AuthService.isFetchingPermissions().
      try {
        // @ts-ignore internal flag accessor
        if ((this.auth as any).isFetchingPermissions && (this.auth as any).isFetchingPermissions()) {
          return false;
        }
      } catch (e) {}
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
    // If auth produced a normalized lookup, use it for fastest, deterministic checks
    const lookup: any = (user as any).permissionsLookup || (user as any).permissionsMap || (user as any).PermissionsMap;
    if (lookup && typeof lookup === 'object') {
      const key = normalize(permissionName);
      if (lookup[key]) return true;
    }
    if (Array.isArray(anyPerms)) {
      // Build a normalized list and perform tolerant matching. Some backends
      // store slightly different strings (extra whitespace, punctuation, suffixes).
      try {
        const normalizedList = anyPerms.map((p: any) => {
          if (p == null) return '';
          if (typeof p === 'string') return normalize(p);
          const candidate = p.name || p.permission || p.key || p.slug || p.label || p.title || JSON.stringify(p);
          return normalize(candidate);
        }).filter((s: string) => !!s);

        // exact match or substring match to tolerate minor backend differences
        for (const np of normalizedList) {
          if (np === target) return true;
          if (np.includes(target) || target.includes(np)) return true;
        }

        
        return false;
      } catch (e) {
        return false;
      }
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
