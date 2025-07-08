import { Timestamp } from "firebase/firestore";
import { AccountType, SyncStatus } from "./enums";

/**
 * Account interface representing a financial account in the system
 */
export interface Account {
	accountId: string;
	userId: string;
	name: string;
	type: AccountType;
	balance: number;
	createdAt: Timestamp;
	updatedAt?: Timestamp;
	description?: string;
	accountNumber?: string;
	institution?: string;
	currency?: string;
	isActive?: boolean;
	lastSyncAt?: Timestamp;
	syncStatus?: SyncStatus;
}

/**
 * Account creation interface for creating new accounts
 */
export interface CreateAccountRequest {
	name: string;
	type: AccountType;
	balance: number;
	description?: string;
	accountNumber?: string;
	institution?: string;
	currency?: string;
}

/**
 * Account update interface for updating existing accounts
 */
export interface UpdateAccountRequest {
	name?: string;
	type?: AccountType;
	balance?: number;
	description?: string;
	accountNumber?: string;
	institution?: string;
	currency?: string;
	isActive?: boolean;
} 