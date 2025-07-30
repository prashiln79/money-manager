import { Component, OnInit, OnDestroy } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Timestamp } from '@angular/fire/firestore';
import { Budget } from 'src/app/util/service/budgets.service';
import { NotificationService } from 'src/app/util/service/notification.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app.state';
import * as BudgetsActions from '../../../store/budgets/budgets.actions';
import * as BudgetsSelectors from '../../../store/budgets/budgets.selectors';
import * as CategoriesActions from '../../../store/categories/categories.actions';
import * as CategoriesSelectors from '../../../store/categories/categories.selectors';
import { Observable, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DateService } from 'src/app/util/service/date.service';
import { Category } from 'src/app/util/models';

// Interfaces for yearly budget structure
interface SavingsGoal {
  name: string;
  targetAmount: number;
  monthlyContribution: number;
}

interface Debt {
  name: string;
  currentBalance: number;
  monthlyPayment: number;
  interestRate: number;
}

interface YearlyBudget {
  totalIncome: number;
  splitByMonth: boolean;
  savingsGoals: SavingsGoal[];
  debts: Debt[];
}

interface MonthlyBreakdown {
  income: number;
  expenses: number;
  savings: number;
  debt: number;
  balance: number;
}

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.component.html',
  styleUrls: ['./budgets.component.scss']
})
export class BudgetsComponent implements OnInit, OnDestroy {
  // Observables from store
  budgets$: Observable<Budget[]>;
  budgetsLoading$: Observable<boolean>;
  budgetsError$: Observable<any>;
  categories$: Observable<Category[]>;
  categoriesLoading$: Observable<boolean>;
  
  userId: string = '';
  budgets: Budget[] = [];
  categories: Category[] = [];
  newBudget: Budget = {
    budgetId: '',
    userId: '',
    category: 'Groceries',
    limit: 0,
    spent: 0,
    startDate: Timestamp.fromDate(new Date()),
    endDate: Timestamp.fromDate(new Date()),
  };
  
  // Category budget sliders
  categoryBudgets: { [categoryId: string]: number } = {};
  showCategorySliders: boolean = true;
  
  // Date models for form
  startDateModel: Date = new Date();
  endDateModel: Date = new Date();

  // Yearly budget properties
  currentStep: number = 1;
  totalSteps: number = 6;
  showMonthlyView: boolean = false;
  
  yearlyBudget: YearlyBudget = {
    totalIncome: 0,
    splitByMonth: false,
    savingsGoals: [],
    debts: []
  };

  // Math object for template access
  Math = Math;
  
  private destroy$ = new Subject<void>();
  private subscriptions = new Subscription();

  constructor(
    private auth: Auth,
    private router: Router,
    private notificationService: NotificationService,
    private store: Store<AppState>,
    public dateService: DateService
  ) {
    // Initialize selectors
    this.budgets$ = this.store.select(BudgetsSelectors.selectAllBudgets);
    this.budgetsLoading$ = this.store.select(BudgetsSelectors.selectBudgetsLoading);
    this.budgetsError$ = this.store.select(BudgetsSelectors.selectBudgetsError);
    this.categories$ = this.store.select(CategoriesSelectors.selectAllCategories);
    this.categoriesLoading$ = this.store.select(CategoriesSelectors.selectCategoriesLoading);
  }

