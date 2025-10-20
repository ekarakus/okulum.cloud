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

    // Eğer rota verisinde bir rol belirtilmişse, en derin child'tan al (child route'lar override edebilir)
    const deepest = this.getDeepestChild(route);
    const requiredRole = deepest?.data?.['role'] as 'super_admin' | 'admin' | undefined;
    const currentUser = this.authService.getCurrentUser();

    if (requiredRole) {
      // Eğer kullanıcı yoksa ya da rol eşleşmiyorsa dashboard'a yönlendir
      if (!currentUser || currentUser.role !== requiredRole) {
        this.router.navigate(['/dashboard']);
        return false;
      }
    }

    return true;
  }

  // Yönlendirilmiş ActivatedRouteSnapshot ağacının en derin child'ını döndürür
  private getDeepestChild(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let current: ActivatedRouteSnapshot = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }

}
