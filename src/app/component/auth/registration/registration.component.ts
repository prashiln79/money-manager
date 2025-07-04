import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormArray } from "@angular/forms";
import { Router } from "@angular/router";
import { NotificationService } from "src/app/util/service/notification.service";
import { User, UserService } from "src/app/util/service/user.service";
import { CategoryService } from "src/app/util/service/category.service";
import { AccountsService } from "src/app/util/service/accounts.service";

interface BankAccount {
	id?: string;
	name: string;
	type: "checking" | "savings" | "credit" | "investment";
	balance: number;
	currency: string;
	institution: string;
	accountNumber?: string;
}

interface Category {
	id?: string;
	name: string;
	type: "income" | "expense";
	color: string;
	icon: string;
}

@Component({
	selector: "app-registration",
	templateUrl: "./registration.component.html",
	styleUrls: ["./registration.component.scss"],
})
export class RegistrationComponent implements OnInit {
	registrationForm: FormGroup;
	isLoading = false;
	currentStep = 1;
	totalSteps = 4;
	currentUser: any;

	// Predefined categories for new users
	defaultCategories: Category[] = [
		{ name: "Salary", type: "income", color: "#4CAF50", icon: "work" },
		{ name: "Freelance", type: "income", color: "#2196F3", icon: "computer" },
		{ name: "Investment", type: "income", color: "#FF9800", icon: "trending_up" },
		{ name: "Food & Dining", type: "expense", color: "#F44336", icon: "restaurant" },
		{ name: "Transportation", type: "expense", color: "#9C27B0", icon: "directions_car" },
		{ name: "Shopping", type: "expense", color: "#E91E63", icon: "shopping_cart" },
		{ name: "Bills & Utilities", type: "expense", color: "#607D8B", icon: "receipt" },
		{ name: "Healthcare", type: "expense", color: "#00BCD4", icon: "local_hospital" },
		{ name: "Entertainment", type: "expense", color: "#FF5722", icon: "movie" },
		{ name: "Education", type: "expense", color: "#3F51B5", icon: "school" },
	];

	// Predefined bank account types
	accountTypes = [
		{ value: "checking", label: "Checking Account", icon: "account_balance" },
		{ value: "savings", label: "Savings Account", icon: "savings" },
		{ value: "credit", label: "Credit Card", icon: "credit_card" },
		{ value: "investment", label: "Investment Account", icon: "trending_up" },
	];

	currencies = [
		{ code: "USD", symbol: "$", name: "US Dollar" },
		{ code: "EUR", symbol: "€", name: "Euro" },
		{ code: "GBP", symbol: "£", name: "British Pound" },
		{ code: "JPY", symbol: "¥", name: "Japanese Yen" },
		{ code: "CAD", symbol: "C$", name: "Canadian Dollar" },
		{ code: "AUD", symbol: "A$", name: "Australian Dollar" },
		{ code: "INR", symbol: "₹", name: "Indian Rupee" },
	];

	constructor(
		private fb: FormBuilder,
		private router: Router,
		private userService: UserService,
		private categoryService: CategoryService,
		private accountsService: AccountsService,
		private notificationService: NotificationService
	) {
		this.registrationForm = this.fb.group({
			// Step 1: Basic Profile
			profile: this.fb.group(
				{
					firstName: ["", [Validators.required, Validators.minLength(2)]],
					lastName: ["", [Validators.required, Validators.minLength(2)]],
					email: ["", [Validators.required, Validators.email]],
					phone: ["", [Validators.pattern(/^\+?[\d\s-()]+$/)]],
					dateOfBirth: [""],
					occupation: [""],
					monthlyIncome: [0, [Validators.min(0)]],
				},
			),

			// Step 2: Bank Accounts
			bankAccounts: this.fb.array([]),

			// Step 3: Categories
			categories: this.fb.array([]),

			// Step 4: Preferences
			preferences: this.fb.group({
				defaultCurrency: ["USD", Validators.required],
				timezone: ["UTC", Validators.required],
				language: ["en", Validators.required],
				notifications: [true],
				emailUpdates: [true],
				budgetAlerts: [true],
			}),
		});
	}

	ngOnInit() {
		this.initializeDefaultData();
	}

