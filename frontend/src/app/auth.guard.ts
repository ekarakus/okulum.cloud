import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Token var mı kontrol et
    if (!this.authService.getToken()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Gerekli rol var mı kontrol et
    const requiredRole = route.data['role'] as 'super_admin' | 'admin';
    const currentUser = this.authService.getCurrentUser();

    if (requiredRole) {
      if (currentUser?.role !== requiredRole) {
        // Yetkisi yoksa ana sayfaya yönlendir
        this.router.navigate(['/dashboard']);
        return false;
      }
    }

    return true;
  }
}
