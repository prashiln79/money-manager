import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { Subscription, SubscriptionService } from 'src/app/util/service/subscription.service';

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss']
})
export class SubscriptionComponent implements OnInit {
  userId: string = '';
  subscription: Subscription | undefined;
  newSubscription: Subscription = {
    userId: '',
    plan: 'free',
    startDate: Timestamp.fromDate(new Date()),
    endDate: Timestamp.fromDate(new Date()),
  };

  constructor(
    private subscriptionService: SubscriptionService,
    private auth: Auth,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadSubscription();
  }

  // Load subscription for the logged-in user
  async loadSubscription() {
    const user = this.auth.currentUser;
    if (user) {
      this.userId = user.uid;
      this.subscription = await this.subscriptionService.getSubscription(this.userId);
    }
  }

  // Create a new subscription
  async createSubscription() {
    const user = this.auth.currentUser;
    if (user) {
      this.newSubscription.userId = user.uid;
      await this.subscriptionService.createSubscription(user.uid, this.newSubscription);
      this.loadSubscription();  // Reload subscription after adding
    }
  }

  // Update subscription plan
  async updatePlan(newPlan: string) {
    const user = this.auth.currentUser;
    if (user) {
      await this.subscriptionService.updateSubscriptionPlan(user.uid, newPlan);
      this.loadSubscription();  // Reload subscription after updating
    }
  }

  // Update subscription dates
  async updateDates(startDate: Date, endDate: Date) {
    const user = this.auth.currentUser;
    if (user) {
      await this.subscriptionService.updateSubscriptionDates(user.uid, startDate, endDate);
      this.loadSubscription();  // Reload subscription after updating dates
    }
  }

  // Delete the subscription
  async deleteSubscription() {
    const user = this.auth.currentUser;
    if (user) {
      await this.subscriptionService.deleteSubscription(user.uid);
      this.subscription = undefined;  // Clear the local subscription data
    }
  }
}
