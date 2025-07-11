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
      icon: '💰',
      title: 'Smart Budgeting',
      description: 'Create and track budgets with intelligent insights and spending alerts.'
    },
    {
      icon: '📊',
      title: 'Detailed Reports',
      description: 'Visualize your financial data with comprehensive charts and analytics.'
    },
    {
      icon: '🎯',
      title: 'Goal Setting',
      description: 'Set financial goals and track your progress towards achieving them.'
    },
    {
      icon: '📱',
      title: 'Mobile First',
      description: 'Access your finances anywhere with our responsive PWA design.'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your financial data is encrypted and stored securely in the cloud.'
    },
    {
      icon: '⚡',
      title: 'Offline Ready',
      description: 'Continue managing your money even without internet connection.'
    }
  ];

  testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Freelance Designer',
      content: 'This app has completely transformed how I manage my finances. The budgeting features are incredible!',
      avatar: '👩‍🎨'
    },
    {
      name: 'Mike Chen',
      role: 'Software Engineer',
      content: 'Finally, a money manager that works offline and syncs perfectly across all my devices.',
      avatar: '👨‍💻'
    },
    {
      name: 'Emma Davis',
      role: 'Small Business Owner',
      content: 'The goal tracking feature helped me save for my dream vacation. Highly recommended!',
      avatar: '👩‍💼'
    }
  ];

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
} 