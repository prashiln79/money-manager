import { Injectable } from "@angular/core";
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from "@angular/router";
import { Observable } from "rxjs";
import { UserService } from "../service/user.service";
import { getAuth, onAuthStateChanged } from '@angular/fire/auth';

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private userService: UserService) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return new Observable<boolean>((observer) => {
      onAuthStateChanged(getAuth(), (user) => {
        if (user) {
          console.log('User authenticated, allowing access to:', state.url);
          
          // Optional: Role-based access placeholder
          // const allowedRoles = route.data['roles'] as string[];
          // if (allowedRoles && !this.userService.hasRole(user.uid, allowedRoles)) {
          //   this.router.navigate(['/dashboard']);
          //   observer.next(false);
          //   return;
          // }
          
          observer.next(true);
        } else {
          console.log('User not authenticated, redirecting to sign-in');
          
          // Check if there's cached auth data that might indicate a cache update issue
          const hasCachedAuthData = this.checkForCachedAuthData();
          
          if (hasCachedAuthData) {
            console.log('Found cached auth data, user might have been logged out due to cache update');
            // You could show a message to the user about the cache update
          }
          
          this.router.navigate(['/landing'], {
            queryParams: { 
              session: 'expired', 
              redirect: state.url,
              cacheUpdate: hasCachedAuthData ? 'true' : 'false'
            }
          });
          observer.next(false);
        }
      });
    });
  }

  private checkForCachedAuthData(): boolean {
    try {
      // Check for Firebase auth data in localStorage
      const authKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('firebase:authUser:') || 
        key.startsWith('firebase:persistence:')
      );
      
      // Check for cached user data
      const userDataKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('user-data-')
      );
      
      return authKeys.length > 0 || userDataKeys.length > 0;
    } catch (error) {
      console.error('Error checking cached auth data:', error);
      return false;
    }
  }

  /**
   * Check if a user is authenticated
   * @param {string[]} allowedUserRoles - These user roles have the permissions to access the route.
   * @returns {Promise<boolean>} True if user is authenticated otherwise false
   */
  private checkPermission(allowedUserRoles: Array<any>): boolean {
    // let usr:User = this.auth.getCurrentUser();

    return false;
  }
}
