import { NgModule } from '@angular/core';
import { AdminSidebarService } from './admin-sidebar.service';

@NgModule({
  providers: [
    AdminSidebarService
    // Other admin-specific services can be added here
    // Example: AdminNotificationService, AdminAnalyticsService, etc.
  ]
})
export class AdminServicesModule { } 