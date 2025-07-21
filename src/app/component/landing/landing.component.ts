import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/util/service/notification.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  features = [
    {
      icon: '📊',
      title: 'Smart Budgeting',
      description: 'AI-powered budget recommendations and spending alerts to keep you on track.'
    },
    {
      icon: '📈',
      title: 'Real-Time Insights',
      description: 'Get instant financial insights and trends with beautiful charts and analytics.'
    },
    {
      icon: '🏦',
      title: 'Bank Syncing',
      description: 'Securely connect all your bank accounts for automatic transaction tracking.'
    },
    {
      icon: '🎯',
      title: 'Goal Tracking',
      description: 'Set savings goals and track your progress with visual milestones.'
    },
    {
      icon: '🔒',
      title: 'Bank-Level Security',
      description: '256-bit encryption and biometric authentication to protect your data.'
    }
  ];

  howItWorks = [
    {
      step: '1',
      title: 'Download & Sign Up',
      description: 'Get the app from App Store or Play Store and create your account in seconds.',
      icon: '📱'
    },
    {
      step: '2',
      title: 'Connect Your Banks',
      description: 'Securely link your bank accounts for automatic transaction syncing.',
      icon: '🏦'
    },
    {
      step: '3',
      title: 'Set Your Goals',
      description: 'Define your financial goals and create personalized budgets.',
      icon: '🎯'
    },
    {
      step: '4',
      title: 'Track & Grow',
      description: 'Monitor your progress and watch your savings grow with smart insights.',
      icon: '📈'
    }
  ];

  testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Freelance Designer',
      content: 'Money Manager helped me save $5,000 in just 6 months! The goal tracking feature is incredible.',
      avatar: '👩‍🎨',
      rating: 5,
      location: 'San Francisco, CA'
    },
    {
      name: 'Mike Chen',
      role: 'Software Engineer',
      content: 'Finally, a finance app that actually works offline and syncs perfectly across all my devices.',
      avatar: '👨‍💻',
      rating: 5,
      location: 'Seattle, WA'
    },
    {
      name: 'Emma Davis',
      role: 'Small Business Owner',
      content: 'The real-time insights helped me identify spending patterns I never noticed before. Game changer!',
      avatar: '👩‍💼',
      rating: 5,
      location: 'Austin, TX'
    }
  ];

  screenshots = [
    {
      title: 'Dashboard Overview',
      description: 'Get a complete view of your finances at a glance',
      image: 'assets/images/screenshot/dashboard.png'
    },
    {
      title: 'Smart Analytics',
      description: 'Beautiful charts and insights to understand your spending',
      image: 'assets/images/screenshot/analytics.png'
    },
    {
      title: 'Goal Tracking',
      description: 'Set and track your financial goals with visual progress',
      image: 'assets/images/screenshot/goals.png'
    }
  ];

  currentScreenshotIndex = 0;

  constructor(
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {}

  navigateToSignUp(): void {
    this.router.navigate(['/sign-in']);
  }

  navigateToSignIn(): void {
    this.router.navigate(['/sign-in']);
  }

  scrollToFeatures(): void {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  nextScreenshot(): void {
    this.currentScreenshotIndex = (this.currentScreenshotIndex + 1) % this.screenshots.length;
  }

  prevScreenshot(): void {
    this.currentScreenshotIndex = this.currentScreenshotIndex === 0 
      ? this.screenshots.length - 1 
      : this.currentScreenshotIndex - 1;
  }

  setScreenshotIndex(index: number): void {
    this.currentScreenshotIndex = index;
  }

  downloadAppStore(): void {
    // Add App Store link when available
    this.notificationService.info('App Store link coming soon!');
  }

  downloadPlayStore(): void {
    // Add Play Store link when available
    this.notificationService.info('Play Store link coming soon!');
  }
} 