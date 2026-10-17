import { Component, ChangeDetectionStrategy, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { TranslateModule } from '@ngx-translate/core';

import { CurrencyPipe } from 'src/app/util/pipes/currency.pipe';
import { ImageFallbackDirective } from 'src/app/util/directives';
import { TransactionType } from 'src/app/util/config/enums';
import { Category } from 'src/app/util/models';
import { MobileAddTransactionComponent } from 'src/app/component/dashboard/transaction-list/add-transaction/mobile-add-transaction/mobile-add-transaction.component';

@Component({
  selector: 'app-add-transaction-desktop',
  templateUrl: './add-transaction-desktop.component.html',
  styleUrls: ['./add-transaction-desktop.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    TranslateModule,
    CurrencyPipe,
    DatePipe,
    ImageFallbackDirective
  ]
})
export class AddTransactionDesktopComponent implements AfterViewInit {
  @Input({ required: true }) c!: MobileAddTransactionComponent;
  @ViewChild('desktopAmountInput') desktopAmountInput!: ElementRef<HTMLInputElement>;

  readonly TransactionType = TransactionType;

  ngAfterViewInit(): void {
    // Focus the amount input automatically on desktop
    setTimeout(() => {
      this.desktopAmountInput?.nativeElement?.focus();
    }, 150);
  }

  get currentType(): 'expense' | 'income' | 'transfer' {
    if (this.c.transactionForm.get('isTransferMode')?.value) {
      return 'transfer';
    }
    const catType = this.c.transactionForm.get('categoryType')?.value;
    return catType === 'income' ? 'income' : 'expense';
  }

  setType(type: 'expense' | 'income' | 'transfer'): void {
    if (this.c.viewMode()) return;

    if (type === 'transfer') {
      this.c.transactionForm.patchValue({ isTransferMode: true });
    } else {
      this.c.transactionForm.patchValue({
        isTransferMode: false,
        categoryType: type
      });

      // Switch category if current category does not match selected type
      const currentCatId = this.c.transactionForm.get('categoryId')?.value;
      const categories = this.c.categories();
      const currentCat = categories.find(cat => cat.id === currentCatId);
      if (!currentCat || currentCat.type !== type) {
        const matchingCat = categories.find(cat => cat.type === type && !cat.isSystem);
        if (matchingCat) {
          this.c.onCategoryChange(matchingCat.id);
        }
      }
    }
  }

  setQuickDate(offsetDays: number): void {
    if (this.c.viewMode()) return;
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const dateStr = target.toISOString().split('T')[0];
    this.c.transactionForm.patchValue({ date: dateStr });
  }
}
