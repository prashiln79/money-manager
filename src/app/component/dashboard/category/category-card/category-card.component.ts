import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Category, Budget } from 'src/app/util/models';
import { Transaction } from 'src/app/util/models/transaction.model';
import { DateService } from 'src/app/util/service/date.service';
import { TransactionType } from 'src/app/util/config/enums';
import { CategoryDetailsDialogComponent, CategoryDetailsDialogData } from '../category-details-dialog/category-details-dialog.component';
import { CategoryBudgetDialogComponent } from '../category-budget-dialog/category-budget-dialog.component';
import { MobileCategoryAddEditPopupComponent } from '../mobile-category-add-edit-popup/mobile-category-add-edit-popup.component';
import { ConfirmDialogComponent } from 'src/app/util/components/confirm-dialog/confirm-dialog.component';
import { NotificationService } from 'src/app/util/service/notification.service';
import { HapticFeedbackService } from 'src/app/util/service/haptic-feedback.service';
import { CategoryService } from 'src/app/util/service/category.service';
import { CategoryBudgetService } from 'src/app/util/service/category-budget.service';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.state';
import * as CategoriesActions from 'src/app/store/categories/categories.actions';
import * as CategoriesSelectors from 'src/app/store/categories/categories.selectors';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-category-card',
  templateUrl: './category-card.component.html',
  styleUrls: ['./category-card.component.scss']
})
export class CategoryCardComponent {
  @Input() category!: Category;

  @Input() isMobile: boolean = false;
  @Input() home: boolean = false;
  @Input() recentTransactions: Transaction[] = [];
  @Input() categoryStats: any;
  @Input() subCategoryCount: number = 0;
  @Input() Math: any;
  @Input() allTransactions: Transaction[] = [];
  @Input() subCategories: Category[] = [];



  private userId: string = '';

  constructor(
    public dateService: DateService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private hapticFeedback: HapticFeedbackService,
    private categoryService: CategoryService,
    private budgetService: CategoryBudgetService,
    private store: Store<AppState>,
    private auth: Auth
  ) {
    this.initializeUserId();
  }

  private async initializeUserId(): Promise<void> {
    const currentUser = await this.auth.currentUser;
    if (currentUser) {
      this.userId = currentUser.uid;
    }
  }

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
    if (this.isMobile) {
      this.openMobileEditDialog();
    } else {
      this.openEditDialog();
    }
  }

  public onDeleteCategory(): void {
    this.openDeleteConfirmationDialog();
  }

  public onOpenBudgetDialog(): void {
    this.openBudgetDialog();
  }

  public onSelectParentCategory(): void {
    this.openParentCategorySelectorDialog();
  }

  public onRemoveFromParentCategory(): void {
    this.removeFromParentCategory();
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

  private openMobileEditDialog(): void {
    const dialogRef = this.dialog.open(MobileCategoryAddEditPopupComponent, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        category: this.category,
        isEdit: true
      },
      disableClose: false,
      autoFocus: false,
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      panelClass: 'mobile-category-dialog-panel'
    });

          dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.notificationService.success('Category updated successfully');
          this.hapticFeedback.successVibration();
        }
      });
  }

  private openEditDialog(): void {
    const dialogRef = this.dialog.open(MobileCategoryAddEditPopupComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        category: this.category,
        isEdit: true
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notificationService.success('Category updated successfully');
      }
    });
  }

  private openDeleteConfirmationDialog(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Category',
        message: `Are you sure you want to delete "${this.category.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performDelete();
      }
    });
  }

  private performDelete(): void {
    if (!this.category.id) {
      this.notificationService.error('Category ID not found');
      return;
    }

    this.store.dispatch(CategoriesActions.deleteCategory({
      userId: this.userId,
      categoryId: this.category.id
    }));

    this.notificationService.success('Category deleted successfully');
    this.hapticFeedback.successVibration();
  }

  private openBudgetDialog(): void {
    const dialogRef = this.dialog.open(CategoryBudgetDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        category: this.category,
        isEdit: this.category.budget?.hasBudget || false
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateCategoryBudget(result);
      }
    });
  }

  private updateCategoryBudget(budgetData: Budget): void {
    if (!this.category.id) {
      this.notificationService.error('Category ID not found');
      return;
    }

    this.store.dispatch(CategoriesActions.updateCategory({
      userId: this.userId,
      categoryId: this.category.id,
      name: this.category.name,
      categoryType: this.category.type,
      icon: this.category.icon,
      color: this.category.color,
      budgetData: budgetData
    }));

    this.notificationService.success(
      budgetData.hasBudget
        ? 'Budget set successfully for ' + this.category.name
        : 'Budget removed from ' + this.category.name
    );
  }

  private openParentCategorySelectorDialog(): void {
    this.categoryService.openParentCategorySelectorDialog(this.category).subscribe(result => {
      if (result) {
        this.convertToSubCategory(result);
      }
    });
  }

  private convertToSubCategory(parentCategory: Category): void {
    if (!this.category.id || !parentCategory.id) {
      this.notificationService.error('Category ID not found');
      return;
    }

    // Update the current category to be a sub-category
    this.store.dispatch(CategoriesActions.updateCategory({
      userId: this.userId,
      categoryId: this.category.id,
      name: this.category.name,
      categoryType: this.category.type,
      icon: this.category.icon,
      color: this.category.color,
      parentCategoryId: parentCategory.id,
      isSubCategory: true
    }));

    // Note: The parent category's subCategories array would need to be updated separately
    // This is handled by the backend or through a separate action

    this.notificationService.success(`${this.category.name} is now a sub-category of ${parentCategory.name}`);
  }

  private removeFromParentCategory(): void {
    if (!this.category.id) {
      this.notificationService.error('Category ID not found');
      return;
    }

    // Remove from parent category
    this.store.dispatch(CategoriesActions.updateCategory({
      userId: this.userId,
      categoryId: this.category.id,
      name: this.category.name,
      categoryType: this.category.type,
      icon: this.category.icon,
      color: this.category.color,
      parentCategoryId: null,
      isSubCategory: false
    }));

    // If there's a parent category, remove this category from its subCategories array
    if (this.category.parentCategoryId) {
      // Note: This would require fetching the parent category first to get its current subCategories
      // For now, we'll just update the current category
      this.notificationService.success(`${this.category.name} is no longer a sub-category`);
    }
  }
} 