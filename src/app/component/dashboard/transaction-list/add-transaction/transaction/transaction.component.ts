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
      category: [''],
    });

    this.store
      .select(selectAllCategories)
      .subscribe((resp) => {
        this.categoryList = resp;
        if (this.dialogData?.id) {
          this.transactionForm.patchValue({
            payee: this.dialogData.payee,
            amount: this.dialogData.amount,
            date: this.dateService.toDate(this.dialogData.date),
            description: this.dialogData.notes,
            category: this.dialogData.category,
          });
        } else {
          if(this.categoryList.length > 0) {
            this.transactionForm.patchValue({
              category:{id: this.categoryList[0].id, name: this.categoryList[0].name},
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
              accountId: '',
              amount: this.transactionForm.get('amount')?.value,
              category: this.transactionForm.get('category')?.value.name,
              categoryId: this.transactionForm.get('category')?.value.id,
              type: this.transactionForm.get('category')?.value.type,
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
              payee: this.transactionForm.get('payee')?.value,
              userId: this.userId,
              accountId: '',
              amount: this.transactionForm.get('amount')?.value,
              category: this.transactionForm.get('category')?.value.name,
              categoryId: this.transactionForm.get('category')?.value.id,
              type: this.transactionForm.get('category')?.value.type,
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
}
