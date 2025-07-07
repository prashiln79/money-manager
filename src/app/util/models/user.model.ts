import { Timestamp } from "firebase/firestore";

/**
 * User role types
 */
export type UserRole = "free" | "premium" | "admin";

/**
 * User preferences interface
 */
export interface UserPreferences {
	defaultCurrency: string;
	timezone: string;
	language: string;
	notifications: boolean;
	emailUpdates: boolean;
	budgetAlerts: boolean;
}

/**
 * User interface representing a user in the system
 */
export interface User {
	uid: string;
	name: string;
	email: string;
	role: UserRole;
	createdAt: Timestamp;
	firstName?: string;
	lastName?: string;
	phone?: string;
	dateOfBirth?: Timestamp;
	occupation?: string;
	monthlyIncome?: number;
	preferences?: UserPreferences;
	updatedAt?: Timestamp;
}

/**
 * Firebase Auth error interface for better error handling
 */
export interface FirebaseAuthError {
	code: string;
	message: string;
} 