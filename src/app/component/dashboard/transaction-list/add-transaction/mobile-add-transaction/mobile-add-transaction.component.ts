import {
  Component,
  Inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit,
} from '@angular/core';

import { Auth } from '@angular/fire/auth';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { HapticFeedbackService } from 'src/app/util/service/haptic-feedback.service';
import { NotificationService } from 'src/app/util/service/notification.service';
import { ValidationService } from 'src/app/util/service/validation.service';
import { AddAccountDialogComponent } from 'src/app/component/dashboard/accounts/add-account-dialog/add-account-dialog.component';
import { MobileCategoryAddEditPopupComponent } from 'src/app/component/dashboard/category/mobile-category-add-edit-popup/mobile-category-add-edit-popup.component';
import moment from 'moment';
import { LoaderService } from 'src/app/util/service/loader.service';
import { DateService } from 'src/app/util/service/date.service';
import { AppState } from 'src/app/store/app.state';
import { Store } from '@ngrx/store';
import * as TransactionsActions from '../../../../../store/transactions/transactions.actions';
import { selectAllAccounts } from 'src/app/store/accounts/accounts.selectors';
import { selectAllCategories } from 'src/app/store/categories/categories.selectors';
import {
  RecurringInterval,
  SyncStatus,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
} from 'src/app/util/config/enums';
import { Category } from 'src/app/util/models';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-mobile-add-transaction',
  templateUrl: './mobile-add-transaction.component.html',
  styleUrl: './mobile-add-transaction.component.scss'
})
export class MobileAddTransactionComponent implements OnInit, AfterViewInit {
  @ViewChild('amountInput', { static: false }) amountInput!: ElementRef;

  transactionForm: FormGroup;
  public categoryList: Array<Category> = [];
  public accountList: Array<any> = [];
  public userId: any;
  public isSubmitting = false;
  public isMobile: boolean = false;
  public paymentMethods = [
    { value: PaymentMethod.CREDIT_CARD, label: 'Credit Card', icon: 'credit_card' },
    { value: PaymentMethod.DEBIT_CARD, label: 'Debit Card', icon: 'credit_card' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer', icon: 'account_balance' },
    { value: PaymentMethod.CASH, label: 'Cash', icon: 'money' },
    { value: PaymentMethod.DIGITAL_WALLET, label: 'Digital Wallet', icon: 'account_balance_wallet' },
  ];
  public editMode: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private store: Store<AppState>,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MobileAddTransactionComponent>,
    private auth: Auth,
    private notificationService: NotificationService,
    private router: Router,
    private hapticFeedback: HapticFeedbackService,
    private dialog: MatDialog,
    private loaderService: LoaderService,
    private dateService: DateService,
    private validationService: ValidationService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.transactionForm = this.fb.group({
      payee: ['', this.validationService.getTransactionPayeeValidators()],
      amount: ['', this.validationService.getTransactionAmountValidators()],
      date: [moment().format('YYYY-MM-DD'), Validators.required],
      description: [''],
      categoryId: [''],
      categoryName: [''],
      categoryType: [''],
      accountId: ['', Validators.required],
      taxAmount: [0, [Validators.min(0)]],
      taxPercentage: [0, [Validators.min(0), Validators.max(100)]],
      taxes: [[]],
      paymentMethod: [''],
      // Recurring fields
      isRecurring: [false],
      recurringInterval: [RecurringInterval.MONTHLY],
      recurringStartDate: [moment().format('YYYY-MM-DD')],
      recurringEndDate: [moment().add(1, 'year').format('YYYY-MM-DD')],
      recurringAmount: [0],
      recurringNotes: [''],
      recurringCategoryId: [''],
      recurringCategoryName: [''],
    });
    this.isMobile = this.breakpointObserver.isMatched('(max-width: 640px)');
  }

  ngOnInit(): void {
    this.userId = this.auth.currentUser?.uid;

    // Subscribe to categories
    this.store.select(selectAllCategories).subscribe((categories) => {
      this.categoryList = categories;
      this.initializeFormData();
    });

    // Subscribe to accounts
    this.store.select(selectAllAccounts).subscribe((accounts) => {
      this.accountList = accounts;
      this.initializeFormData();
    });

    window.addEventListener('popstate', (event) => {
      this.dialogRef.close();
      event.preventDefault();
    });
  }

  private initializeFormData(): void {
    if (this.categoryList.length > 0 && this.accountList.length > 0) {
      if (this.dialogData?.id) {
        this.editMode = true;
        let category = this.categoryList.find(cat => cat.id === this.dialogData.categoryId);
        this.transactionForm.patchValue({
          payee: this.dialogData.payee || '',
          amount: this.dialogData.amount || '',
          date: this.dialogData.date ?
            moment(this.dateService.toDate(this.dialogData.date)).format('YYYY-MM-DD') :
            moment().format('YYYY-MM-DD'),
          description: this.dialogData.notes || '',
          categoryId: this.dialogData.categoryId || '',
          categoryName: category?.name || '',
          categoryType: category?.type || '',
          accountId: this.dialogData.accountId || '',
          taxAmount: this.dialogData.taxAmount || 0,
          taxPercentage: this.dialogData.taxPercentage || 0,
          taxes: this.dialogData.taxes || [],
          paymentMethod: this.dialogData.paymentMethod || '',
        });


      } else {
        // Add mode - set default values
        const defaultCategory = this.categoryList[0];
        const defaultAccount = this.accountList[0];

        this.transactionForm.patchValue({
          payee: defaultCategory?.name || '',
          amount: '',
          date: moment().format('YYYY-MM-DD'),
          description: '',
          categoryId: defaultCategory?.id || '',
          categoryName: defaultCategory?.name || '',
          categoryType: defaultCategory?.type || '',
          accountId: defaultAccount?.accountId || '',
          // Tax fields
          taxAmount: 0,
          taxPercentage: 0,
          taxes: [],
          // Payment method
          paymentMethod: '',
        });
      }
    }
  }

