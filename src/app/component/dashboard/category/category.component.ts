import { Component, OnInit, OnDestroy } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subject, takeUntil, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CategoryService } from 'src/app/util/service/category.service';
import { ConfirmDialogComponent } from 'src/app/util/components/confirm-dialog/confirm-dialog.component';
import { NotificationService } from 'src/app/util/service/notification.service';
import { HapticFeedbackService } from 'src/app/util/service/haptic-feedback.service';
import { MobileCategoryComponent } from './mobile-category/mobile-category.component';
import { IconSelectorDialogComponent } from './icon-selector-dialog/icon-selector-dialog.component';
import { ColorSelectorDialogComponent } from './color-selector-dialog/color-selector-dialog.component';
import { Category, AVAILABLE_ICONS, AVAILABLE_COLORS, defaultCategoriesForNewUser } from 'src/app/util/models';

@Component({
  selector: 'transaction-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit, OnDestroy {
  // Component state
  public categories: Category[] = [];
  public isLoading: boolean = false;
  public errorMessage: string = '';
  public isEditMode: boolean = false;
  public isMobile: boolean = false;
  
  // Form data
  public newCategory: Category = this.getEmptyCategory();
  
  // Icon selection
  public availableIcons: string[] = AVAILABLE_ICONS;

  // Color selection
  public availableColors: string[] = AVAILABLE_COLORS;

  // Autocomplete properties
  public categorySuggestions: string[] = [];
  public filteredSuggestions: Observable<string[]> = new Observable<string[]>();
  public categoryNameInput: string = '';

  public userId: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private categoryService: CategoryService,
    private auth: Auth,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private hapticFeedback: HapticFeedbackService,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupResponsiveDesign();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the component by loading user categories
   */
  private async initializeComponent(): Promise<void> {
    const currentUser = this.auth.currentUser;
    
    if (!currentUser) {
      this.errorMessage = 'User not authenticated';
      return;
    }

    this.userId = currentUser.uid;
    await this.loadUserCategories();
  }

  /**
   * Setup responsive design for mobile/desktop
   */
  private setupResponsiveDesign(): void {
    this.breakpointObserver
      .observe(['(max-width: 768px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }

  /**
   * Load categories for the current user
   */
  private async loadUserCategories(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      this.categoryService.getCategories(this.userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (categories) => {
            this.categories = categories.sort((a, b) => a.name.localeCompare(b.name));
            this.initializeCategorySuggestions();
            this.isLoading = false;
          },
          error: (error) => {
            this.errorMessage = 'Failed to load categories';
            this.isLoading = false;
            console.error('Error loading categories:', error);
            this.notificationService.error('Failed to load categories');
          }
        });
    } catch (error) {
      this.errorMessage = 'Failed to load categories';
      this.isLoading = false;
      console.error('Error loading categories:', error);
      this.notificationService.error('Failed to load categories');
    }
  }

  /**
   * Initialize category suggestions for autocomplete
   */
  private initializeCategorySuggestions(): void {
    // Get existing category names
    const existingCategoryNames = this.categories.map(cat => cat.name);
    
    // Get default category names
    const defaultCategoryNames = defaultCategoriesForNewUser.map(cat => cat.name);
    
    // Combine and remove duplicates
    this.categorySuggestions = [...new Set([...existingCategoryNames, ...defaultCategoryNames])];
    
    // Initialize filtered suggestions
    this.filteredSuggestions = new Observable<string[]>();
  }

  /**
   * Filter category suggestions based on input
   */
  public filterSuggestions(value: string): void {
    const filterValue = value.toLowerCase();
    this.filteredSuggestions = new Observable<string[]>().pipe(
      startWith(''),
      map(() => this.categorySuggestions.filter(suggestion => 
        suggestion.toLowerCase().includes(filterValue)
      ))
    );
  }

  /**
   * Select a suggestion from autocomplete
   */
  public selectSuggestion(suggestion: string): void {
    this.newCategory.name = suggestion;
    this.categoryNameInput = suggestion;
  }

  /**
   * Handle category name input for autocomplete
   */
  public onCategoryNameInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.filterSuggestions(target.value);
    }
  }

  /**
   * Create a new category for the current user
   */
  public async createCategory(): Promise<void> {
    if (!this.isValidCategoryData()) {
      this.notificationService.warning('Please enter a category name');
      return;
    }

    try {
      this.isLoading = true;
      this.errorMessage = '';

      await this.categoryService.createCategory(
        this.userId, 
        this.newCategory.name.trim(), 
        this.newCategory.type,
        this.newCategory.icon,
        this.newCategory.color
      );
      
      this.notificationService.success('Category created successfully');
      // Reset form and reload categories
      this.resetForm();
      await this.loadUserCategories();
    } catch (error) {
      this.errorMessage = 'Failed to create category';
      this.isLoading = false;
      console.error('Error creating category:', error);
      this.notificationService.error('Failed to create category');
    }
  }

  /**
   * Edit an existing category
   */
  public editCategory(category: Category): void {
    if (this.isMobile) {
      this.hapticFeedback.lightVibration();
      this.openMobileDialog(category);
    } else {
      this.isEditMode = true;
      this.newCategory = {
        id: category.id,
        name: category.name,
        type: category.type,
        icon: category.icon || 'category',
        color: category.color || '#2196F3',
        createdAt: category.createdAt
      };
    }
  }

  /**
   * Update an existing category
   */
  public async updateCategory(): Promise<void> {
    if (!this.isValidCategoryData()) {
      this.notificationService.warning('Please enter a category name');
      return;
    }

    if (!this.newCategory.id) {
      this.notificationService.error('Invalid category');
      return;
    }

    try {
      this.isLoading = true;
      this.errorMessage = '';

      await this.categoryService.updateCategory(
        this.userId, 
        this.newCategory.id, 
        this.newCategory.name.trim(), 
        this.newCategory.type,
        this.newCategory.icon,
        this.newCategory.color
      );
      
      this.notificationService.success('Category updated successfully');
      // Reset form and reload categories
      this.resetForm();
      await this.loadUserCategories();
    } catch (error) {
      this.errorMessage = 'Failed to update category';
      this.isLoading = false;
      console.error('Error updating category:', error);
      this.notificationService.error('Failed to update category');
    }
  }

  /**
   * Delete a category with confirmation dialog
   */
  public deleteCategory(category: Category): void {
    if (this.isMobile) {
      this.hapticFeedback.warningVibration();
    }
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: this.isMobile ? '90vw' : '400px',
      maxWidth: this.isMobile ? '400px' : '400px',
      data: {
        title: 'Delete Category',
        message: `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'delete'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.performDelete(category.id!);
        }
      });
  }

  /**
   * Perform the actual deletion of a category
   */
  private async performDelete(categoryId: string): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      await this.categoryService.deleteCategory(this.userId, categoryId);
      
      this.notificationService.success('Category deleted successfully');
      await this.loadUserCategories();
    } catch (error) {
      this.errorMessage = 'Failed to delete category';
      this.isLoading = false;
      console.error('Error deleting category:', error);
      this.notificationService.error('Failed to delete category');
    }
  }

  /**
   * Cancel edit mode and reset form
   */
  public cancelEdit(): void {
    this.isEditMode = false;
    this.resetForm();
  }

  /**
   * Reset the form to empty state
   */
  private resetForm(): void {
    this.newCategory = this.getEmptyCategory();
    this.categoryNameInput = '';
    this.isEditMode = false;
    this.isLoading = false;
  }

  /**
   * Validate category data before submission
   */
  private isValidCategoryData(): boolean {
    return this.newCategory.name.trim().length > 0 && 
           this.newCategory.name.trim().length <= 50;
  }

  /**
   * Track categories by ID for ngFor optimization
   */
  public trackByCategoryId(index: number, category: Category): string | number {
    return category.id || index;
  }

  /**
   * Clear error message
   */
  public clearError(): void {
    this.errorMessage = '';
  }

  /**
   * Select an icon for the category
   */
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

  /**
   * Select a color for the category
   */
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

  /**
   * Open mobile dialog for editing category
   */
  private openMobileDialog(category?: Category): void {
    const dialogRef = this.dialog.open(MobileCategoryComponent, {
      width: '90vw',
      maxWidth: '400px',
      data: category || null,
      disableClose: true,
      panelClass: 'mobile-dialog'
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.loadUserCategories();
        }
      });
  }

  /**
   * Open mobile dialog for adding new category
   */
  public openAddMobileDialog(): void {
    if (this.isMobile) {
      this.hapticFeedback.lightVibration();
    }
    this.openMobileDialog();
  }

  /**
   * Get an empty category template
   */
  private getEmptyCategory(): Category {
    return {
      name: '',
      type: 'expense',
      icon: 'shopping_cart',
      color: '#2196F3',
      createdAt: Date.now()
    };
  }
}
