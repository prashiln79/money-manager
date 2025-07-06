import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Auth } from "@angular/fire/auth";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { UserService } from "src/app/util/service/user.service";
import { User } from "src/app/util/models";
import { NotificationService } from "src/app/util/service/notification.service";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmDialogComponent } from "src/app/util/components/confirm-dialog/confirm-dialog.component";
import moment from "moment";
import { Timestamp } from "firebase/firestore";

interface UserProfile {
	uid: string;
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	dateOfBirth?: Date;
	occupation?: string;
	monthlyIncome?: number;
	preferences: {
		defaultCurrency: string;
		timezone: string;
		language: string;
		notifications: boolean;
		emailUpdates: boolean;
		budgetAlerts: boolean;
	};
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

@Component({
	selector: "app-profile",
	templateUrl: "./profile.component.html",
	styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent implements OnInit, OnDestroy {
	profileForm: FormGroup;
	isLoading = false;
	isEditing = false;
	currentUser: any;
	userProfile: UserProfile | null = null;

	currencies = [
		{ code: "USD", symbol: "$", name: "US Dollar" },
		{ code: "EUR", symbol: "€", name: "Euro" },
		{ code: "GBP", symbol: "£", name: "British Pound" },
		{ code: "JPY", symbol: "¥", name: "Japanese Yen" },
		{ code: "CAD", symbol: "C$", name: "Canadian Dollar" },
		{ code: "AUD", symbol: "A$", name: "Australian Dollar" },
		{ code: "INR", symbol: "₹", name: "Indian Rupee" },
	];

	timezones = [
		{ value: "UTC", label: "UTC (Coordinated Universal Time)" },
		{ value: "America/New_York", label: "Eastern Time (ET)" },
		{ value: "America/Chicago", label: "Central Time (CT)" },
		{ value: "America/Denver", label: "Mountain Time (MT)" },
		{ value: "America/Los_Angeles", label: "Pacific Time (PT)" },
		{ value: "Europe/London", label: "London (GMT)" },
		{ value: "Europe/Paris", label: "Paris (CET)" },
		{ value: "Asia/Tokyo", label: "Tokyo (JST)" },
		{ value: "Asia/Kolkata", label: "Mumbai (IST)" },
		{ value: "Australia/Sydney", label: "Sydney (AEST)" },
	];

	languages = [
		{ code: "en", name: "English" },
		{ code: "es", name: "Español" },
		{ code: "fr", name: "Français" },
		{ code: "de", name: "Deutsch" },
		{ code: "it", name: "Italiano" },
		{ code: "pt", name: "Português" },
		{ code: "ru", name: "Русский" },
		{ code: "ja", name: "日本語" },
		{ code: "ko", name: "한국어" },
		{ code: "zh", name: "中文" },
		{ code: "hi", name: "हिन्दी" },
	];

	private destroy$ = new Subject<void>();

	constructor(private fb: FormBuilder, private auth: Auth, private router: Router, private userService: UserService, private notificationService: NotificationService, private dialog: MatDialog) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[\d\s-()]+$/)]],
      dateOfBirth: [''],
      occupation: ['', [Validators.maxLength(100)]],
      monthlyIncome: [0, [Validators.min(0)]],
      preferences: this.fb.group({
        defaultCurrency: ['USD', Validators.required],
        timezone: ['UTC', Validators.required],
        language: ['en', Validators.required],
        notifications: [true],
        emailUpdates: [true],
        budgetAlerts: [true],
      })
    });
	}

	ngOnInit(): void {
		this.loadUserProfile();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private async loadUserProfile(): Promise<void> {
		try {
			this.isLoading = true;
			this.currentUser = this.auth.currentUser;

			if (!this.currentUser) {
				this.notificationService.error("User not authenticated");
				this.router.navigate(["/sign-in"]);
				return;
			}

			// Load user profile from Firestore or create default
			const userData = await this.userService.getCurrentUser();
			if (userData) {
				this.userProfile = this.mapUserToProfile(userData);
				this.populateForm();
			} else {
				// Create default profile
				this.userProfile = this.createDefaultProfile();
				this.populateForm();
			}
		} catch (error) {
			console.error("Error loading profile:", error);
			this.notificationService.error("Failed to load profile");
		} finally {
			this.isLoading = false;
		}
	}

	private mapUserToProfile(user: User): UserProfile {
		return {
			uid: user.uid,
			firstName: user.name?.split(" ")[0] || "",
			lastName: user.name?.split(" ").slice(1).join(" ") || "",
			email: user.email,
			phone: user.phone || "",
			dateOfBirth: user.dateOfBirth || undefined,
			occupation: user.occupation || "",
			monthlyIncome: user.monthlyIncome || 0,
			preferences: {
				defaultCurrency: user.preferences?.defaultCurrency || "USD",
				timezone: user.preferences?.timezone || "UTC",
				language: user.preferences?.language || "en",
				notifications: user.preferences?.notifications || true,
				emailUpdates: user.preferences?.emailUpdates || true,
				budgetAlerts: user.preferences?.budgetAlerts || true,
			},
			createdAt: user.createdAt,
			updatedAt: user?.updatedAt || Timestamp.now(),
		};
	}

	private createDefaultProfile(): UserProfile {
		return {
			uid: this.currentUser.uid,
			firstName: this.currentUser.displayName?.split(" ")[0] || "",
			lastName: this.currentUser.displayName?.split(" ").slice(1).join(" ") || "",
			email: this.currentUser.email || "",
			phone: "",
			dateOfBirth: undefined,
			occupation: "",
			monthlyIncome: 0,
			preferences: {
				defaultCurrency: "USD",
				timezone: "UTC",
				language: "en",
				notifications: true,
				emailUpdates: true,
				budgetAlerts: true,
			},
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now(),
		};
	}

	private populateForm(): void {
		if (this.userProfile) {
			this.profileForm.patchValue({
				firstName: this.userProfile.firstName,
				lastName: this.userProfile.lastName,
				email: this.userProfile.email,
				phone: this.userProfile.phone || "",
				dateOfBirth: this.userProfile.dateOfBirth || "",
				occupation: this.userProfile.occupation || "",
				monthlyIncome: this.userProfile.monthlyIncome || 0,
				preferences: {
					defaultCurrency: this.userProfile.preferences.defaultCurrency,
					timezone: this.userProfile.preferences.timezone,
					language: this.userProfile.preferences.language,
					notifications: this.userProfile.preferences.notifications,
					emailUpdates: this.userProfile.preferences.emailUpdates,
					budgetAlerts: this.userProfile.preferences.budgetAlerts,
				},
			});
		}
	}

	toggleEdit(): void {
		this.isEditing = !this.isEditing;
		if (this.isEditing) {
			this.notificationService.info("Edit mode enabled");
		} else {
			this.notificationService.info("Edit mode disabled");
		}
	}

	async saveProfile(): Promise<void> {
		if (this.profileForm.invalid) {
			this.notificationService.warning("Please fill in all required fields correctly");
			return;
		}

		try {
			this.isLoading = true;
			const formValue = this.profileForm.value;

			if (this.userProfile) {
				await this.userService.createOrUpdateUser({
					uid: this.userProfile.uid,
					name: `${formValue.firstName} ${formValue.lastName}`.trim(),
					email: formValue.email,
					role: "free", // Keep existing role
					createdAt: this.userProfile.createdAt,
					preferences: formValue.preferences,
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          phone: formValue.phone,
          dateOfBirth: formValue.dateOfBirth,
          occupation: formValue.occupation,
          monthlyIncome: formValue.monthlyIncome,
          updatedAt: Timestamp.now(),
				});

				this.notificationService.success("Profile updated successfully");
				this.isEditing = false;
			}
		} catch (error) {
			console.error("Error saving profile:", error);
			this.notificationService.error("Failed to save profile");
		} finally {
			this.isLoading = false;
		}
	}

	cancelEdit(): void {
		this.populateForm();
		this.isEditing = false;
		this.notificationService.info("Changes cancelled");
	}

	async deleteAccount(): Promise<void> {
		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			width: "400px",
			data: {
				title: "Delete Account",
				message: "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.",
				confirmText: "Delete Account",
				cancelText: "Cancel",
				confirmColor: "warn",
			},
		});

		dialogRef.afterClosed().subscribe(async (result) => {
			if (result) {
				try {
					this.isLoading = true;
					// Delete user account from Firebase Auth
					await this.currentUser.delete();
					this.notificationService.success("Account deleted successfully");
					this.router.navigate(["/sign-in"]);
				} catch (error) {
					console.error("Error deleting account:", error);
					this.notificationService.error("Failed to delete account");
				} finally {
					this.isLoading = false;
				}
			}
		});
	}

	async changePassword(): Promise<void> {
		this.notificationService.info("Password change feature coming soon");
	}

	async exportData(): Promise<void> {
		try {
			// TODO: Implement data export functionality
			this.notificationService.info("Data export feature coming soon");
		} catch (error) {
			console.error("Error exporting data:", error);
			this.notificationService.error("Failed to export data");
		}
	}

	getFullName(): string {
		if (this.userProfile) {
			return `${this.userProfile.firstName} ${this.userProfile.lastName}`.trim();
		}
		return "User";
	}

	getCurrencySymbol(currencyCode: string): string {
		const currency = this.currencies.find((c) => c.code === currencyCode);
		return currency ? currency.symbol : "$";
	}

	getTimezoneLabel(timezoneValue: string): string {
		const timezone = this.timezones.find((t) => t.value === timezoneValue);
		return timezone ? timezone.label : timezoneValue;
	}

	getLanguageName(languageCode: string): string {
		const language = this.languages.find((l) => l.code === languageCode);
		return language ? language.name : languageCode;
	}

	getFormattedDate(date: any): string {
    if (!date) {
      return "N/A";
    }
		return moment(date?.seconds*1000).format("MMM DD, YYYY");
	}

	getFormattedIncome(income: number): string {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: this.userProfile?.preferences.defaultCurrency || "USD",
		}).format(income);
	}
}
