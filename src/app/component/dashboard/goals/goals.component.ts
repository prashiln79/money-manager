import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { Goal, GoalsService } from 'src/app/util/service/goals.service';

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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadGoals();
  }

  // Load goals for the logged-in user
  async loadGoals() {
    const user = this.auth.currentUser;
    if (user) {
      this.userId = user.uid;
      this.goalsService.getGoals(this.userId).subscribe(goals => {
        this.goals = goals;
      });
    }
  }

  // Create a new goal
  async createGoal() {
    const user = this.auth.currentUser;
    if (user) {
      this.newGoal.userId = user.uid;
      this.newGoal.goalId = `${this.newGoal.userId}-${new Date().getTime()}`;
      await this.goalsService.createGoal(user.uid, this.newGoal);
      this.loadGoals();  // Reload goals after adding
    }
  }

  // Delete a goal
  async deleteGoal(goalId: string) {
    const user = this.auth.currentUser;
    if (user) {
      await this.goalsService.deleteGoal(user.uid, goalId);
      this.loadGoals();  // Reload goals after deletion
    }
  }

  // Update the current amount for a goal
  async updateCurrentAmount(goalId: string, amount: number) {
    const user = this.auth.currentUser;
    if (user) {
      await this.goalsService.updateCurrentAmount(user.uid, goalId, amount);
      this.loadGoals();  // Reload goals after updating current amount
    }
  }
}
