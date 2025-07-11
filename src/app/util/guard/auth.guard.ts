import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  CanActivateChild
} from "@angular/router";
import { Observable, of, throwError, timer } from "rxjs";
import { catchError, map, switchMap, take, timeout, retry } from "rxjs/operators";
import { UserService } from "../service/user.service";
import { getAuth, onAuthStateChanged, User } from '@angular/fire/auth';
import { NotificationService } from "../service/notification.service";
import { User as AppUser, UserRole } from "../models/user.model";

interface SecurityConfig {
  readonly SESSION_TIMEOUT: number;
  readonly INACTIVITY_TIMEOUT: number;
  readonly MAX_LOGIN_ATTEMPTS: number;
  readonly LOCKOUT_DURATION: number;
  readonly PASSWORD_MIN_LENGTH: number;
  readonly REQUIRE_EMAIL_VERIFICATION: boolean;
  readonly ENABLE_RATE_LIMITING: boolean;
  readonly SECURE_HEADERS: boolean;
}

const SECURITY_CONFIG: SecurityConfig = {
  SESSION_TIMEOUT: 30 * 60 * 1000,
  INACTIVITY_TIMEOUT: 60 * 60 * 1000, 
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000,
  PASSWORD_MIN_LENGTH: 8,
  REQUIRE_EMAIL_VERIFICATION: true,
  ENABLE_RATE_LIMITING: true,
  SECURE_HEADERS: true
};

