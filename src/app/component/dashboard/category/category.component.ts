import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, Observable, of } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { ConfirmDialogComponent } from 'src/app/util/components/confirm-dialog/confirm-dialog.component';
import { NotificationService } from 'src/app/util/service/notification.service';
import { HapticFeedbackService } from 'src/app/util/service/haptic-feedback.service';
import { MobileCategoryAddEditPopupComponent } from './mobile-category-add-edit-popup/mobile-category-add-edit-popup.component';
import { IconSelectorDialogComponent } from './icon-selector-dialog/icon-selector-dialog.component';
import { ColorSelectorDialogComponent } from './color-selector-dialog/color-selector-dialog.component';
import { CategoryBudgetDialogComponent } from './category-budget-dialog/category-budget-dialog.component';
import { Category, AVAILABLE_ICONS, AVAILABLE_COLORS, defaultCategoriesForNewUser, Budget } from 'src/app/util/models';
import { CategoryBudgetService } from 'src/app/util/service/category-budget.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app.state';
import * as CategoriesActions from '../../../store/categories/categories.actions';
import * as CategoriesSelectors from '../../../store/categories/categories.selectors';
import { TransactionType } from 'src/app/util/config/enums';

@Component({
  selector: 'transaction-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit, OnDestroy {

  @Input() home: boolean = false;
  public categories$: Observable<Category[]>;
  public isLoading$: Observable<boolean>;
  public error$: Observable<any>;
  public Math = Math; // Make Math available in template

  public categories: Category[] = [];
  public isLoading: boolean = false;
  public errorMessage: string = '';
  public isMobile: boolean = false;
  public expandedCategory: Category | null = null;

  public newCategory: Category = this.getEmptyCategory();
  public availableIcons: string[] = AVAILABLE_ICONS;
  public availableColors: string[] = AVAILABLE_COLORS;

  public categorySuggestions: string[] = [];
  public filteredSuggestions: Observable<string[]> = of([]);
  public categoryNameInput: string = '';

  public userId: string = '';
  private destroy$ = new Subject<void>();
  private isSubmitting: boolean = false;

  constructor(
    private auth: Auth,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private hapticFeedback: HapticFeedbackService,
    private breakpointObserver: BreakpointObserver,
    private store: Store<AppState>,
    private budgetService: CategoryBudgetService
  ) {
    this.categories$ = this.store.select(CategoriesSelectors.selectAllCategories);
    this.isLoading$ = this.store.select(CategoriesSelectors.selectCategoriesLoading);
    this.error$ = this.store.select(CategoriesSelectors.selectCategoriesError);

    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.subscribeToStoreData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeComponent(): Promise<void> {
    const currentUser = await this.auth.currentUser;
    if (!currentUser) {
      this.errorMessage = 'User not authenticated';
      return;
    }

    this.userId = currentUser.uid;
    this.loadUserCategories();
  }

  private loadUserCategories(): void {
    this.store.dispatch(CategoriesActions.loadCategories({ userId: this.userId }));
  }

  private subscribeToStoreData(): void {
    this.categories$.pipe(takeUntil(this.destroy$)).subscribe(categories => {
      this.categories = categories.sort((a, b) => a.name.localeCompare(b.name));
      this.initializeCategorySuggestions();
    });

    this.isLoading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.isLoading = loading;
    });

    this.error$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      if (error) {
        this.errorMessage = 'Failed to load categories';
        console.error('Error loading categories:', error);
        this.notificationService.error('Failed to load categories');
      }
    });
  }

  private initializeCategorySuggestions(): void {
    const existingCategoryNames = this.categories.map(cat => cat.name);
    const defaultCategoryNames = defaultCategoriesForNewUser.map(cat => cat.name);
    this.categorySuggestions = [...new Set([...existingCategoryNames, ...defaultCategoryNames])];
    this.filteredSuggestions = of([]);
  }

  public filterSuggestions(value: string): void {
    const filterValue = value.toLowerCase();
    this.filteredSuggestions = of(
      this.categorySuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(filterValue)
      )
    );
  }

  public selectSuggestion(suggestion: string): void {
    this.newCategory.name = suggestion;
    this.categoryNameInput = suggestion;
  }

  public onCategoryNameInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.filterSuggestions(target.value);
    }
  }

  public createCategory(): void {
    if (!this.isValidCategoryData()) {
      this.notificationService.warning('Please enter a category name');
      return;
    }

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    this.store.dispatch(CategoriesActions.createCategory({
      userId: this.userId,
      name: this.newCategory.name.trim(),
      categoryType: this.newCategory.type,
      icon: this.newCategory.icon,
      color: this.newCategory.color
    }));

    this.notificationService.success('Category created successfully');
    this.resetForm();
    this.isSubmitting = false;
  }

  public editCategory(category: Category): void {
    if (this.isMobile) {
      this.hapticFeedback.lightVibration();
    } 
    this.openMobileDialog(category);
   
  }

  public updateCategory(): void {
    if (!this.isValidCategoryData()) {
      this.notificationService.warning('Please enter a category name');
      return;
    }

    if (!this.newCategory.id) {
      this.notificationService.error('Invalid category');
      return;
    }

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    this.store.dispatch(CategoriesActions.updateCategory({
      userId: this.userId,
      categoryId: this.newCategory.id,
      name: this.newCategory.name.trim(),
      categoryType: this.newCategory.type,
      icon: this.newCategory.icon,
      color: this.newCategory.color
    }));

    this.notificationService.success('Category updated successfully');
    this.resetForm();
    this.isSubmitting = false;
  }

  public deleteCategory(category: Category): void {
    if (this.isMobile) {
      this.hapticFeedback.warningVibration();
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: this.isMobile ? '90vw' : '600px',
      maxWidth: this.isMobile ? '400px' : '90vw',
      data: {
        title: 'Delete Category',
        message: `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'delete'
      }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result && category.id) {
        this.performDelete(category.id);
      }
    });
  }

  private performDelete(categoryId: string): void {
    this.store.dispatch(CategoriesActions.deleteCategory({ userId: this.userId, categoryId }));
    this.notificationService.success('Category deleted successfully');
  }

  public cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.newCategory = this.getEmptyCategory();
    this.categoryNameInput = '';
    this.isSubmitting = false;
  }

  private isValidCategoryData(): boolean {
    return this.newCategory.name.trim().length > 0 &&
      this.newCategory.name.trim().length <= 50;
  }

  public trackByCategoryId(index: number, category: Category): string | number {
    return category.id || index;
  }

  public clearError(): void {
    this.errorMessage = '';
  }

  public selectIcon(icon: string): void {
    if (this.isMobile) {
      this.openIconSelectorDialog();
    } else {
      this.newCategory.icon = icon;
    }
  }

  public openIconSelectorDialog(): void {
    const dialogRef = this.dialog.open(IconSelectorDialogComponent, {
      width: '90vw',
      maxWidth: '500px',
      height: '80vh',
      maxHeight: '600px',
      data: {
        currentIcon: this.newCategory.icon,
        availableIcons: this.availableIcons
      },
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((selectedIcon: string) => {
      if (selectedIcon) {
        this.newCategory.icon = selectedIcon;
        this.hapticFeedback.lightVibration();
      }
    });
  }

  public selectColor(color: string): void {
    if (this.isMobile) {
      this.openColorSelectorDialog();
    } else {
      this.newCategory.color = color;
    }
  }

  public openColorSelectorDialog(): void {
    const dialogRef = this.dialog.open(ColorSelectorDialogComponent, {
      width: '90vw',
      maxWidth: '500px',
      height: '80vh',
      maxHeight: '600px',
      data: {
        currentColor: this.newCategory.color,
        availableColors: this.availableColors
      },
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((selectedColor: string) => {
      if (selectedColor) {
        this.newCategory.color = selectedColor;
        this.hapticFeedback.lightVibration();
      }
    });
  }

  private openMobileDialog(category?: Category): void {
    
    const dialogRef = this.dialog.open(MobileCategoryAddEditPopupComponent, {
      width: this.isMobile ? '90vw' : '600px',
      maxWidth: this.isMobile ? '400px' : '90vw',
      data: category || null,
      disableClose: true,
      panelClass: this.isMobile ? 'mobile-dialog' : 'desktop-dialog'
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.loadUserCategories(); 
      }
    });
  }

  public openAddMobileDialog(): void {
    if (this.isMobile) {
      this.hapticFeedback.lightVibration();
    }
    this.openMobileDialog();
  }

  public openBudgetDialog(category: Category): void {
    const dialogRef = this.dialog.open(CategoryBudgetDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        category: category,
        isEdit: category.budget?.hasBudget || false
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateCategoryBudget(category, result);
      }
    });
  }

  private updateCategoryBudget(category: Category, budgetData: Budget): void {
  

    this.store.dispatch(CategoriesActions.updateCategory({
      userId: this.userId,
      categoryId: category.id!,
      name: category.name,
      categoryType: category.type,
      icon: category.icon,
      color: category.color,
      budgetData: budgetData
    }));

    this.notificationService.success(
      budgetData.hasBudget 
        ? 'Budget set successfully for ' + category.name
        : 'Budget removed from ' + category.name
    );
  }

  public getBudgetProgressColor(category: Category): string {
    return this.budgetService.getBudgetProgressColor(category);
  }

  public formatBudgetPeriod(period: string | undefined): string {
    return this.budgetService.formatBudgetPeriod(period);
  }

  private getEmptyCategory(): Category {
    return {
      name: '',
      type: TransactionType.EXPENSE,
      icon: 'shopping_cart',
      color: '#46777f',
      createdAt: Date.now()
    };
  }

  /**
   * Toggle category expansion to show/hide details
   */
  public toggleCategoryExpansion(category: Category): void {
    if (this.expandedCategory?.id === category.id) {
      this.expandedCategory = null;
    } else {
      this.expandedCategory = category;
    }
  }

  /**
   * Get recent transactions for a category (placeholder implementation)
   */
  public getRecentTransactions(category: Category): any[] {
    // This is a placeholder - in a real app, you would fetch transactions from a service
    // For now, return an empty array
    return [];
  }

  /**
   * Get category statistics (placeholder implementation)
   */
  public getCategoryStats(category: Category): any {
    // This is a placeholder - in a real app, you would calculate stats from transaction data
    return {
      totalTransactions: 0,
      totalSpent: 0,
      averageTransaction: 0,
      largestTransaction: 0,
      thisMonth: 0,
      lastMonth: 0
    };
  }

  /**
   * Get budget status class for styling
   */
  public getBudgetStatusClass(category: Category): string {
    if (!category.budget?.hasBudget) return '';
    
    const percentage = category.budget?.budgetProgressPercentage || 0;
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'safe';
  }

  /**
   * Get remaining budget class for styling
   */
  public getRemainingBudgetClass(category: Category): string {
    if (!category.budget?.hasBudget) return '';
    
    const remaining = (category.budget?.budgetAmount || 0) - (category.budget?.budgetSpent || 0);
    if (remaining <= 0) return 'danger';
    if (remaining < (category.budget?.budgetAmount || 0) * 0.1) return 'warning';
    return 'safe';
  }
}