	private initializeDefaultData() {
		//get from googgle token
		this.currentUser = this.userService.getUser();
		if (this.currentUser) {
			this.registrationForm.get("profile.email")?.setValue(this.currentUser?.email);
			this.registrationForm.get("profile.firstName")?.setValue(this.currentUser?.displayName);
			this.registrationForm.get("profile.email")?.disable();
			// Add a default bank account
			this.addBankAccount();

			// Add default categories
			this.defaultCategories.forEach((category) => {
				this.addCategory(category);
			});
		} else {
			this.router.navigate(["/sign-in"]);
		}
	}

	// Form Array Getters
	get bankAccountsArray() {
		return this.registrationForm.get("bankAccounts") as FormArray;
	}

	get categoriesArray() {
		return this.registrationForm.get("categories") as FormArray;
	}


	// Bank Account Methods
	addBankAccount(account?: BankAccount) {
		const bankAccountForm = this.fb.group({
			name: [account?.name || "", Validators.required],
			type: [account?.type || "checking", Validators.required],
			balance: [account?.balance || 0, [Validators.required, Validators.min(0)]],
			currency: [account?.currency || "USD", Validators.required],
		});

		this.bankAccountsArray.push(bankAccountForm);
	}

	removeBankAccount(index: number) {
		if (this.bankAccountsArray.length > 1) {
			this.bankAccountsArray.removeAt(index);
		}
	}

	// Category Methods
	addCategory(category?: Category) {
		const categoryForm = this.fb.group({
			name: [category?.name || "", Validators.required],
			type: [category?.type || "expense", Validators.required],
			color: [category?.color || "#2196F3", Validators.required],
			icon: [category?.icon || "category", Validators.required],
		});

		this.categoriesArray.push(categoryForm);
	}

	removeCategory(index: number) {
		if (this.categoriesArray.length > 1) {
			this.categoriesArray.removeAt(index);
		}
	}

	// Navigation Methods
	nextStep() {
		if (this.currentStep < this.totalSteps) {
			this.currentStep++;
		}
	}

	previousStep() {
		if (this.currentStep > 1) {
			this.currentStep--;
		}
	}

	// Step Validation
	isStepValid(step: number): boolean {
		switch (step) {
			case 1:
				return this.registrationForm.get("profile")?.valid || false;
			case 2:
				return this.bankAccountsArray.valid && this.bankAccountsArray.length > 0;
			case 3:
				return this.categoriesArray.valid && this.categoriesArray.length > 0;
			case 4:
				return this.registrationForm.get("preferences")?.valid || false;
			default:
				return false;
		}
	}

	// Registration
	async onRegister() {
		if (this.registrationForm.valid) {
			this.isLoading = true;

			try {
				const formValue = this.registrationForm.value;

				// 1. get user account
				const user: any = this.currentUser;

				// 2. Create user profile in Firestore
				const userProfile = {
					uid: user?.uid,
					firstName: formValue.profile.firstName,
					lastName: formValue.profile.lastName,
					phone: formValue.profile.phone,
					dateOfBirth: formValue.profile.dateOfBirth,
					occupation: formValue.profile.occupation,
					monthlyIncome: formValue.profile.monthlyIncome,
					preferences: formValue.preferences,
					createdAt: new Date(),
				};

				await this.userService.createOrUpdateUser((userProfile as unknown) as User);

				// 3. Create bank accounts
				for (const account of formValue.bankAccounts) {
					await this.accountsService.createAccount(user?.uid, account);
				}

				// 4. Create categories
				for (const category of formValue.categories) {
					await this.categoryService.createCategory(user?.uid, category.name, category.type);
				}

				this.notificationService.success("Registration successful! Welcome to Money Manager.");
				this.router.navigate(["/dashboard"]);
			} catch (error: any) {
				console.error("Registration error:", error);
				this.notificationService.error(error.message || "Registration failed. Please try again.");
			} finally {
				this.isLoading = false;
			}
		} else {
			this.notificationService.error("Please fill all required fields correctly.");
		}
	}

	// Utility Methods
	getStepProgress(): number {
		return (this.currentStep / this.totalSteps) * 100;
	}

	getStepTitle(step: number): string {
		const titles = {
			1: "Profile Information",
			2: "Bank Accounts",
			3: "Categories",
			4: "Preferences",
		};
		return titles[step as keyof typeof titles] || "";
	}
}
