import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { NotificationService } from '../service/notification.service';
import { UserService } from '../service/user.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  
  constructor(
    private auth: Auth,
    private router: Router,
    private notificationService: NotificationService,
    private userService: UserService
  ) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return from(this.checkAdminAccess());
  }

  private async checkAdminAccess(): Promise<boolean> {
    try {
      const user = await this.auth.currentUser;
      
      if (!user) {
        this.notificationService.error('Authentication required');
        this.router.navigate(['/sign-in']);
        return false;
      }

      // Check if user is admin
      const isAdmin = await this.isUserAdmin();
      
      if (!isAdmin) {
        this.notificationService.error('Admin access required');
        this.router.navigate(['/dashboard']);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking admin access:', error);
      this.notificationService.error('Failed to verify admin access');
      this.router.navigate(['/dashboard']);
      return false;
    }
  }

  private async isUserAdmin(): Promise<boolean> {
    return this.userService.isAdmin;
  }
} 