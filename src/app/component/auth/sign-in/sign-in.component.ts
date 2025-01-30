import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/util/service/notification.service';
import { UserService } from 'src/app/util/service/user.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
  public isSignInPage = true;
  public isLoading = false;
  signInForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private userService: UserService, private notificationService: NotificationService) {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    this._setIsSignInPage(this.router.url === '/sign-in');
  }

  onSignIn() {

    if (this.signInForm.valid) {
      this.isLoading = true;
      this.userService.signIn(this.signInForm.get('email')?.value, this.signInForm.get('password')?.value).then(() => {
        this.isLoading = false;
        this.notificationService.success('User logged in successfully');
        this.router.navigate(['/dashboard']);
      }).catch((error) => {
        this.isLoading = false;
        this.notificationService.error(error.message);
      });

    } else {
      this.notificationService.error('Please fill all the required fields');
    }
  }

  onSignUp() {

    if (this.signInForm.get('password')?.value !== this.signInForm.get('confirmPassword')?.value) {
      this.notificationService.error('Passwords do not match');
      this.signInForm.get('confirmPassword')?.setErrors({ 'notMatch': true });
      return;
    }

    if (this.signInForm.valid) {
      this.isLoading = true;
      this.userService.signUp(this.signInForm.get('email')?.value, this.signInForm.get('password')?.value,'UserName').then(() => {
        this.isLoading = false;
        this.notificationService.success('User registered successfully');
        this._setIsSignInPage(true);
      }).catch((error) => {
        this.isLoading = false;
        this.notificationService.error(error.message);
      });

    } else {
      this.notificationService.error('Please fill all the required fields');
    }
  }

  public gotoPage() {
    this._setIsSignInPage(!this.isSignInPage);
  }


  private _setIsSignInPage(flag: boolean) {
    this.isSignInPage = flag;

    if (!this.isSignInPage) {
      this.signInForm.addControl('confirmPassword', this.fb.control('', [Validators.required]));
    } else {
      this.signInForm.removeControl('confirmPassword');
    }
  }

  public signInWithGoogle() {
    this.userService.signInWithGoogle();
  }

}
