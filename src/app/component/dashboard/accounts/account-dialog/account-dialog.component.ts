import { Component, Inject } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { HapticFeedbackService } from "src/app/util/service/haptic-feedback.service";
import { NotificationService } from "src/app/util/service/notification.service";
import { Account } from "src/app/util/models/account.model";
import { AccountsService } from "src/app/util/service/accounts.service";

@Component({
	selector: "app-account-dialog",
	templateUrl: "./account-dialog.component.html",
	styleUrl: "./account-dialog.component.scss",
})
export class AccountDialogComponent {
	accountForm: FormGroup;
	public userId: any;
	public isSubmitting = false;
	public accountTypes = [
		{ value: 'bank', label: 'Bank Account' },
		{ value: 'cash', label: 'Cash' },
		{ value: 'credit', label: 'Credit Card' },
		{ value: 'loan', label: 'Loan' }
	];

	constructor(
		@Inject(MAT_DIALOG_DATA) public dialogData: Account | null,
		private accountsService: AccountsService,
		private fb: FormBuilder,
		public dialogRef: MatDialogRef<AccountDialogComponent>,
		private auth: Auth,
		private notificationService: NotificationService,
		private router: Router,
		private hapticFeedback: HapticFeedbackService,
	) {
		this.accountForm = this.fb.group({
			name: ["", [Validators.required, Validators.maxLength(50)]],
			type: ["bank", Validators.required],
			balance: ["", [Validators.required, Validators.min(-999999), Validators.max(999999)]],
			description: [""],
		});

		// If editing, populate form with existing data
		if (this.dialogData) {
			this.accountForm.patchValue({
				name: this.dialogData.name,
				type: this.dialogData.type,
				balance: this.dialogData.balance,
				description: this.dialogData.description,
			});
		}
	}

	ngOnInit(): void {
		this.userId = this.auth.currentUser?.uid;
	}

	async onSubmit(): Promise<void> {
		if (this.accountForm.valid && !this.isSubmitting) {
			this.isSubmitting = true;
			
			try {
				const formData = this.accountForm.value;
				
				if (this.dialogData?.accountId) {
					// Update existing account
					await this.accountsService.updateAccount(this.userId, this.dialogData.accountId, {
						name: formData.name.trim(),
						type: formData.type,
						balance: Number(formData.balance),
						description: formData.description,
					});
					this.notificationService.success("Account updated successfully");
				} else {
					// Create new account
					const timestamp = Date.now();
					await this.accountsService.createAccount(this.userId, {
						name: formData.name.trim(),
						type: formData.type,
						balance: Number(formData.balance),
						description: formData.description,
					});
					this.notificationService.success("Account added successfully");
					this.hapticFeedback.successVibration();
				}

				this.dialogRef.close(true);
			} catch (error) {
				this.notificationService.error("Failed to save account");
				console.error("Error saving account:", error);
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