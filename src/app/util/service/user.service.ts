import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, UserCredential, onAuthStateChanged, getAuth, GoogleAuthProvider } from '@angular/fire/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(private auth: Auth, private router: Router, private afAuth: AngularFireAuth) {
    onAuthStateChanged(getAuth(), (user) => {
      this.userSubject.next(user); // Update the user observable with the current user
    });
  }

  // Sign Up
  async signUp(email: string, password: string): Promise<UserCredential> {
    try {
      return await createUserWithEmailAndPassword(this.auth, email, password);
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
    const provider = new GoogleAuthProvider();  // Create a Google Auth Provider
    return this.afAuth.signInWithPopup(provider)  // Open the Google sign-in popup
  }

}
