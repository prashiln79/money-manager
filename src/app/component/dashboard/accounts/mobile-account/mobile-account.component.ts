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
    });

    // If editing, populate form with existing data
    if (this.dialogData) {
      this.accountForm.patchValue({
        name: this.dialogData.name,
        type: this.dialogData.type,
        balance: this.dialogData.balance,
      });
    }
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

        if (this.dialogData?.accountId) {
          // Update existing account
          await this.store.dispatch(
            updateAccount({
              userId: this.userId,
              accountId: this.dialogData.accountId,
              accountData: {
                name: formData.name.trim(),
                type: formData.type,
                balance: Number(formData.balance),
              },
            })
          );
          this.notificationService.success('Account updated successfully');
        } else {
          // Create new account
          await this.store.dispatch(
            createAccount({
              userId: this.userId,
              accountData: {
                name: formData.name.trim(),
                type: formData.type,
                balance: Number(formData.balance),
              },
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
}
