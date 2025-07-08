import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  UserCredential,
  onAuthStateChanged,
  getAuth,
  GoogleAuthProvider,
  updateProfile,
  signInWithPopup,
  user,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { defaultBankAccounts } from 'src/app/component/auth/registration/registration.component';
import { NotificationService } from './notification.service';
import {
  User,
  FirebaseAuthError,
  defaultCategoriesForNewUser,
} from '../models';
import { Timestamp } from 'firebase/firestore';
import { AppState } from 'src/app/store/app.state';
import { Store } from '@ngrx/store';
import { createAccount } from 'src/app/store/accounts/accounts.actions';
import { createCategory } from 'src/app/store/categories/categories.actions';
import { AccountType } from '../models/enums';

/**
 * Service responsible for user authentication and management
 * Handles sign up, sign in, sign out, and user data caching
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly userSubject = new BehaviorSubject<any>(null);
  public readonly user$ = this.userSubject.asObservable();

  constructor(
    private readonly notificationService: NotificationService,
    private readonly auth: Auth,
    private readonly router: Router,
    private readonly afAuth: Auth,
    private readonly firestore: Firestore,
    private readonly store: Store<AppState>
  ) {
    this.initializeAuthState();
  }

  /**
   * Initialize authentication state listener
   * Monitors user login/logout and caches user data
   */
  private initializeAuthState(): void {
    onAuthStateChanged(getAuth(), (user) => {
      console.log(
        'Auth state changed:',
        user ? 'User logged in' : 'User logged out'
      );
      this.userSubject.next(user);

      if (user) {
        this.ensureUserDataCached(user.uid);
      }
    });
  }

  /**
   * Cache user data for offline access
   * @param uid - User ID
   */
  private async ensureUserDataCached(uid: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, `users/${uid}`);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        localStorage.setItem(`user-data-${uid}`, JSON.stringify(userData));
        console.log('User data cached for offline access');
      }
    } catch (error) {
      console.error('Failed to cache user data:', error);
    }
  }

  /**
   * Create a new user account with email and password
   * @param email - User email
   * @param password - User password
   * @param name - User display name
   * @returns Promise<UserCredential>
   */
  async signUp(
    email: string,
    password: string,
    name: string
  ): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });

        const newUser: User = {
          uid: userCredential.user.uid,
          firstName: name,
          lastName: '',
          email,
          role: 'free',
          createdAt: new Date(),
        };

        await this.createUserInFirestore(userCredential.user.uid, newUser);
      }

      return userCredential;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  /**
   * Sign in user with email and password
   * @param email - User email
   * @param password - User password
   * @returns Promise<UserCredential>
   */
  async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      if (userCredential.user) {
        await this.ensureUserDataCached(userCredential.user.uid);
      }

      return userCredential;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  /**
   * Get current user from BehaviorSubject
   * @returns Current user or null
   */
  public getUser() {
    return this.userSubject.value;
  }

  /**
   * Sign out current user and clear cached data
   */
  async signOut(): Promise<void> {
    try {
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        localStorage.removeItem(`user-data-${currentUser.uid}`);
      }

      await signOut(this.auth);
      console.log('User signed out');
      this.router.navigate(['/sign-in']);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Sign in user with Google authentication
   * Creates new user account if user doesn't exist
   */
  public async signInWithGoogle(): Promise<void> {
    try {
      console.log('🔐 Starting Google sign-in process...');

      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      console.log('📱 Opening Google sign-in popup...');
      const result = await signInWithPopup(this.auth, provider);
      console.log('✅ Google sign-in successful:', result.user);

      await this.handleGoogleSignInResult(result);
    } catch (error) {
      this.handleGoogleSignInError(error);
      throw error;
    }
  }

  /**
   * Handle successful Google sign-in result
   * @param result - Google sign-in result
   */
  private async handleGoogleSignInResult(
    result: UserCredential
  ): Promise<void> {
    const userRef = doc(this.firestore, `users/${result.user.uid}`);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await this.createNewGoogleUser(result.user);
    } else {
      await this.handleExistingGoogleUser(result.user, userSnap);
    }
    this.router.navigate(['/dashboard']);
  }

  /**
   * Create new user account for Google sign-in
   * @param firebaseUser - Firebase user object
   */
  private async createNewGoogleUser(firebaseUser: any): Promise<void> {
    console.log('📝 Creating new user in Firestore...');

    const newUser: User = {
      uid: firebaseUser.uid,
      firstName: firebaseUser.displayName || '',
      lastName:  '',
      email: firebaseUser.email || '',
      role: 'free',
      createdAt: new Date(),
    };

    await this.createUserInFirestore(firebaseUser.uid, newUser);
    await this.setupDefaultData(firebaseUser.uid);

    console.log('✅ User created in Firestore');
    this.notificationService.success(
      'Registration successful! Welcome to Money Manager.'
    );
  }

  /**
   * Handle existing Google user sign-in
   * @param firebaseUser - Firebase user object
   * @param userSnap - User document snapshot
   */
  private async handleExistingGoogleUser(
    firebaseUser: any,
    userSnap: any
  ): Promise<void> {
    console.log('✅ User already exists in Firestore');

    const userData = userSnap.data();
    localStorage.setItem(
      `user-data-${firebaseUser.uid}`,
      JSON.stringify(userData)
    );
  }

  /**
   * Handle Google sign-in errors with proper typing
   * @param error - Error object
   */
  private handleGoogleSignInError(error: unknown): void {
    console.error('❌ Google sign-in error:', error);

    const authError = error as FirebaseAuthError;

    switch (authError.code) {
      case 'auth/popup-closed-by-user':
        console.log('ℹ️ User closed the popup');
        break;
      case 'auth/popup-blocked':
        console.log('ℹ️ Popup was blocked by browser');
        break;
      case 'auth/cancelled-popup-request':
        console.log('ℹ️ Popup request was cancelled');
        break;
      default:
        console.error(
          '❌ Unexpected error during Google sign-in:',
          authError.message
        );
    }
  }

  /**
   * Create user document in Firestore
   * @param uid - User ID
   * @param userData - User data to store
   */
  private async createUserInFirestore(
    uid: string,
    userData: User
  ): Promise<void> {
    const userRef = doc(this.firestore, `users/${uid}`);
    await setDoc(userRef, userData);
    localStorage.setItem(`user-data-${uid}`, JSON.stringify(userData));
  }

  /**
   * Setup default accounts and categories for new user
   * @param uid - User ID
   */
  private async setupDefaultData(uid: string): Promise<void> {
    // Create default bank accounts
    for (const defaultAccount of defaultBankAccounts) {
      // Map BankAccount type to Account type
      const accountType = this.mapBankAccountType(defaultAccount.type);
      const timestamp = Date.now();

      await this.store.dispatch(
        createAccount({
          userId: uid,
          accountData: {
            name: defaultAccount.name,
            type: accountType,
            balance: defaultAccount.balance,
            description: `${defaultAccount.type} account`,
            institution: defaultAccount.institution,
            currency: defaultAccount.currency,
          },
        })
      );
    }

    // Create default categories
    for (const defaultCategory of defaultCategoriesForNewUser) {

		await this.store.dispatch(
			createCategory({
				userId: uid,
				name: defaultCategory.name,
				categoryType: defaultCategory.type,
				icon: defaultCategory.icon,
				color: defaultCategory.color,
			})
		);
    }
  }

  /**
   * Map BankAccount type to Account type
   * @param bankAccountType - BankAccount type
   * @returns Account type
   */
  private mapBankAccountType(
    bankAccountType: 'checking' | 'savings' | 'credit' | 'investment'
  ): AccountType {
    switch (bankAccountType) {
      case 'checking':
      case 'savings':
        return AccountType.BANK;
      case 'credit':
        return AccountType.CREDIT;
      case 'investment':
        return AccountType.INVESTMENT;
      default:
        return AccountType.BANK;
    }
  }

  /**
   * Create or update user in Firestore
   * @param user - User object to create or update
   */
  async createOrUpdateUser(user: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    await setDoc(userRef, user, { merge: true });
    localStorage.setItem(`user-data-${user.uid}`, JSON.stringify(user));
  }

  /**
   * Get current user data from cache or Firestore
   * @returns Promise<User | null>
   */
  async getCurrentUser(): Promise<User | null> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return null;

    try {
      // Try cache first
      const cachedUserData = localStorage.getItem(
        `user-data-${currentUser.uid}`
      );
      if (cachedUserData) {
        return JSON.parse(cachedUserData) as User;
      }

      // Fallback to Firestore
      const userRef = doc(this.firestore, `users/${currentUser.uid}`);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        localStorage.setItem(
          `user-data-${currentUser.uid}`,
          JSON.stringify(userData)
        );
        return userData;
      }

      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated (for offline scenarios)
   * @returns boolean
   */
  public isAuthenticated(): boolean {
    return this.userSubject.value !== null;
  }

  /**
   * Get cached user data (for offline scenarios)
   * @param uid - User ID
   * @returns User | null
   */
  public getCachedUserData(uid: string): User | null {
    try {
      const cachedData = localStorage.getItem(`user-data-${uid}`);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      console.error('Error getting cached user data:', error);
      return null;
    }
  }

  /**
   * Clear all cached user data from localStorage
   */
  public clearCachedUserData(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('user-data-')) {
        localStorage.removeItem(key);
      }
    });
  }
}
