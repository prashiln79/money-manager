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
          // Optional: Role-based access placeholder
          // const allowedRoles = route.data['roles'] as string[];
          // if (allowedRoles && !this.userService.hasRole(user.uid, allowedRoles)) {
          //   this.router.navigate(['/dashboard']);
          //   observer.next(false);
          //   return;
          // }
          observer.next(true);
        } else {
          this.router.navigate(['/sign-in'], {
            queryParams: { session: 'expired', redirect: state.url }
          });
          observer.next(false);
        }
      });
    });
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