  ngOnInit(): void {
    this.loadBudgets();
    this.loadCategories();
    this.subscribeToStoreData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Navigation methods
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Income methods
  calculateMonthlyIncome(): void {
    // This method can be used for additional calculations
  }

  // Update total income and ensure budget limits
  updateYearlyIncome(): void {
    this.ensureBudgetLimit();
  }

  // Savings methods
  addSavingsGoal(): void {
    this.yearlyBudget.savingsGoals.push({
      name: '',
      targetAmount: 0,
      monthlyContribution: 0
    });
  }

  removeSavingsGoal(index: number): void {
    this.yearlyBudget.savingsGoals.splice(index, 1);
  }

  getTotalSavings(): number {
    return this.yearlyBudget.savingsGoals.reduce((sum, goal) => sum + (goal.monthlyContribution * 12), 0);
  }

  // Debt methods
  addDebt(): void {
    this.yearlyBudget.debts.push({
      name: '',
      currentBalance: 0,
      monthlyPayment: 0,
      interestRate: 0
    });
  }

  removeDebt(index: number): void {
    this.yearlyBudget.debts.splice(index, 1);
  }

  getTotalDebtPayments(): number {
    return this.yearlyBudget.debts.reduce((sum, debt) => sum + (debt.monthlyPayment * 12), 0);
  }

  // Category budget methods
  getCategoryBudget(categoryId: string): number {
    return this.categoryBudgets[categoryId] || 0;
  }

  getCategoryPercentage(categoryId: string): number {
    if (this.yearlyBudget.totalIncome === 0) return 0;
    return (this.getCategoryBudget(categoryId) / this.yearlyBudget.totalIncome) * 100;
  }

  getCategoryMonthly(categoryId: string): number {
    return this.getCategoryBudget(categoryId) / 12;
  }

  getTotalAllocated(): number {
    return Object.values(this.categoryBudgets).reduce((sum, budget) => sum + budget, 0);
  }

  // Ensure total allocated never exceeds yearly budget
  ensureBudgetLimit(): void {
    const totalAllocated = this.getTotalAllocated();
    if (totalAllocated > this.yearlyBudget.totalIncome) {
      const excess = totalAllocated - this.yearlyBudget.totalIncome;
      this.adjustAllCategories(excess);
    }
  }

  // Adjust all categories proportionally when total exceeds budget
  private adjustAllCategories(excessAmount: number) {
    const totalAllocated = this.getTotalAllocated();
    if (totalAllocated === 0) return;
    
    Object.keys(this.categoryBudgets).forEach(categoryId => {
      const currentBudget = this.categoryBudgets[categoryId] || 0;
      const reductionRatio = currentBudget / totalAllocated;
      const reduction = excessAmount * reductionRatio;
      
      this.categoryBudgets[categoryId] = Math.max(0, currentBudget - reduction);
    });
  }

  getRemainingBudget(): number {
    return this.yearlyBudget.totalIncome - this.getTotalAllocated() - this.getTotalSavings() - this.getTotalDebtPayments();
  }

  getNetBalance(): number {
    return this.yearlyBudget.totalIncome - this.getTotalAllocated() - this.getTotalSavings() - this.getTotalDebtPayments();
  }

  // Monthly breakdown methods
  getMonthlyBreakdown(): MonthlyBreakdown[] {
    const monthlyIncome = this.yearlyBudget.totalIncome / 12;
    const monthlyExpenses = this.getTotalAllocated() / 12;
    const monthlySavings = this.getTotalSavings() / 12;
    const monthlyDebt = this.getTotalDebtPayments() / 12;
    const monthlyBalance = monthlyIncome - monthlyExpenses - monthlySavings - monthlyDebt;

    return Array(12).fill(null).map(() => ({
      income: monthlyIncome,
      expenses: monthlyExpenses,
      savings: monthlySavings,
      debt: monthlyDebt,
      balance: monthlyBalance
    }));
  }

  getMonthName(index: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[index];
  }

  // Save yearly budget
  saveYearlyBudget(): void {
    // Create budgets for each category
    this.categories.forEach(category => {
      const budget = this.getCategoryBudget(category.id || '');
      if (budget > 0) {
        this.createBudgetForCategory(category.name, budget);
      }
    });

    // Save savings goals and debts (if any)
    // TODO: Implement savings and debt saving logic when those services are available

    this.notificationService.success('Yearly budget saved successfully!');
    this.currentStep = 1; // Reset to first step
  }

  // Load budgets for the logged-in user
  loadBudgets() {
    const user = this.auth.currentUser;
    if (user) {
      this.userId = user.uid;
      this.store.dispatch(BudgetsActions.loadBudgets({ userId: this.userId }));
    }
  }

  // Load categories for the logged-in user
  loadCategories() {
    const user = this.auth.currentUser;
    if (user) {
      this.store.dispatch(CategoriesActions.loadCategories({ userId: user.uid }));
    }
  }

  // Subscribe to store data for backward compatibility
  subscribeToStoreData() {
    this.subscriptions.add(
      this.budgets$.subscribe(budgets => {
        this.budgets = budgets;
        this.updateCategoryBudgets();
      })
    );

    this.subscriptions.add(
      this.categories$.subscribe(categories => {
        this.categories = categories;
        this.initializeCategoryBudgets();
      })
    );

    this.subscriptions.add(
      this.budgetsError$.subscribe(error => {
        if (error) {
          console.error('Error loading budgets:', error);
          this.notificationService.error('Failed to load budgets');
        }
      })
    );
  }

  // Initialize category budgets from existing budgets
  initializeCategoryBudgets() {
    this.categories.forEach(category => {
      const existingBudget = this.budgets.find(budget => budget.category === category.name);
      this.categoryBudgets[category.id || ''] = existingBudget?.limit || 0;
    });
  }

  // Update category budgets when budgets change
  updateCategoryBudgets() {
    this.categories.forEach(category => {
      const existingBudget = this.budgets.find(budget => budget.category === category.name);
      if (existingBudget) {
        this.categoryBudgets[category.id || ''] = existingBudget.limit;
      }
    });
  }

  // Handle slider change for category budget with smart allocation
  onCategoryBudgetChange(categoryId: string, newLimit: number) {
    const currentTotal = this.getTotalAllocated();
    const currentCategoryBudget = this.categoryBudgets[categoryId] || 0;
    const difference = newLimit - currentCategoryBudget;
    
    // If the new total would exceed yearly budget, adjust other categories
    if (currentTotal + difference > this.yearlyBudget.totalIncome) {
      const excess = currentTotal + difference - this.yearlyBudget.totalIncome;
      
      // Set the current category to the new limit
      this.categoryBudgets[categoryId] = newLimit;
      
      // Distribute the excess reduction across other categories proportionally
      this.adjustOtherCategories(categoryId, excess);
    } else {
      // Simple case: just update the category budget
      this.categoryBudgets[categoryId] = newLimit;
    }
  }

  // Adjust other categories when total exceeds budget
  private adjustOtherCategories(excludedCategoryId: string, excessAmount: number) {
    const otherCategories = Object.keys(this.categoryBudgets).filter(id => id !== excludedCategoryId);
    const otherCategoriesTotal = otherCategories.reduce((sum, id) => sum + (this.categoryBudgets[id] || 0), 0);
    
    if (otherCategoriesTotal === 0) {
      // If no other categories have budgets, reduce the current category
      this.categoryBudgets[excludedCategoryId] = Math.max(0, this.categoryBudgets[excludedCategoryId] - excessAmount);
      return;
    }
    
    // Reduce other categories proportionally
    otherCategories.forEach(categoryId => {
      const currentBudget = this.categoryBudgets[categoryId] || 0;
      const reductionRatio = currentBudget / otherCategoriesTotal;
      const reduction = excessAmount * reductionRatio;
      
      this.categoryBudgets[categoryId] = Math.max(0, currentBudget - reduction);
    });
  }



  // Save category budget changes
  saveCategoryBudget(categoryId: string) {
    const category = this.categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const newLimit = this.categoryBudgets[categoryId];
    const existingBudget = this.budgets.find(budget => budget.category === category.name);

    if (existingBudget) {
      // Update existing budget
      this.updateBudgetLimit(existingBudget.budgetId, newLimit);
    } else {
      // Create new budget for this category
      this.createBudgetForCategory(category.name, newLimit);
    }
  }

  // Create budget for a specific category
  createBudgetForCategory(categoryName: string, limit: number) {
    const user = this.auth.currentUser;
    if (user && limit > 0) {
      const newBudget: Budget = {
        budgetId: `${user.uid}-${categoryName}-${new Date().getTime()}`,
        userId: user.uid,
        category: categoryName,
        limit: limit,
        spent: 0,
        startDate: Timestamp.fromDate(new Date()),
        endDate: Timestamp.fromDate(new Date(new Date().getFullYear(), 11, 31)), // End of year
      };
      
      this.store.dispatch(BudgetsActions.createBudget({ 
        userId: user.uid, 
        budget: newBudget 
      }));
      
      this.notificationService.success(`Budget created for ${categoryName}`);
    }
  }

  // Update budget limit
  updateBudgetLimit(budgetId: string, newLimit: number) {
    const user = this.auth.currentUser;
    if (user) {
      const budget = this.budgets.find(b => b.budgetId === budgetId);
      if (budget) {
        const updatedBudget = { ...budget, limit: newLimit };
        this.store.dispatch(BudgetsActions.updateBudget({ 
          userId: user.uid, 
          budgetId, 
          budget: updatedBudget 
        }));
        this.notificationService.success(`Budget limit updated for ${budget.category}`);
      }
    }
  }

  // Get budget for a category
  getBudgetForCategory(categoryName: string): Budget | undefined {
    return this.budgets.find(budget => budget.category === categoryName);
  }

  // Get spent amount for a category
  getSpentForCategory(categoryName: string): number {
    const budget = this.getBudgetForCategory(categoryName);
    return budget?.spent || 0;
  }

  // Calculate progress percentage for a category
  getProgressPercentage(categoryName: string): number {
    const budget = this.getBudgetForCategory(categoryName);
    if (!budget || budget.limit === 0) return 0;
    return Math.min((budget.spent / budget.limit) * 100, 100);
  }

  // Get progress color based on percentage
  getProgressColor(percentage: number): string {
    if (percentage >= 90) return 'warn'; // Red
    if (percentage >= 75) return 'accent'; // Orange
    return 'primary'; // Green
  }

  // Create a new budget
  createBudget() {
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
      this.newBudget.userId = user.uid;
      this.newBudget.budgetId = `${this.newBudget.userId}-${new Date().getTime()}`;
      this.newBudget.startDate = Timestamp.fromDate(this.startDateModel);
      this.newBudget.endDate = Timestamp.fromDate(this.endDateModel);
      
      this.store.dispatch(BudgetsActions.createBudget({ 
        userId: user.uid, 
        budget: this.newBudget 
      }));
      
      this.notificationService.success('Budget created successfully');
      
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
      this.startDateModel = new Date();
      this.endDateModel = new Date();
    }
  }

  // Delete a budget
  deleteBudget(budgetId: string) {
    const user = this.auth.currentUser;
    if (user) {
      this.store.dispatch(BudgetsActions.deleteBudget({ userId: user.uid, budgetId }));
      this.notificationService.success('Budget deleted successfully');
    }
  }

  // Update the spent amount for a budget
  updateSpent(budgetId: string, amount: number) {
    if (amount < 0) {
      this.notificationService.warning('Spent amount cannot be negative');
      return;
    }

    const user = this.auth.currentUser;
    if (user) {
      this.store.dispatch(BudgetsActions.updateSpent({ userId: user.uid, budgetId, amount }));
      this.notificationService.success('Budget spent amount updated successfully');
    }
  }

  // Toggle category sliders view
  toggleCategorySliders() {
    this.showCategorySliders = !this.showCategorySliders;
  }

  // TrackBy functions for ngFor optimization
  trackByCategoryId(index: number, category: Category): string {
    return category.id || '';
  }

  trackByBudgetId(index: number, budget: Budget): string {
    return budget.budgetId;
  }
}