  ngAfterViewInit(): void {
    // Focus on amount field after view is initialized
    setTimeout(() => {
      if (this.amountInput) {
        this.amountInput.nativeElement.focus();
      }
    }, 200);
  }

  async onSubmit(): Promise<void> {
    this.transactionForm.markAllAsTouched();
    if (this.transactionForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      try {
        this.loaderService.show();

        const formData = this.transactionForm.value;
        const transactionData = {
          payee: formData.payee,
          accountId: formData.accountId,
          amount: parseFloat(formData.amount),
          category: formData.categoryName,
          categoryId: formData.categoryId,
          type: formData.categoryType as TransactionType,
          date: new Date(formData.date + ' ' + this.dateService.now().toDate().toLocaleTimeString()),
          notes: formData.description,
          taxAmount: formData.taxAmount || 0,
          taxPercentage: formData.taxPercentage || 0,
          taxes: formData.taxes || [],
          paymentMethod: formData.paymentMethod || '',
          isRecurring: formData.isRecurring || false,
          recurringInterval: formData.recurringInterval || RecurringInterval.MONTHLY,
          status: TransactionStatus.COMPLETED,
          updatedBy: this.userId,
          updatedAt: new Date(),
        };

        if (this.dialogData?.id) {
          await this.store.dispatch(
            TransactionsActions.updateTransaction({
              userId: this.userId,
              transactionId: this.dialogData.id,
              transaction: transactionData,
            })
          );
          this.notificationService.success('Transaction updated successfully');
        } else {
          // Create new transaction
          await this.store.dispatch(
            TransactionsActions.createTransaction({
              userId: this.userId,
              transaction: {
                userId: this.userId,
                ...transactionData,
                syncStatus: SyncStatus.PENDING,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: this.userId,
                updatedBy: this.userId,
              },
            })
          );
          this.notificationService.success('Transaction added successfully');
          this.hapticFeedback.successVibration();
        }
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error saving transaction:', error);
        this.notificationService.error('Failed to save transaction');
      } finally {
        this.isSubmitting = false;
        this.loaderService.hide();
      }
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getAmountError(): string {
    const control = this.transactionForm.get('amount');
    return control ? this.validationService.getTransactionAmountError(control) : '';
  }

  getDateError(): string {
    const dateControl = this.transactionForm.get('date');
    if (dateControl?.hasError('required')) {
      return 'Date is required';
    }
    return '';
  }

  openNewAccountDialog(): void {
    this.dialog.open(AddAccountDialogComponent, {
      width: this.isMobile ? '90vw' : '400px',
      maxWidth: this.isMobile ? '400px' : '90vw',
      data: null, // null for new account
      disableClose: true,
      panelClass: 'mobile-dialog',
    });
  }

  openEditAccountDialog(account: any): void {
    this.dialog.open(AddAccountDialogComponent, {
      width: this.isMobile ? '90vw' : '400px',
      maxWidth: this.isMobile ? '400px' : '90vw',
      data: account, // existing account data
      disableClose: true,
      panelClass: 'mobile-dialog',
    });
  }

  openNewCategoryDialog(): void {
    this.dialog.open(MobileCategoryAddEditPopupComponent, {
      width: '90vw',
      maxWidth: '400px',
      data: null, // null for new category
      disableClose: true,
      panelClass: 'mobile-dialog',
    });
  }

  onCategoryChange(event: any): void {
    const categoryId = event.value;
    const category = this.categoryList.find(cat => cat.id === categoryId);
    if (category) {
      this.transactionForm.patchValue({
        categoryName: category.name,
        categoryType: category.type,
        categoryId: category.id,
        payee: this.editMode ? this.dialogData.payee : category.name,
      });
    }
  }

  /**
   * Calculate tax amount when percentage changes
   */
  onTaxPercentageChange(): void {
    const amount = this.transactionForm.get('amount')?.value || 0;
    const percentage = this.transactionForm.get('taxPercentage')?.value || 0;

    if (amount > 0 && percentage > 0) {
      const calculatedTaxAmount = (amount * percentage) / 100;
      this.transactionForm.patchValue({
        taxAmount: parseFloat(calculatedTaxAmount.toFixed(2))
      }, { emitEvent: false });
    }
  }

  /**
   * Calculate tax percentage when amount changes
   */
  onTaxAmountChange(): void {
    const amount = this.transactionForm.get('amount')?.value || 0;
    const taxAmount = this.transactionForm.get('taxAmount')?.value || 0;

    if (amount > 0 && taxAmount > 0) {
      const calculatedPercentage = (taxAmount / amount) * 100;
      this.transactionForm.patchValue({
        taxPercentage: parseFloat(calculatedPercentage.toFixed(2))
      }, { emitEvent: false });
    }
  }

  /**
   * Handle amount field changes and recalculate tax percentage if needed
   */
  onAmountChange(): void {
    const amount = this.transactionForm.get('amount')?.value || 0;
    const taxAmount = this.transactionForm.get('taxAmount')?.value || 0;

    // If there's a tax amount but no percentage, calculate the percentage
    if (amount > 0 && taxAmount > 0) {
      const calculatedPercentage = (taxAmount / amount) * 100;
      this.transactionForm.patchValue({
        taxPercentage: parseFloat(calculatedPercentage.toFixed(2))
      }, { emitEvent: false });
    }
  }

  /**
   * Clear all tax fields
   */
  clearTaxFields(): void {
    this.transactionForm.patchValue({
      taxAmount: 0,
      taxPercentage: 0,
      taxes: []
    });
  }


}
