import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { Goal, GoalsService } from 'src/app/util/service/goals.service';
import { NotificationService } from 'src/app/util/service/notification.service';

@Component({
  selector: 'app-goals',
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.scss']
})
export class GoalsComponent implements OnInit {
  userId: string = '';
  goals: Goal[] = [];
  newGoal: Goal = {
    goalId: '',
    userId: '',
    title: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: Timestamp.fromDate(new Date()),
  };

  constructor(
    private goalsService: GoalsService,
    private auth: Auth,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadGoals();
  }

  // Load goals for the logged-in user
  async loadGoals() {
    const user = this.auth.currentUser;
    if (user) {
      this.userId = user.uid;
      this.goalsService.getGoals(this.userId).subscribe({
        next: (goals) => {
          this.goals = goals;
        },
        error: (error) => {
          console.error('Error loading goals:', error);
          this.notificationService.error('Failed to load goals');
        }
      });
    }
  }

  // Create a new goal
  async createGoal() {
    if (!this.newGoal.title || !this.newGoal.targetAmount) {
      this.notificationService.warning('Please fill in all required fields');
      return;
    }

    const user = this.auth.currentUser;
    if (user) {
      try {
        this.newGoal.userId = user.uid;
        this.newGoal.goalId = `${this.newGoal.userId}-${new Date().getTime()}`;
        await this.goalsService.createGoal(user.uid, this.newGoal);
        this.notificationService.success('Goal created successfully');
        this.loadGoals();  // Reload goals after adding
        // Reset form
        this.newGoal = {
          goalId: '',
          userId: '',
          title: '',
          targetAmount: 0,
          currentAmount: 0,
          deadline: Timestamp.fromDate(new Date()),
        };
      } catch (error) {
        console.error('Error creating goal:', error);
        this.notificationService.error('Failed to create goal');
      }
    }
  }

  // Delete a goal
  async deleteGoal(goalId: string) {
    const user = this.auth.currentUser;
    if (user) {
      try {
        await this.goalsService.deleteGoal(user.uid, goalId);
        this.notificationService.success('Goal deleted successfully');
        this.loadGoals();  // Reload goals after deletion
      } catch (error) {
        console.error('Error deleting goal:', error);
        this.notificationService.error('Failed to delete goal');
      }
    }
  }

  // Update the current amount for a goal
  async updateCurrentAmount(goalId: string, amount: number) {
    if (amount <= 0) {
      this.notificationService.warning('Please enter a valid amount');
      return;
    }

    const user = this.auth.currentUser;
    if (user) {
      try {
        await this.goalsService.updateCurrentAmount(user.uid, goalId, amount);
        this.notificationService.success('Goal progress updated successfully');
        this.loadGoals();  // Reload goals after updating current amount
      } catch (error) {
        console.error('Error updating goal amount:', error);
        this.notificationService.error('Failed to update goal progress');
      }
    }
  }
}
