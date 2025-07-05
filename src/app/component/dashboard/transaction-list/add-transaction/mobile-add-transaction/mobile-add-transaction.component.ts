import { Component, Inject } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Timestamp } from "@angular/fire/firestore";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { AccountsService } from "src/app/util/service/accounts.service";
import { CategoryService } from "src/app/util/service/category.service";
import { HapticFeedbackService } from "src/app/util/service/haptic-feedback.service";
import { NotificationService } from "src/app/util/service/notification.service";
import { Transaction, TransactionsService } from "src/app/util/service/transactions.service";
import moment from 'moment';

@Component({
	selector: "app-mobile-add-transaction",
	templateUrl: "./mobile-add-transaction.component.html",
	styleUrl: "./mobile-add-transaction.component.scss",
})
export class MobileAddTransactionComponent {
	transactionForm: FormGroup;
	public tagList: Array<any> = [];
	public accountList: Array<any> = [];
	public typeList: string[] = ["income", "expense"];
	public userId: any;
	public isSubmitting = false;

	constructor(
		@Inject(MAT_DIALOG_DATA) public dialogData: any,
		private categoryService: CategoryService,
		private accountsService: AccountsService,
		private transactionsService: TransactionsService,
		private fb: FormBuilder,
		public dialogRef: MatDialogRef<MobileAddTransactionComponent>,
		private auth: Auth,
		private notificationService: NotificationService,
		private router: Router,
		private hapticFeedback: HapticFeedbackService,
	) {
		this.transactionForm = this.fb.group({
			payee: ["", Validators.required],
			amount: ["", [Validators.required, Validators.min(0.01)]],
			date: [moment().format('YYYY-MM-DD'), Validators.required],
			description: [""],
			tag: [""],
			type: ["expense"],
			accountId: ["", Validators.required],
		});

		this.categoryService.getCategories(this.auth.currentUser?.uid || "").subscribe((resp) => {
			this.tagList = resp;
		});

		this.accountsService.getAccounts(this.auth.currentUser?.uid || "").subscribe((resp) => {
			this.accountList = resp;
			if (this.dialogData?.id) {
				this.transactionForm.patchValue({
					payee: this.dialogData.payee,
					amount: this.dialogData.amount,
					date: this.dialogData.date.toDate(),
					description: this.dialogData.notes,
					tag: this.dialogData.category,
					type: this.dialogData.type,
					accountId: this.dialogData.accountId,
				});
			} else {
				this.transactionForm.patchValue({
					tag: this.tagList.length > 0 ? this.tagList[0].name : "",
					accountId: this.accountList.length > 0 ? this.accountList[0].accountId : "",
				});
			}
		});
	}

	ngOnInit(): void {
		this.userId = this.auth.currentUser?.uid;
		window.addEventListener("popstate", (event) => {
			this.dialogRef.close();
			event.preventDefault();
		});
	}

	async onSubmit(): Promise<void> {
		if (this.transactionForm.valid && !this.isSubmitting) {
			this.isSubmitting = true;
			
			try {
				if (this.dialogData?.id) {
					await this.transactionsService.updateTransaction(this.userId, this.dialogData.id, {
						payee: this.transactionForm.get("payee")?.value,
						userId: this.userId,
						accountId: this.transactionForm.get("accountId")?.value,
						amount: this.transactionForm.get("amount")?.value,
						category: this.transactionForm.get("tag")?.value,
						type: this.transactionForm.get("type")?.value,
						date: Timestamp.fromDate(moment(this.transactionForm.get("date")?.value).toDate()),
						notes: this.transactionForm.get("description")?.value,
					});
					this.notificationService.success("Transaction updated successfully");
				} else {
					await this.transactionsService.createTransaction(this.userId, {
						payee: this.transactionForm.get("payee")?.value,
						userId: this.userId,
						accountId: this.transactionForm.get("accountId")?.value,
						amount: this.transactionForm.get("amount")?.value,
						category: this.transactionForm.get("tag")?.value,
						type: this.transactionForm.get("type")?.value,
						date: Timestamp.fromDate(moment(this.transactionForm.get("date")?.value).toDate()),
						notes: this.transactionForm.get("description")?.value,
					});
					this.notificationService.success("Transaction added successfully");
					this.hapticFeedback.successVibration();
				}

				this.dialogRef.close(true);
				this.router.navigate(["/dashboard/transactions"]);
			} catch (error) {
				this.notificationService.error("Failed to save transaction");
			} finally {
				this.isSubmitting = false;
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
} 