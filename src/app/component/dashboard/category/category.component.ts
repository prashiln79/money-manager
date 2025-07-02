import { Component, OnInit, OnDestroy } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Subject, takeUntil } from 'rxjs';
import { CategoryService } from 'src/app/util/service/category.service';

interface Category {
  id?: string;
  name: string;
  type: 'income' | 'expense';
  createdAt: number;
}

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
  
  // Form data
  public newCategory: Category = this.getEmptyCategory();
  
  // Private properties
  private userId: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private readonly categoryService: CategoryService,
    private readonly auth: Auth
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
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
   * Load all categories for the current user
   */
  private async loadUserCategories(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      this.categoryService
        .getCategories(this.userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (categories) => {
            this.categories = categories || [];
            this.isLoading = false;
          },
          error: (error) => {
            this.errorMessage = 'Failed to load categories';
            this.isLoading = false;
            console.error('Error loading categories:', error);
          }
        });
    } catch (error) {
      this.errorMessage = 'Failed to load categories';
      this.isLoading = false;
      console.error('Error loading categories:', error);
    }
  }

  /**
   * Create a new category for the current user
   */
  public async createCategory(): Promise<void> {
    if (!this.isValidCategoryData()) {
      this.errorMessage = 'Please enter a category name';
      return;
    }

    try {
      this.isLoading = true;
      this.errorMessage = '';

      await this.categoryService.createCategory(
        this.userId, 
        this.newCategory.name.trim(), 
        this.newCategory.type
      );
      
      // Reset form and reload categories
      this.newCategory = this.getEmptyCategory();
      await this.loadUserCategories();
    } catch (error) {
      this.errorMessage = 'Failed to create category';
      this.isLoading = false;
      console.error('Error creating category:', error);
    }
  }

  /**
   * Edit an existing category
   */
  public async editCategory(category: Category): Promise<void> {
    const newName = prompt('Edit Category Name:', category.name);
    
    if (newName !== null && newName.trim() !== '') {
      try {
        this.isLoading = true;
        this.errorMessage = '';

        await this.categoryService.updateCategory(
          this.userId, 
          category.id!, 
          newName.trim(), 
          category.type
        );
        
        await this.loadUserCategories();
      } catch (error) {
        this.errorMessage = 'Failed to update category';
        this.isLoading = false;
        console.error('Error updating category:', error);
      }
    }
  }

  /**
   * Delete a category
   */
  public async deleteCategory(categoryId: string): Promise<void> {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        this.isLoading = true;
        this.errorMessage = '';

        await this.categoryService.deleteCategory(this.userId, categoryId);
        await this.loadUserCategories();
      } catch (error) {
        this.errorMessage = 'Failed to delete category';
        this.isLoading = false;
        console.error('Error deleting category:', error);
      }
    }
  }

  /**
   * Validate the new category form data
   */
  private isValidCategoryData(): boolean {
    return !!(this.newCategory.name?.trim());
  }

  /**
   * Get an empty category template
   */
  private getEmptyCategory(): Category {
    return {
      name: '',
      type: 'expense',
      createdAt: Date.now()
    };
  }

  /**
   * Clear any error messages
   */
  public clearError(): void {
    this.errorMessage = '';
  }

  /**
   * Track function for ngFor to optimize rendering performance
   */
  public trackByCategoryId(index: number, category: Category): string {
    return category.id || index.toString();
  }
}
