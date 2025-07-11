import { Component, Inject, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DateService } from 'src/app/util/service/date.service';
import { HapticFeedbackService } from 'src/app/util/service/haptic-feedback.service';
import { NotificationService } from 'src/app/util/service/notification.service';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.state';
import * as TransactionsActions from '../../../../../store/transactions/transactions.actions';
import { selectAllCategories } from 'src/app/store/categories/categories.selectors';
import { selectAllAccounts } from 'src/app/store/accounts/accounts.selectors';
import { RecurringInterval, SyncStatus, TransactionStatus, TransactionType } from 'src/app/util/config/enums';
import { Category } from 'src/app/util/models';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrl: './transaction.component.scss',
})
export class TransactionComponent implements OnInit {
  transactionForm: FormGroup;
  categories: Array<any> = [];
  buttons: string[] = [
    '7',
    '8',
    '9',
    '/',
    '4',
    '5',
    '6',
    '*',
    '1',
    '2',
    '3',
    '-',
    '0',
    '.',
    '=',
    '+',
  ];
  public categoryList: Array<Category> = [];
  public accountList: Array<any> = [];
  public statusList: string[] = ['Pending', 'Completed', 'Cancelled'];
  public userId: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TransactionComponent>,
    private auth: Auth,
    private notificationService: NotificationService,
    private hapticFeedback: HapticFeedbackService,
    private dateService: DateService,
    private store: Store<AppState>
  ) {
    this.transactionForm = this.fb.group({
      payee: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      date: [new Date(), Validators.required],
      description: [''],
      categoryId: [''],
      categoryName: [''],
      categoryType: [''],
      accountId: ['', Validators.required],
    });
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
    // Only initialize if both categories and accounts are loaded
    if (this.categoryList.length > 0 && this.accountList.length > 0) {
      if (this.dialogData?.id) {
        // Edit mode - populate with existing data
        this.transactionForm.patchValue({
          payee: this.dialogData.payee || '',
          amount: this.dialogData.amount || '',
          date: this.dialogData.date ? this.dateService.toDate(this.dialogData.date) : new Date(),
          description: this.dialogData.notes || '',
          categoryId: this.dialogData.categoryId || '',
          categoryName: this.dialogData.categoryName || '',
          categoryType: this.dialogData.categoryType || '',
          accountId: this.dialogData.accountId || '',
        });
      } else {
        // Add mode - set default values
        const defaultCategory = this.categoryList[0];
        const defaultAccount = this.accountList[0];
        
        this.transactionForm.patchValue({
          payee: '',
          amount: '',
          date: new Date(),
          description: '',
          categoryId: defaultCategory?.id || '',
          categoryName: defaultCategory?.name || '',
          categoryType: defaultCategory?.type || '',
          accountId: defaultAccount?.accountId || '',
        });
      }
    }
  }

  async onSubmit(): Promise<void> {
    this.transactionForm.markAllAsTouched();
    if (this.transactionForm.valid) {
      this.dialogRef.close(true);
    
      const formData = this.transactionForm.value;
      const transactionData = {
        payee: formData.payee,
        accountId: formData.accountId,
        amount: parseFloat(formData.amount),
        category: formData.categoryName,
        categoryId: formData.categoryId,
        type: formData.categoryType as TransactionType,
        date: formData.date,
        notes: formData.description,
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
        await this.store.dispatch(
          TransactionsActions.createTransaction({
            userId: this.userId,
            transaction: {
              userId: this.userId,
              ...transactionData,
              isRecurring: false,
              recurringInterval: RecurringInterval.MONTHLY,
              status: TransactionStatus.COMPLETED,
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
    }
  }

  appendExpression(value: string): void {
    if (value === '=') {
      this.calculate();
    } else {
      this.transactionForm
        .get('amount')
        ?.setValue(this.transactionForm.get('amount')?.value + value);
    }
  }

  calculate(): void {
    try {
      this.transactionForm
        .get('amount')
        ?.setValue(this.transactionForm.get('amount')?.value);
    } catch (e) {
      this.transactionForm.get('amount')?.setValue('Error');
    }
  }

  clear(): void {
    this.transactionForm.get('amount')?.setValue('');
  }

  onCategoryChange(event: any): void {
    const categoryId = event.value;
    const category = this.categoryList.find(c => c.id === categoryId);
    if (category) {
      this.transactionForm.patchValue({
        categoryName: category.name,
        categoryType: category.type,
        categoryId: category.id,
      });
    }
  }
}
