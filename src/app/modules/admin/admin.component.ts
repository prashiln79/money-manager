import { Component, OnInit, OnDestroy } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/util/service/notification.service';
import { UserService } from 'src/app/util/service/user.service';
import { FeedbackService } from 'src/app/util/service/feedback.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, OnDestroy {
  isMobile: boolean = false;
  currentUser: any = null;
  isAdmin: boolean = false;
  activeSection: string = 'dashboard';
  private destroy$ = new Subject<void>();

  // Admin navigation sections
  adminSections = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      description: 'Overview and statistics'
    },
    {
      id: 'feedback',
      label: 'User Feedback',
      icon: 'feedback',
      description: 'View and manage user feedback'
    },
    {
      id: 'users',
      label: 'Users',
      icon: 'people',
      description: 'Manage user accounts'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'analytics',
      description: 'App usage statistics'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      description: 'Admin configuration'
    }
  ];

  // Dashboard statistics
  dashboardStats = {
    totalUsers: 0,
    totalFeedback: 0,
    pendingFeedback: 0,
    activeUsers: 0,
    totalTransactions: 0,
    totalCategories: 0
  };

  constructor(
    private breakpointObserver: BreakpointObserver,
    private auth: Auth,
    private router: Router,
    private userService: UserService,
    private feedbackService: FeedbackService,
    private notificationService: NotificationService
  ) {
    // Observe breakpoints for mobile detection
    this.breakpointObserver.observe([Breakpoints.Handset])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }

  ngOnInit(): void {
    this.initializeAdmin();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeAdmin(): Promise<void> {
    try {
      this.currentUser = await this.auth.currentUser;
      
      if (!this.currentUser) {
        this.notificationService.error('Authentication required');
        this.router.navigate(['/sign-in']);
        return;
      }

      // Check if user is admin
      this.isAdmin = await this.checkAdminStatus();
      
      if (!this.isAdmin) {
        this.notificationService.error('Admin access required');
        this.router.navigate(['/dashboard']);
        return;
      }

      // Load dashboard statistics
      await this.loadDashboardStats();
      
    } catch (error) {
      console.error('Error initializing admin:', error);
      this.notificationService.error('Failed to initialize admin panel');
    }
  }

  private async checkAdminStatus(): Promise<boolean> {
    return this.userService.isAdmin(this.auth.currentUser?.uid || '');
  }

  private async loadDashboardStats(): Promise<void> {
    try {
      // Load user statistics
      const userStats = await this.userService.getUserStatistics();
      
      // Load feedback statistics
      const allFeedback = await this.feedbackService.getAllFeedback();
      const pendingFeedback = allFeedback.filter(f => f.status === 'pending').length;
      
      this.dashboardStats = {
        totalUsers: userStats.totalUsers,
        totalFeedback: allFeedback.length,
        pendingFeedback: pendingFeedback,
        activeUsers: userStats.activeUsers,
        totalTransactions: userStats.totalTransactions,
        totalCategories: userStats.totalCategories
      };
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      this.notificationService.error('Failed to load dashboard statistics');
    }
  }

  public setActiveSection(sectionId: string): void {
    this.activeSection = sectionId;
  }

  public getActiveSection(): any {
    return this.adminSections.find(section => section.id === this.activeSection);
  }

  public logout(): void {
    this.auth.signOut().then(() => {
      this.notificationService.success('Logged out successfully');
      this.router.navigate(['/sign-in']);
    }).catch(error => {
      console.error('Logout error:', error);
      this.notificationService.error('Failed to logout');
    });
  }

  public goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
} 