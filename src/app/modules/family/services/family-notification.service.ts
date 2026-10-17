import { Injectable, inject, DestroyRef } from '@angular/core';
import { Firestore, collection, query, orderBy, limit, onSnapshot, where } from '@angular/fire/firestore';
import { FamilyService } from './family.service';
import { NotificationManagerService } from 'src/app/util/service/notification-manager.service';
import { UserService } from 'src/app/util/service/db/user.service';
import { effect } from '@angular/core';
import { Transaction } from 'src/app/util/models/transaction.model';
import { TransactionStatus } from 'src/app/util/config/enums';

import { environment } from 'src/environments/environment';

/**
 * Service responsible for monitoring family activity and triggering notifications.
 * It listens for new transactions added by other family members in real-time.
 */
@Injectable({
  providedIn: 'root'
})
export class FamilyNotificationService {
  private familyService = inject(FamilyService);
  private notificationManager = inject(NotificationManagerService);
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);

  private currentFamilyId: string | null = null;

  constructor() {
    // Note: Transaction notification delivery is handled authoritatively by the Firebase Cloud Function
    // (onFamilyTransactionCreated) via FCM to avoid duplicate notifications and save client reads.
  }

  /**
   * Stops any listener if active
   */
  private stopListener(): void {
    this.currentFamilyId = null;
  }
}
