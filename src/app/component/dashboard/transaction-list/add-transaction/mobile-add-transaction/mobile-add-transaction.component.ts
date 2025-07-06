import { Component, Inject, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Timestamp } from "@angular/fire/firestore";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { AccountsService } from "src/app/util/service/accounts.service";
import { CategoryService } from "src/app/util/service/category.service";
import { HapticFeedbackService } from "src/app/util/service/haptic-feedback.service";
import { NotificationService } from "src/app/util/service/notification.service";
import { Transaction, TransactionsService } from "src/app/util/service/transactions.service";
import { AccountDialogComponent } from "src/app/component/dashboard/accounts/account-dialog/account-dialog.component";
import moment from 'moment';
import { LoaderService } from "src/app/util/service/loader.service";

@Component({
	selector: "app-mobile-add-transaction",
	templateUrl: "./mobile-add-transaction.component.html",
	styleUrl: "./mobile-add-transaction.component.scss",
})
export class MobileAddTransactionComponent implements AfterViewInit {
	@ViewChild('amountInput', { static: false }) amountInput!: ElementRef;
	
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
		private dialog: MatDialog,
		private loaderService: LoaderService
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
					date: moment(this.dialogData.date.toDate()).format('YYYY-MM-DD'),
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
		const dialogRef = this.dialog.open(AccountDialogComponent, {
			width: '90vw',
			maxWidth: '400px',
			data: null, // null for new account
			disableClose: true,
			panelClass: 'mobile-dialog'
		});

		dialogRef.afterClosed().subscribe((result) => {
			if (result) {
				this.refreshAccountList();
			}
		});
	}

	openEditAccountDialog(account: any): void {
		const dialogRef = this.dialog.open(AccountDialogComponent, {
			width: '90vw',
			maxWidth: '400px',
			data: account, // existing account data
			disableClose: true,
			panelClass: 'mobile-dialog'
		});

		dialogRef.afterClosed().subscribe((result) => {
			if (result) {
				this.refreshAccountList();
			}
		});
	}

	private refreshAccountList(): void {
		this.accountsService.getAccounts(this.auth.currentUser?.uid || "").subscribe((resp) => {
			this.accountList = resp;
			// If no account is selected and we have accounts, select the first one
			if (!this.transactionForm.get('accountId')?.value && this.accountList.length > 0) {
				this.transactionForm.patchValue({
					accountId: this.accountList[0].accountId
				});
			}
		});
	}
} 