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


  // Sign Out
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

  public signInWithGoogle() {
    const provider = new GoogleAuthProvider();  // Create a Google Auth provider

    // Use the modern approach with signInWithPopup from the Auth API
    signInWithPopup(this.auth, provider)  // Open the Google sign-in popup
      .then((result) => {
        // On successful sign-in, you can access user info here
        console.log('User signed in:', result.user);

        // Navigate to a different route after successful sign-in
        this.router.navigate(['/dashboard']);  // Replace '/dashboard' with your desired route
      })
      .catch((error) => {
        console.error('Error during Google sign-in:', error);
      });
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
