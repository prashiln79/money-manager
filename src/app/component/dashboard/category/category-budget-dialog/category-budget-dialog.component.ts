import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup } from '@angular/forms';
import { Category } from 'src/app/util/models/category.model';
import { CategoryBudgetService } from 'src/app/util/service/category-budget.service';

export interface CategoryBudgetDialogData {
  category: Category;
  isEdit: boolean;
}

@Component({
  selector: 'app-category-budget-dialog',
  templateUrl: './category-budget-dialog.component.html',
  styleUrls: ['./category-budget-dialog.component.scss']
})
export class CategoryBudgetDialogComponent implements OnInit {
  budgetForm: FormGroup;
  budgetPeriods: Array<{ value: string; label: string }>;
  minDate: Date = new Date();
  maxDate: Date = new Date(new Date().getFullYear() + 1, 11, 31);

  constructor(
    private dialogRef: MatDialogRef<CategoryBudgetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryBudgetDialogData,
    private budgetService: CategoryBudgetService
  ) {
    this.budgetForm = this.budgetService.createBudgetForm();
    this.budgetPeriods = this.budgetService.getBudgetPeriods();
  }

  ngOnInit(): void {
    this.budgetService.initializeBudgetForm(this.budgetForm, this.data.category);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.budgetService.isBudgetFormValid(this.budgetForm)) {
      const budgetData = this.budgetService.getBudgetDataFromForm(this.budgetForm);
      this.dialogRef.close(budgetData);
    }
  }

  get isFormValid(): boolean {
    return this.budgetService.isBudgetFormValid(this.budgetForm);
  }

  get budgetAmountControl() {
    return this.budgetForm.get('budgetAmount');
  }

  get budgetPeriodControl() {
    return this.budgetForm.get('budgetPeriod');
  }
} 