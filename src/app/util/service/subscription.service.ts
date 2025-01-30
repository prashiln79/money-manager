import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, Timestamp } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';

export interface Subscription {
  userId: string;
  plan: string;
  startDate: Timestamp;
  endDate: Timestamp;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {

  constructor(private firestore: Firestore, private auth: Auth) {}

  // 🔹 Create a new subscription
  async createSubscription(userId: string, subscription: Subscription): Promise<void> {
    const subscriptionRef = doc(this.firestore, `users/${userId}/subscription`);
    await setDoc(subscriptionRef, {
      ...subscription,
      startDate: Timestamp.fromDate(new Date(subscription.startDate.toDate())),
      endDate: Timestamp.fromDate(new Date(subscription.endDate.toDate())),
    });
  }

  // 🔹 Get the current subscription for a user
  async getSubscription(userId: string): Promise<Subscription | undefined> {
    const subscriptionRef = doc(this.firestore, `users/${userId}/subscription`);
    const subscriptionSnap = await getDoc(subscriptionRef);
    if (subscriptionSnap.exists()) {
      return subscriptionSnap.data() as Subscription;
    }
    return undefined;
  }

  // 🔹 Update the subscription plan
  async updateSubscriptionPlan(userId: string, newPlan: string): Promise<void> {
    const subscriptionRef = doc(this.firestore, `users/${userId}/subscription`);
    await updateDoc(subscriptionRef, { plan: newPlan });
  }

  // 🔹 Update subscription dates
  async updateSubscriptionDates(userId: string, startDate: Date, endDate: Date): Promise<void> {
    const subscriptionRef = doc(this.firestore, `users/${userId}/subscription`);
    await updateDoc(subscriptionRef, {
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
    });
  }

  // 🔹 Delete the subscription
  async deleteSubscription(userId: string): Promise<void> {
    const subscriptionRef = doc(this.firestore, `users/${userId}/subscription`);
    await deleteDoc(subscriptionRef);
  }
}
