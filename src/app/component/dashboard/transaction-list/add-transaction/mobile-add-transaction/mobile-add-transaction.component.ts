import {
  Component,
  Inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
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
import { RecurringInterval, SyncStatus, TransactionStatus } from 'src/app/util/models/enums';

@Component({
  selector: 'app-mobile-add-transaction',
  templateUrl: './mobile-add-transaction.component.html',
  styleUrl: './mobile-add-transaction.component.scss',
})
export class MobileAddTransactionComponent implements AfterViewInit {
  @ViewChild('amountInput', { static: false }) amountInput!: ElementRef;

  transactionForm: FormGroup;
  public tagList: Array<any> = [];
  public accountList: Array<any> = [];
  public typeList: string[] = ['income', 'expense'];
  public userId: any;
  public isSubmitting = false;

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
    private dateService: DateService
  ) {
    this.transactionForm = this.fb.group({
      payee: ['', [Validators.required, Validators.maxLength(45)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      date: [moment().format('YYYY-MM-DD'), Validators.required],
      description: [''],
      tag: [''],
      type: ['expense'],
      accountId: ['', Validators.required],
    });

    this.store.select(selectAllCategories).subscribe((resp) => {
      this.tagList = resp;
    });

    this.store.select(selectAllAccounts).subscribe((resp) => {
      this.accountList = resp;
      if (this.dialogData?.id) {
        this.transactionForm.patchValue({
          payee: this.dialogData.payee,
          amount: this.dialogData.amount,
          date: moment(this.dateService.toDate(this.dialogData.date)).format(
            'YYYY-MM-DD'
          ),
          description: this.dialogData.notes,
          tag: this.dialogData.category,
          type: this.dialogData.type,
          accountId: this.dialogData.accountId,
        });
      } else {
        this.transactionForm.patchValue({
          payee: this.tagList.length > 0 ? this.tagList[0].name : '',
          tag: this.tagList.length > 0 ? this.tagList[0].name : '',
          accountId:
            this.accountList.length > 0 ? this.accountList[0].accountId : '',
        });
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
        if (this.dialogData?.id) {
          await this.store.dispatch(
            TransactionsActions.updateTransaction({
              userId: this.userId,
              transactionId: this.dialogData.id,
              transaction: {
                payee: this.transactionForm.get('payee')?.value,
                accountId: this.transactionForm.get('accountId')?.value,
                amount: this.transactionForm.get('amount')?.value,
                category: this.transactionForm.get('tag')?.value,
                type: this.transactionForm.get('type')?.value,
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
                category: this.transactionForm.get('tag')?.value,
                type: this.transactionForm.get('type')?.value,
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

        this.dialogRef.close(true);
        this.router.navigate(['/dashboard/transactions']);
      } catch (error) {
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
    const amountControl = this.transactionForm.get('amount');
    if (amountControl?.hasError('required')) {
      return 'Amount is required';
    }
    if (amountControl?.hasError('min')) {
      return 'Amount must be greater than 0';
    }
    return '';
  }

  getDateError(): string {
    const dateControl = this.transactionForm.get('date');
    if (dateControl?.hasError('required')) {
      return 'Date is required';
    }
    return '';
  }

  getTypeError(): string {
    const typeControl = this.transactionForm.get('type');
    if (typeControl?.hasError('required')) {
      return 'Type is required';
    }
    return '';
  }

  openNewAccountDialog(): void {
    this.dialog.open(AddAccountDialogComponent, {
      width: '90vw',
      maxWidth: '400px',
      data: null, // null for new account
      disableClose: true,
      panelClass: 'mobile-dialog',
    });
  }

  openEditAccountDialog(account: any): void {
    this.dialog.open(AddAccountDialogComponent, {
      width: '90vw',
      maxWidth: '400px',
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
    console.log(event.target.value);
    this.transactionForm.get('payee')?.setValue(event.target.value);
  }
}
