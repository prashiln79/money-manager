import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { UserService } from '../service/db/user.service';
import { LocalIndexDBStorageService } from '../service/indexdb-storage.service';
import { LocalStorageKey } from '../models/local-storage.model';

/**
 * Root guard directing authenticated users to the dashboard
 * and new/unauthenticated visitors to the public landing page.
 */
export const rootGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const userService = inject(UserService);
  const storageService = inject(LocalIndexDBStorageService);

  const cachedUser = userService.getCurrentUserSnapshot();
  const lastActiveUid = storageService.getItem<string>(LocalStorageKey.LAST_ACTIVE_UID);

  if (auth.currentUser || userService.isGuestUser() || cachedUser || lastActiveUid) {
    return router.createUrlTree(['/dashboard']);
  }

  return router.createUrlTree(['/landing']);
};
