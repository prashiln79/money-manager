import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { Budget, BudgetsService } from 'src/app/util/service/budgets.service';

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
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadBudgets();
  }

  // Load budgets for the logged-in user
  async loadBudgets() {
    const user = this.auth.currentUser;
    if (user) {
      this.userId = user.uid;
      this.budgetsService.getBudgets(this.userId).subscribe(budgets => {
        this.budgets = budgets;
      });
    }
  }

  // Create a new budget
  async createBudget() {
    const user = this.auth.currentUser;
    if (user) {
      this.newBudget.userId = user.uid;
      this.newBudget.budgetId = `${this.newBudget.userId}-${new Date().getTime()}`;
      await this.budgetsService.createBudget(user.uid, this.newBudget);
      this.loadBudgets();  // Reload budgets after adding
    }
  }

  // Delete a budget
  async deleteBudget(budgetId: string) {
    const user = this.auth.currentUser;
    if (user) {
      await this.budgetsService.deleteBudget(user.uid, budgetId);
      this.loadBudgets();  // Reload budgets after deletion
    }
  }

  // Update the spent amount for a budget
  async updateSpent(budgetId: string, amount: number) {
    const user = this.auth.currentUser;
    if (user) {
      await this.budgetsService.updateSpent(user.uid, budgetId, amount);
      this.loadBudgets();  // Reload budgets after updating spent
    }
  }
}
