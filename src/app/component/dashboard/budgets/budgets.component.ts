import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { Budget, BudgetsService } from 'src/app/util/service/budgets.service';
import { NotificationService } from 'src/app/util/service/notification.service';

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.component.html',
  styleUrls: ['./budgets.component.scss']
})
export class BudgetsComponent implements OnInit {
  userId: string = '';
  budgets: Budget[] = [];
  newBudget: Budget = {
    budgetId: '',
    userId: '',
    category: 'Groceries',
    limit: 0,
    spent: 0,
    startDate: Timestamp.fromDate(new Date()),
    endDate: Timestamp.fromDate(new Date()),
  };

  constructor(
    private budgetsService: BudgetsService,
    private auth: Auth,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadBudgets();
  }

  // Load budgets for the logged-in user
  async loadBudgets() {
    const user = this.auth.currentUser;
    if (user) {
      this.userId = user.uid;
      this.budgetsService.getBudgets(this.userId).subscribe({
        next: (budgets) => {
          this.budgets = budgets;
        },
        error: (error) => {
          console.error('Error loading budgets:', error);
          this.notificationService.error('Failed to load budgets');
        }
      });
    }
  }

  // Create a new budget
  async createBudget() {
    if (!this.newBudget.category || !this.newBudget.limit) {
      this.notificationService.warning('Please fill in all required fields');
      return;
    }

    if (this.newBudget.limit <= 0) {
      this.notificationService.warning('Budget limit must be greater than 0');
      return;
    }

    const user = this.auth.currentUser;
    if (user) {
      try {
        this.newBudget.userId = user.uid;
        this.newBudget.budgetId = `${this.newBudget.userId}-${new Date().getTime()}`;
        await this.budgetsService.createBudget(user.uid, this.newBudget);
        this.notificationService.success('Budget created successfully');
        this.loadBudgets();  // Reload budgets after adding
        // Reset form
        this.newBudget = {
          budgetId: '',
          userId: '',
          category: 'Groceries',
          limit: 0,
          spent: 0,
          startDate: Timestamp.fromDate(new Date()),
          endDate: Timestamp.fromDate(new Date()),
        };
      } catch (error) {
        console.error('Error creating budget:', error);
        this.notificationService.error('Failed to create budget');
      }
    }
  }

  // Delete a budget
  async deleteBudget(budgetId: string) {
    const user = this.auth.currentUser;
    if (user) {
      try {
        await this.budgetsService.deleteBudget(user.uid, budgetId);
        this.notificationService.success('Budget deleted successfully');
        this.loadBudgets();  // Reload budgets after deletion
      } catch (error) {
        console.error('Error deleting budget:', error);
        this.notificationService.error('Failed to delete budget');
      }
    }
  }

  // Update the spent amount for a budget
  async updateSpent(budgetId: string, amount: number) {
    if (amount < 0) {
      this.notificationService.warning('Spent amount cannot be negative');
      return;
    }

    const user = this.auth.currentUser;
    if (user) {
      try {
        await this.budgetsService.updateSpent(user.uid, budgetId, amount);
        this.notificationService.success('Budget spent amount updated successfully');
        this.loadBudgets();  // Reload budgets after updating spent
      } catch (error) {
        console.error('Error updating budget spent:', error);
        this.notificationService.error('Failed to update budget spent amount');
      }
    }
  }
}
