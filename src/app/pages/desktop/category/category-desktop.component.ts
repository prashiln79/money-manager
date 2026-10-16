import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
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

@Component({
  selector: 'app-category-desktop',
  templateUrl: './category-desktop.component.html',
  styleUrls: ['./category-desktop.component.scss'],
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
export class CategoryDesktopComponent {
  @Input() vm: any;
  @Input() errorMessage: string | null = null;
  @Input() selectedtabGroup = 0;
  @Input() searchControl!: FormControl;
  @Input() filterType: string = 'all';
  @Input() selectedCategoryId: string | null = null;
  @Input() isAutoCategorizing = false;
  @Input() getSubCategoriesForCategory!: (parentId: string) => any[];

  @Output() clearError = new EventEmitter<void>();
  @Output() openAddMobileDialog = new EventEmitter<void>();
  @Output() selectedtabGroupChange = new EventEmitter<number>();
  @Output() setFilterType = new EventEmitter<string>();
  @Output() toggleExpandCategory = new EventEmitter<{ category: Category; event: Event }>();
  @Output() openMobileDialog = new EventEmitter<Category>();
  @Output() openBudgetDialog = new EventEmitter<Category>();
  @Output() removeBudget = new EventEmitter<Category>();
  @Output() removeFromParentCategory = new EventEmitter<Category>();
  @Output() deleteCategory = new EventEmitter<Category>();
  @Output() autoCategorize = new EventEmitter<void>();
  @Output() openEditCategoryGroupDialog = new EventEmitter<string>();
}
