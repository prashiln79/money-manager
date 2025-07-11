import { Component, Inject } from '@angular/core';
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
export class TransactionComponent {
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

    this.store
      .select(selectAllCategories)
      .subscribe((resp) => {
        this.categoryList = resp;
      });

    this.store
      .select(selectAllAccounts)
      .subscribe((resp) => {
        this.accountList = resp;
        
        if (this.dialogData?.id) {
          this.transactionForm.patchValue({
            payee: this.dialogData.payee,
            amount: this.dialogData.amount,
            date: this.dateService.toDate(this.dialogData.date),
            description: this.dialogData.notes,
            categoryId: this.dialogData.categoryId,
            categoryName: this.dialogData.categoryName,
            categoryType: this.dialogData.categoryType,
            accountId: this.dialogData.accountId,
          });
        } else {
          // Set default values for new transaction
          if (this.categoryList.length > 0) {
            this.transactionForm.patchValue({
              categoryId: this.categoryList[0].id,
              categoryName: this.categoryList[0].name,
              categoryType: this.categoryList[0].type,
            });
          }
          if (this.accountList.length > 0) {
            this.transactionForm.patchValue({
              accountId: this.accountList[0].accountId,
            });
          }
        }
      });
  }

  ngOnInit(): void {
    this.userId = this.auth.currentUser?.uid;
    window.addEventListener('popstate', (event) => {
      this.dialogRef.close();
      event.preventDefault();
    });
  }

  async onSubmit(): Promise<void> {
    this.transactionForm.markAllAsTouched();
    if (this.transactionForm.valid) {
      this.dialogRef.close(true);
    
      if (this.dialogData?.id) {
        await this.store.dispatch(
          TransactionsActions.updateTransaction({
            userId: this.userId,
            transactionId: this.dialogData.id,
            transaction: {
              payee: this.transactionForm.get('payee')?.value,
              userId: this.userId,
              accountId: this.transactionForm.get('accountId')?.value,
              amount: this.transactionForm.get('amount')?.value,
              categoryId: this.transactionForm.get('categoryId')?.value,
              category: this.transactionForm.get('categoryName')?.value,
              type: this.transactionForm.get('categoryType')?.value,
              date: this.transactionForm.get('date')?.value,
              notes: this.transactionForm.get('description')?.value,
            },
          })
        );
        this.notificationService.success('Transaction updated successfully');
      } else {
        await this.store.dispatch(
          TransactionsActions.createTransaction({
            userId: this.userId,
            transaction: {
              userId: this.userId,
              payee: this.transactionForm.get('payee')?.value,
              accountId: this.transactionForm.get('accountId')?.value,
              amount: this.transactionForm.get('amount')?.value,
              category: this.transactionForm.get('categoryName')?.value,
              categoryId: this.transactionForm.get('categoryId')?.value,
              type: this.transactionForm.get('categoryType')?.value,
              date: this.transactionForm.get('date')?.value,
              notes: this.transactionForm.get('description')?.value,
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
    const category = this.categoryList.find(c => c.id === event.value);
    if (category) {
      this.transactionForm.get('categoryName')?.setValue(category.name);
      this.transactionForm.get('categoryType')?.setValue(category.type);
    }
  }
}
