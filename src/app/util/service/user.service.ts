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
    onAuthStateChanged(getAuth(), (user) => {
      this.userSubject.next(user); 
    });
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
      return await signInWithEmailAndPassword(this.auth, email, password);
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
        console.log('✅ User created in Firestore');
      } else {
        console.log('✅ User already exists in Firestore');
      }
      
      // Navigate to dashboard
      console.log('🚀 Navigating to dashboard...');
      this.router.navigate(['/dashboard']);
      
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
  }

  async getCurrentUser(): Promise<User | null> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return null;

    const userRef = doc(this.firestore, `users/${currentUser.uid}`);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? (userSnap.data() as User) : null;
  }
}
