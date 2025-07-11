import { Component, Inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { HapticFeedbackService } from 'src/app/util/service/haptic-feedback.service';
import { NotificationService } from 'src/app/util/service/notification.service';
import { Account } from 'src/app/util/models/account.model';
import { AppState } from 'src/app/store/app.state';
import { Store } from '@ngrx/store';
import {
  createAccount,
  updateAccount,
} from 'src/app/store/accounts/accounts.actions';

@Component({
  selector: 'app-mobile-account',
  templateUrl: './mobile-account.component.html',
  styleUrl: './mobile-account.component.scss',
})
export class MobileAccountComponent {
  accountForm: FormGroup;
  public userId: any;
  public isSubmitting = false;
  public accountTypes = [
    { value: 'bank', label: 'Bank Account' },
    { value: 'cash', label: 'Cash' },
    { value: 'credit', label: 'Credit Card' },
    { value: 'loan', label: 'Loan' },
  ];

  public repaymentFrequencies = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'weekly', label: 'Weekly' },
  ];

  public loanStatuses = [
    { value: 'active', label: 'Active' },
    { value: 'closed', label: 'Closed' },
    { value: 'defaulted', label: 'Defaulted' },
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: Account | null,
    private store: Store<AppState>,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MobileAccountComponent>,
    private auth: Auth,
    private notificationService: NotificationService,
    private router: Router,
    private hapticFeedback: HapticFeedbackService
  ) {
    this.accountForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      type: ['bank', Validators.required],
      balance: [
        '',
        [Validators.required, Validators.min(-999999), Validators.max(999999)],
      ],
      // Loan-specific fields
      lenderName: [''],
      loanAmount: [0, [Validators.min(0), Validators.max(999999)]],
      interestRate: [0, [Validators.min(0), Validators.max(100)]],
      startDate: [new Date()],
      durationMonths: [12, [Validators.min(1), Validators.max(600)]],
      repaymentFrequency: ['monthly'],
      status: ['active'],
      totalPaid: [0, [Validators.min(0)]],
      remainingBalance: [0, [Validators.min(0)]],
      nextDueDate: [new Date()],
      showReminder: [true],
    });

    // If editing, populate form with existing data
    if (this.dialogData) {
      this.accountForm.patchValue({
        name: this.dialogData.name,
        type: this.dialogData.type,
        balance: this.dialogData.balance,
        // Populate loan details if they exist
        ...(this.dialogData.loanDetails && {
          lenderName: this.dialogData.loanDetails.lenderName,
          loanAmount: this.dialogData.loanDetails.loanAmount,
          interestRate: this.dialogData.loanDetails.interestRate,
          startDate: this.dialogData.loanDetails.startDate,
          durationMonths: this.dialogData.loanDetails.durationMonths,
          repaymentFrequency: this.dialogData.loanDetails.repaymentFrequency,
          status: this.dialogData.loanDetails.status,
          totalPaid: this.dialogData.loanDetails.totalPaid,
          remainingBalance: this.dialogData.loanDetails.remainingBalance,
          nextDueDate: this.dialogData.loanDetails.nextDueDate,
          showReminder: this.dialogData.loanDetails.showReminder,
        }),
      });
    }

    // Update balance when loan amount changes
    this.accountForm.get('loanAmount')?.valueChanges.subscribe(value => {
      if (this.accountForm.get('type')?.value === 'loan') {
        this.accountForm.patchValue({ balance: -value }, { emitEvent: false });
      }
    });

    // Add/remove validation for loan fields based on account type
    this.accountForm.get('type')?.valueChanges.subscribe(type => {
      const lenderNameControl = this.accountForm.get('lenderName');
      const loanAmountControl = this.accountForm.get('loanAmount');
      const interestRateControl = this.accountForm.get('interestRate');
      const durationMonthsControl = this.accountForm.get('durationMonths');
      const nextDueDateControl = this.accountForm.get('nextDueDate');

      if (type === 'loan') {
        lenderNameControl?.setValidators([Validators.required]);
        loanAmountControl?.setValidators([Validators.required, Validators.min(0), Validators.max(999999)]);
        interestRateControl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
        durationMonthsControl?.setValidators([Validators.required, Validators.min(1), Validators.max(600)]);
        nextDueDateControl?.setValidators([Validators.required]);
      } else {
        lenderNameControl?.clearValidators();
        loanAmountControl?.clearValidators();
        interestRateControl?.clearValidators();
        durationMonthsControl?.clearValidators();
        nextDueDateControl?.clearValidators();
      }

      lenderNameControl?.updateValueAndValidity();
      loanAmountControl?.updateValueAndValidity();
      interestRateControl?.updateValueAndValidity();
      durationMonthsControl?.updateValueAndValidity();
      nextDueDateControl?.updateValueAndValidity();
    });

    // Update remaining balance when loan amount or total paid changes
    this.accountForm.get('loanAmount')?.valueChanges.subscribe(loanAmount => {
      const totalPaid = this.accountForm.get('totalPaid')?.value || 0;
      this.accountForm.patchValue({ 
        remainingBalance: Math.max(0, loanAmount - totalPaid) 
      }, { emitEvent: false });
    });

    this.accountForm.get('totalPaid')?.valueChanges.subscribe(totalPaid => {
      const loanAmount = this.accountForm.get('loanAmount')?.value || 0;
      this.accountForm.patchValue({ 
        remainingBalance: Math.max(0, loanAmount - totalPaid) 
      }, { emitEvent: false });
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
    if (this.accountForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      try {
        const formData = this.accountForm.value;
        const isLoanAccount = formData.type === 'loan';

        // Prepare account data
        const accountData: any = {
          name: formData.name.trim(),
          type: formData.type,
          balance: Number(formData.balance),
        };

        // Add loan details if it's a loan account
        if (isLoanAccount) {
          accountData.loanDetails = {
            lenderName: formData.lenderName.trim(),
            loanAmount: Number(formData.loanAmount) || 0,
            interestRate: Number(formData.interestRate) || 0,
            startDate: formData.startDate,
            durationMonths: Number(formData.durationMonths) || 12,
            repaymentFrequency: formData.repaymentFrequency,
            status: formData.status,
            totalPaid: Number(formData.totalPaid) || 0,
            remainingBalance: Number(formData.remainingBalance) || 0,
            nextDueDate: formData.nextDueDate,
            showReminder: formData.showReminder,
          };
        }

        if (this.dialogData?.accountId) {
          // Update existing account
          await this.store.dispatch(
            updateAccount({
              userId: this.userId,
              accountId: this.dialogData.accountId,
              accountData,
            })
          );
          this.notificationService.success('Account updated successfully');
        } else {
          // Create new account
          await this.store.dispatch(
            createAccount({
              userId: this.userId,
              accountData,
            })
          );
          this.notificationService.success('Account added successfully');
          this.hapticFeedback.successVibration();
        }

        this.dialogRef.close(true);
        this.router.navigate(['/dashboard/accounts']);
      } catch (error) {
        this.notificationService.error('Failed to save account');
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getNameError(): string {
    const nameControl = this.accountForm.get('name');
    if (nameControl?.hasError('required')) {
      return 'Account name is required';
    }
    if (nameControl?.hasError('maxlength')) {
      return 'Account name must be less than 50 characters';
    }
    return '';
  }

  getBalanceError(): string {
    const balanceControl = this.accountForm.get('balance');
    if (balanceControl?.hasError('required')) {
      return 'Balance is required';
    }
    if (balanceControl?.hasError('min')) {
      return 'Balance must be at least -999,999';
    }
    if (balanceControl?.hasError('max')) {
      return 'Balance must be less than 999,999';
    }
    return '';
  }

  /**
   * Check if current account type is loan
   */
  isLoanAccount(): boolean {
    return this.accountForm.get('type')?.value === 'loan';
  }

  /**
   * Get error message for loan amount
   */
  getLoanAmountError(): string {
    const control = this.accountForm.get('loanAmount');
    if (control?.hasError('min')) {
      return 'Loan amount must be positive';
    }
    if (control?.hasError('max')) {
      return 'Loan amount must be less than 999,999';
    }
    return '';
  }

  /**
   * Get error message for interest rate
   */
  getInterestRateError(): string {
    const control = this.accountForm.get('interestRate');
    if (control?.hasError('min')) {
      return 'Interest rate must be positive';
    }
    if (control?.hasError('max')) {
      return 'Interest rate must be less than 100%';
    }
    return '';
  }

  /**
   * Get error message for duration
   */
  getDurationError(): string {
    const control = this.accountForm.get('durationMonths');
    if (control?.hasError('min')) {
      return 'Duration must be at least 1 month';
    }
    if (control?.hasError('max')) {
      return 'Duration must be less than 50 years';
    }
    return '';
  }
}