interface RoutePermission {
  readonly roles: UserRole[];
  readonly requireEmailVerification: boolean;
  readonly requireTwoFactor: boolean;
  readonly requireActiveSession: boolean;
}

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate, CanActivateChild {

  private readonly loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil?: number }>();
  private readonly sessionStartTime = new Map<string, number>();
  private readonly securityHeaders = new Map<string, string>([
    ['X-Content-Type-Options', 'nosniff'],
    ['X-Frame-Options', 'DENY'],
    ['X-XSS-Protection', '1; mode=block'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ['Permissions-Policy', 'geolocation=(), microphone=(), camera=()']
  ]);

  constructor(
    private router: Router,
    private userService: UserService,
    private notificationService: NotificationService
  ) {
    this.initializeSecurityHeaders();
    this.startSessionMonitoring();
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.performSecurityCheck(route, state);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.performSecurityCheck(route, state);
  }

  private performSecurityCheck(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const auth = getAuth();

    return new Observable<boolean>((observer) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        unsubscribe(); // stop listening after first trigger

        try {
          console.log('[AuthGuard] Firebase user:', firebaseUser);

          if (!firebaseUser) {
            await this.handleUnauthenticatedUser(state);
            observer.next(false);
            return;
          }

          // Ensure session timestamp is initialized
          if (!this.sessionStartTime.has(firebaseUser.uid)) {
            console.log('[AuthGuard] Initializing session for user:', firebaseUser.uid);
            this.updateSessionTimestamp(firebaseUser.uid);
          }

          if (this.isSessionExpired(firebaseUser.uid)) {
            await this.handleSessionExpired(firebaseUser, state);
            observer.next(false);
            return;
          }

          const userData = await this.userService.getCurrentUser();

          if (!userData) {
            await this.handleInvalidUserData(firebaseUser, state);
            observer.next(false);
            return;
          }

          const hasPermission = await this.checkRoutePermissions(route, userData, firebaseUser);

          if (!hasPermission) {
            await this.handleInsufficientPermissions(userData, state);
            observer.next(false);
            return;
          }

          this.updateSessionTimestamp(firebaseUser.uid);

          this.logSecurityEvent('ROUTE_ACCESS_GRANTED', {
            userId: firebaseUser.uid,
            route: state.url,
            timestamp: new Date().toISOString()
          });

          observer.next(true);
        } catch (error) {
          console.error('[AuthGuard] Error:', error);
          await this.handleSecurityError(error, state);
          observer.next(false);
        }
      });
    }).pipe(
      timeout(15000),
      retry(1),
      catchError(error => {
        console.error('[AuthGuard] Critical error:', error);
        this.router.navigate(['/sign-in'], {
          queryParams: {
            error: 'auth_failed',
            redirect: state.url
          }
        });
        return of(false);
      })
    );
  }

  private async checkRoutePermissions(route: ActivatedRouteSnapshot, userData: AppUser, firebaseUser: User): Promise<boolean> {
    const routeData = route.data as RoutePermission;

    if (routeData?.requireEmailVerification && !firebaseUser.emailVerified) {
      console.warn('[AuthGuard] Email not verified');
      return false;
    }

    if (routeData?.roles?.length > 0 && !routeData.roles.includes(userData.role)) {
      console.warn('[AuthGuard] Insufficient role:', userData.role);
      return false;
    }

    if (routeData?.requireTwoFactor && !this.hasTwoFactorEnabled(userData)) {
      console.warn('[AuthGuard] Two-factor required');
      return false;
    }

    return true;
  }

  private isSessionExpired(uid: string): boolean {
    const sessionStart = this.sessionStartTime.get(uid);
    const now = Date.now();
    return !!sessionStart && (now - sessionStart > SECURITY_CONFIG.SESSION_TIMEOUT);
  }

  private updateSessionTimestamp(uid: string): void {
    this.sessionStartTime.set(uid, Date.now());
  }

  private async handleUnauthenticatedUser(state: RouterStateSnapshot): Promise<void> {
    console.log('[AuthGuard] User not authenticated');
    this.router.navigate(['/sign-in'], {
      queryParams: {
        session: 'expired',
        redirect: state.url
      }
    });
  }

  private async handleSessionExpired(firebaseUser: User, state: RouterStateSnapshot): Promise<void> {
    console.log('[AuthGuard] Session expired:', firebaseUser.uid);
    this.sessionStartTime.delete(firebaseUser.uid);
    this.userService.clearCachedUserData();
    await this.userService.signOut();
    this.router.navigate(['/sign-in'], {
      queryParams: {
        session: 'expired',
        redirect: state.url,
        reason: 'timeout'
      }
    });
  }

  private async handleInvalidUserData(firebaseUser: User, state: RouterStateSnapshot): Promise<void> {
    console.error('[AuthGuard] Invalid user data for:', firebaseUser.uid);
    this.userService.clearCachedUserData();
    await this.userService.signOut();
    this.router.navigate(['/sign-in'], {
      queryParams: {
        error: 'invalid_user_data',
        redirect: state.url
      }
    });
  }

  private async handleInsufficientPermissions(userData: AppUser, state: RouterStateSnapshot): Promise<void> {
    console.warn('[AuthGuard] No permission:', userData.uid);
    this.notificationService.error('Access Denied: You do not have permission to access this page.');
    this.router.navigate(['/dashboard'], {
      queryParams: {
        error: 'insufficient_permissions',
        requestedRoute: state.url
      }
    });
  }

  private async handleSecurityError(error: any, state: RouterStateSnapshot): Promise<void> {
    console.error('[AuthGuard] Security error:', error);
    this.router.navigate(['/sign-in'], {
      queryParams: {
        error: 'security_error',
        redirect: state.url,
        message: error.message || 'Unknown error'
      }
    });
  }

  private startSessionMonitoring(): void {
    let inactivityTimer: any;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        this.handleInactivity();
      }, SECURITY_CONFIG.INACTIVITY_TIMEOUT);
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();
  }

  private handleInactivity(): void {
    const currentUser = this.userService.getUser();
    if (currentUser) {
      console.log('[AuthGuard] Inactivity detected. Logging out user:', currentUser.uid);
      this.userService.signOut();
    }
  }

  private hasTwoFactorEnabled(userData: AppUser): boolean {
    return false; // Implement your logic
  }

  private initializeSecurityHeaders(): void {
    if (!SECURITY_CONFIG.SECURE_HEADERS) return;
    this.securityHeaders.forEach((value, key) => {
      if (typeof document !== 'undefined') {
        const meta = document.createElement('meta');
        meta.httpEquiv = key;
        meta.content = value;
        document.head.appendChild(meta);
      }
    });
  }

  private logSecurityEvent(eventType: string, data: any): void {
    console.log(`[SecurityEvent] ${eventType}`, data);
  }
}
