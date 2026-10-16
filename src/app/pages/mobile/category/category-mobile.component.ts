import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyPipe } from 'src/app/util/pipes/currency.pipe';
import { Category } from 'src/app/util/models';
import { CategoryComponent } from 'src/app/component/dashboard/category/category.component';

@Component({
  selector: 'app-category-mobile',
  templateUrl: './category-mobile.component.html',
  styleUrls: ['./category-mobile.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatListModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatTabsModule,
    TranslateModule,
    CurrencyPipe
  ]
})
export class CategoryMobileComponent {
  @Input({ required: true }) c!: CategoryComponent;

  get vm$() { return this.c?.vm$; }
  get errorMessage() { return this.c?.errorMessage; }
  get breakpointService() { return this.c?.breakpointService; }
  get selectedtabGroup() { return this.c?.selectedtabGroup; }
  get searchControl() { return this.c?.searchControl; }
  get filterType$() { return this.c?.filterType$; }
  get selectedCategoryId() { return this.c?.selectedCategoryId; }
  get isAutoCategorizing() { return this.c?.isAutoCategorizing; }

  clearError() { this.c?.clearError(); }
  openAddMobileDialog() { this.c?.openAddMobileDialog(); }
  setFilterType(type: string) { this.c?.setFilterType(type); }
  toggleExpandCategory(category: Category, event: Event) { this.c?.toggleExpandCategory(category, event); }
  openMobileDialog(category: Category) { this.c?.openMobileDialog(category); }
  openBudgetDialog(category: Category) { this.c?.openBudgetDialog(category); }
  removeBudget(category: Category) { this.c?.removeBudget(category); }
  removeFromParentCategory(category: Category) { this.c?.removeFromParentCategory(category); }
  deleteCategory(category: Category) { this.c?.deleteCategory(category); }
  getSubCategoriesForCategory(parentId: string) { return this.c ? this.c.getSubCategoriesForCategory(parentId) : []; }
  autoCategorize() { this.c?.autoCategorize(); }
  openEditCategoryGroupDialog(groupId: string) { this.c?.openEditCategoryGroupDialog(groupId); }
}
