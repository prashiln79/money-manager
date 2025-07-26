import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Category, Budget } from 'src/app/util/models';
import { Transaction } from 'src/app/util/models/transaction.model';
import { DateService } from 'src/app/util/service/date.service';
import { TransactionType } from 'src/app/util/config/enums';
import { CategoryDetailsDialogComponent, CategoryDetailsDialogData } from '../category-details-dialog/category-details-dialog.component';

@Component({
  selector: 'app-category-card',
  templateUrl: './category-card.component.html',
  styleUrls: ['./category-card.component.scss']
})
export class CategoryCardComponent {
  @Input() category!: Category;
  @Input() isExpanded: boolean = false;
  @Input() isMobile: boolean = false;
  @Input() home: boolean = false;
  @Input() recentTransactions: Transaction[] = [];
  @Input() categoryStats: any;
  @Input() subCategoryCount: number = 0;
  @Input() Math: any;
  @Input() allTransactions: Transaction[] = [];
  @Input() subCategories: Category[] = [];

  @Output() editCategory = new EventEmitter<Category>();
  @Output() deleteCategory = new EventEmitter<Category>();
  @Output() openBudgetDialog = new EventEmitter<Category>();
  @Output() selectParentCategory = new EventEmitter<Category>();
  @Output() removeFromParentCategory = new EventEmitter<Category>();
  @Output() toggleExpansion = new EventEmitter<Category>();

  constructor(
    public dateService: DateService,
    private dialog: MatDialog
  ) {}

  /**
   * Calculate budget spent for a category based on transactions
   */
  public calculateBudgetSpent(category: Category): number {
    if (!category.budget?.hasBudget || !category.budget?.budgetAmount) {
      return 0;
    }

    const categoryTransactions = this.allTransactions.filter(t => 
      t.categoryId === category.id && 
      t.type === TransactionType.EXPENSE
    );

    // Filter transactions within the budget period
    const budgetStartDate = category.budget.budgetStartDate;
    const budgetEndDate = category.budget.budgetEndDate;
    
    let filteredTransactions = categoryTransactions;
    
    if (budgetStartDate) {
      const startDate = this.dateService.toDate(budgetStartDate);
      if (!startDate) {
        return 0;
      }
      filteredTransactions = filteredTransactions.filter(t => {
        const txDate = this.dateService.toDate(t.date);
        return txDate && txDate >= startDate;
      });
    }
    
    if (budgetEndDate) {
      const endDate = this.dateService.toDate(budgetEndDate);
      if (!endDate) {
        return 0;
      }
      filteredTransactions = filteredTransactions.filter(t => {
        const txDate = this.dateService.toDate(t.date);
        return txDate && txDate <= endDate;
      });
    }

    return filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  /**
   * Calculate budget remaining for a category
   */
  public calculateBudgetRemaining(category: Category): number {
    if (!category.budget?.hasBudget || !category.budget?.budgetAmount) {
      return 0;
    }
    
    const spent = this.calculateBudgetSpent(category);
    return Math.max(0, (category.budget.budgetAmount || 0) - spent);
  }

  /**
   * Calculate budget progress percentage for a category
   */
  public calculateBudgetProgressPercentage(category: Category): number {
    if (!category.budget?.hasBudget || !category.budget?.budgetAmount) {
      return 0;
    }
    
    const spent = this.calculateBudgetSpent(category);
    const budgetAmount = category.budget.budgetAmount || 0;
    
    if (budgetAmount === 0) return 0;
    
    return Math.min(100, (spent / budgetAmount) * 100);
  }

  public calculateTotalSpentPerMonth(category: Category): number {
    if (!this.recentTransactions || this.recentTransactions.length === 0) {
      return 0;
    }

    return this.recentTransactions
      .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
  }

  public calculateTotalIncomePerMonth(category: Category): number {
    if (!this.recentTransactions || this.recentTransactions.length === 0) {
      return 0;
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return this.recentTransactions
      .filter(transaction => {
        const transactionDate = this.dateService.toDate(transaction.date);
        if (!transactionDate) return false;
        return transaction.categoryId === category.id &&
          transaction.amount > 0 &&
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear;
      })
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  public getBudgetProgressColor(category: Category): string {
    const progress = this.calculateBudgetProgressPercentage(category);
    if (progress >= 100) return '#ef4444'; // Red
    if (progress >= 80) return '#f59e0b'; // Orange
    if (progress >= 60) return '#3b82f6'; // Blue
    return '#10b981'; // Green
  }

  public formatBudgetPeriod(period: string | undefined): string {
    if (!period) return '';
    return period.charAt(0).toUpperCase() + period.slice(1);
  }

  public getBudgetStatusClass(category: Category): string {
    const progress = this.calculateBudgetProgressPercentage(category);
    if (progress >= 100) return 'danger';
    if (progress >= 80) return 'warning';
    return 'safe';
  }

  public getRemainingBudgetClass(category: Category): string {
    const remaining = this.calculateBudgetRemaining(category);
    return remaining < 0 ? 'danger' : 'safe';
  }

  public onEditCategory(): void {
    this.editCategory.emit(this.category);
  }

  public onDeleteCategory(): void {
    this.deleteCategory.emit(this.category);
  }

  public onOpenBudgetDialog(): void {
    this.openBudgetDialog.emit(this.category);
  }

  public onSelectParentCategory(): void {
    this.selectParentCategory.emit(this.category);
  }

  public onRemoveFromParentCategory(): void {
    this.removeFromParentCategory.emit(this.category);
  }

  public onToggleExpansion(): void {
    this.toggleExpansion.emit(this.category);
  }

  public onOpenDetailsDialog(): void {
    const dialogData: CategoryDetailsDialogData = {
      category: this.category,
      subCategories: this.subCategories,
      recentTransactions: this.recentTransactions,
      categoryStats: this.categoryStats,
      allTransactions: this.allTransactions
    };

    this.dialog.open(CategoryDetailsDialogComponent, {
      data: dialogData,
      width: '90vw',
      maxWidth: '700px',
      height: '85vh',
      maxHeight: '85vh',
      disableClose: false,
      autoFocus: false,
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      panelClass: 'category-details-dialog-panel'
    });
  }
} 