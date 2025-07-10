import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Category } from '../models/category.model';
import { APP_CONFIG } from '../config/config';
import { DateService } from './date.service';

export interface BudgetFormData {
  hasBudget: boolean;
  budgetAmount: number;
  budgetPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';
  budgetStartDate: Date | null;
  budgetEndDate: Date | null;
  budgetAlertThreshold: number;
  budgetAlertEnabled: boolean;
}

export interface BudgetData {
  hasBudget: boolean;
  budgetAmount: number;
  budgetPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';
  budgetStartDate: number | null;
  budgetEndDate: number | null;
  budgetSpent: number;
  budgetRemaining: number;
  budgetProgressPercentage: number;
  budgetAlertThreshold: number;
  budgetAlertEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryBudgetService {

  constructor(private fb: FormBuilder, private dateService: DateService) { }

  /**
   * Create a budget form group
   */
  createBudgetForm(): FormGroup {
    return this.fb.group({
      hasBudget: [false],
      budgetAmount: [0, [Validators.required, Validators.min(0.01)]],
      budgetPeriod: ['monthly', Validators.required],
      budgetStartDate: [new Date(), Validators.required],
      budgetEndDate: [null],
      budgetAlertThreshold: [80, [Validators.min(0), Validators.max(100)]],
      budgetAlertEnabled: [true]
    });
  }

  /**
   * Initialize budget form with existing category data
   */
  initializeBudgetForm(form: FormGroup, category?: Category): void {
    if (category?.hasBudget) {
      form.patchValue({
        hasBudget: category.hasBudget,
        budgetAmount: category.budgetAmount || 0,
        budgetPeriod: category.budgetPeriod || 'monthly',
        budgetStartDate: category.budgetStartDate ? this.dateService.toDate(category.budgetStartDate) : new Date(),
        budgetEndDate: category.budgetEndDate ? this.dateService.toDate(category.budgetEndDate) : null,
        budgetAlertThreshold: category.budgetAlertThreshold || 80,
        budgetAlertEnabled: category.budgetAlertEnabled !== false
      });
    }

    // Update form validation based on hasBudget toggle
    this.setupBudgetFormValidation(form);
  }

  /**
   * Setup form validation based on hasBudget toggle
   */
  setupBudgetFormValidation(form: FormGroup): void {
    form.get('hasBudget')?.valueChanges.subscribe(hasBudget => {
      if (hasBudget) {
        form.get('budgetAmount')?.enable();
        form.get('budgetPeriod')?.enable();
        form.get('budgetStartDate')?.enable();
        form.get('budgetEndDate')?.enable();
        form.get('budgetAlertThreshold')?.enable();
        form.get('budgetAlertEnabled')?.enable();
      } else {
        form.get('budgetAmount')?.disable();
        form.get('budgetPeriod')?.disable();
        form.get('budgetStartDate')?.disable();
        form.get('budgetEndDate')?.disable();
        form.get('budgetAlertThreshold')?.disable();
        form.get('budgetAlertEnabled')?.disable();
      }
    });

    // Trigger initial validation
    form.get('hasBudget')?.updateValueAndValidity();
  }

  /**
   * Get budget data from form
   */
  getBudgetDataFromForm(form: FormGroup): BudgetData {
    const formValue = form.value;
    return {
      hasBudget: formValue.hasBudget,
      budgetAmount: formValue.hasBudget ? formValue.budgetAmount : 0,
      budgetPeriod: formValue.hasBudget ? formValue.budgetPeriod : 'monthly',
      budgetStartDate: formValue.hasBudget ? formValue.budgetStartDate.getTime() : null,
      budgetEndDate: formValue.hasBudget && formValue.budgetEndDate ? formValue.budgetEndDate.getTime() : null,
      budgetSpent: 0,
      budgetRemaining: formValue.hasBudget ? formValue.budgetAmount : 0,
      budgetProgressPercentage: 0,
      budgetAlertThreshold: formValue.hasBudget ? formValue.budgetAlertThreshold : 80,
      budgetAlertEnabled: formValue.hasBudget ? formValue.budgetAlertEnabled : false
    };
  }

  /**
   * Check if budget form is valid
   */
  isBudgetFormValid(form: FormGroup): boolean {
    if (!form.get('hasBudget')?.value) {
      return true; // Form is valid if no budget is set
    }
    return form.valid;
  }

  /**
   * Get budget period options
   */
  getBudgetPeriods(): Array<{ value: string; label: string }> {
    return [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'yearly', label: 'Yearly' }
    ];
  }

  /**
   * Format budget amount
   */
  formatBudgetAmount(amount: number | undefined): string {
    if (!amount) return '0';
    return amount.toLocaleString(APP_CONFIG.LANGUAGE.DEFAULT, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Format budget period
   */
  formatBudgetPeriod(period: string | undefined): string {
    if (!period) return '';
    return period.charAt(0).toUpperCase() + period.slice(1);
  }

  /**
   * Get budget progress color
   */
  getBudgetProgressColor(category: Category): string {
    if (!category.hasBudget || !category.budgetProgressPercentage) {
      return '#6b7280'; // gray
    }
    
    const percentage = category.budgetProgressPercentage;
    if (percentage >= 100) {
      return '#ef4444'; // red - over budget
    } else if (percentage >= 80) {
      return '#f59e0b'; // amber - warning
    } else if (percentage >= 60) {
      return '#3b82f6'; // blue - good progress
    } else {
      return '#10b981'; // green - safe
    }
  }
} 