import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Category, Budget } from 'src/app/util/models';
import { Transaction } from 'src/app/util/models/transaction.model';
import { DateService } from 'src/app/util/service/date.service';

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

  @Output() editCategory = new EventEmitter<Category>();
  @Output() deleteCategory = new EventEmitter<Category>();
  @Output() openBudgetDialog = new EventEmitter<Category>();
  @Output() selectParentCategory = new EventEmitter<Category>();
  @Output() removeFromParentCategory = new EventEmitter<Category>();
  @Output() toggleExpansion = new EventEmitter<Category>();

  constructor(public dateService: DateService) {}

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
    const progress = category.budget?.budgetProgressPercentage || 0;
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
    const progress = category.budget?.budgetProgressPercentage || 0;
    if (progress >= 100) return 'danger';
    if (progress >= 80) return 'warning';
    return 'safe';
  }

  public getRemainingBudgetClass(category: Category): string {
    const remaining = (category.budget?.budgetAmount || 0) - (category.budget?.budgetSpent || 0);
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
} 