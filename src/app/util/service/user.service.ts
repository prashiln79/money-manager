import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, UserCredential, onAuthStateChanged, getAuth, GoogleAuthProvider, updateProfile, signInWithPopup } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, updateDoc } from '@angular/fire/firestore';


import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'free' | 'premium' | 'admin';
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(private auth: Auth, private router: Router, private afAuth: Auth, private firestore: Firestore) {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    // Listen for auth state changes
    onAuthStateChanged(getAuth(), (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      this.userSubject.next(user);
      
      // If user is logged in, ensure their data is properly cached
      if (user) {
        this.ensureUserDataCached(user.uid);
      }
    });
  }

  private async ensureUserDataCached(uid: string): Promise<void> {
    try {
      // Check if user data is already cached
      const userRef = doc(this.firestore, `users/${uid}`);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        // Cache user data for offline access
        const userData = userSnap.data();
        localStorage.setItem(`user-data-${uid}`, JSON.stringify(userData));
        console.log('User data cached for offline access');
      }
    } catch (error) {
      console.error('Failed to cache user data:', error);
    }
  }

  async signUp(email: string, password: string, name: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });

        // Create user in Firestore
        const userRef = doc(this.firestore, `users/${userCredential.user.uid}`);
        const newUser: User = {
          uid: userCredential.user.uid,
          name,
          email,
          role: 'free', // Default role
          createdAt: new Date(),
        };
        await setDoc(userRef, newUser);
        
        // Cache user data immediately
        localStorage.setItem(`user-data-${userCredential.user.uid}`, JSON.stringify(newUser));
      }

      return userCredential;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  }

  // Sign In
  async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      
      // Cache user data after successful sign in
      if (userCredential.user) {
        await this.ensureUserDataCached(userCredential.user.uid);
      }
      
      return userCredential;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  }

  public getUser() {
    return this.userSubject.value;
  }

  async signOut(): Promise<void> {
    try {
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        // Clear cached user data on sign out
        localStorage.removeItem(`user-data-${currentUser.uid}`);
      }
      
      await signOut(this.auth);
      console.log("User signed out");
      this.router.navigate(['/sign-in']);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }

  public async signInWithGoogle() {
    try {
      console.log('🔐 Starting Google sign-in process...');
      
      const provider = new GoogleAuthProvider();
      
      // Add scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      console.log('📱 Opening Google sign-in popup...');
      
      const result = await signInWithPopup(this.auth, provider);
      
      console.log('✅ Google sign-in successful:', result.user);
      
      // Check if user exists in Firestore, if not create them
      const userRef = doc(this.firestore, `users/${result.user.uid}`);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log('📝 Creating new user in Firestore...');
        const newUser: User = {
          uid: result.user.uid,
          name: result.user.displayName || 'Unknown User',
          email: result.user.email || '',
          role: 'free',
          createdAt: new Date(),
        };
        await setDoc(userRef, newUser);
        
        // Cache user data
        localStorage.setItem(`user-data-${result.user.uid}`, JSON.stringify(newUser));
        
        this.router.navigate(['/register']);
        console.log('✅ User created in Firestore');
      } else {
        console.log('✅ User already exists in Firestore');
        
        // Cache existing user data
        const userData = userSnap.data();
        localStorage.setItem(`user-data-${result.user.uid}`, JSON.stringify(userData));
        
        this.router.navigate(['/dashboard']);
      }
      
      // Navigate to dashboard
      console.log('🚀 Navigating to dashboard...');
      
      
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('ℹ️ User closed the popup');
        // You might want to show a user-friendly message here
      } else if (error.code === 'auth/popup-blocked') {
        console.log('ℹ️ Popup was blocked by browser');
        // You might want to show instructions to allow popups
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log('ℹ️ Popup request was cancelled');
      } else {
        console.error('❌ Unexpected error during Google sign-in:', error.message);
      }
      
      // Re-throw the error so the component can handle it
      throw error;
    }
  }

  //Create or update a user
  async createOrUpdateUser(user: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    await setDoc(userRef, user, { merge: true });
    
    // Update cached user data
    localStorage.setItem(`user-data-${user.uid}`, JSON.stringify(user));
  }

  async getCurrentUser(): Promise<User | null> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return null;

    try {
      // First try to get from cache
      const cachedUserData = localStorage.getItem(`user-data-${currentUser.uid}`);
      if (cachedUserData) {
        return JSON.parse(cachedUserData) as User;
      }

      // If not in cache, get from Firestore
      const userRef = doc(this.firestore, `users/${currentUser.uid}`);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        // Cache the data for future use
        localStorage.setItem(`user-data-${currentUser.uid}`, JSON.stringify(userData));
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Method to check if user is authenticated (for offline scenarios)
  public isAuthenticated(): boolean {
    return this.userSubject.value !== null;
  }

  // Method to get cached user data (for offline scenarios)
  public getCachedUserData(uid: string): User | null {
    try {
      const cachedData = localStorage.getItem(`user-data-${uid}`);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      console.error('Error getting cached user data:', error);
      return null;
    }
  }

  // Method to clear all cached user data
  public clearCachedUserData(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('user-data-')) {
        localStorage.removeItem(key);
      }
    });
  }
}
