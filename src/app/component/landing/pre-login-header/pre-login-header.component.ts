import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pre-login-header',
  templateUrl: './pre-login-header.component.html',
  styleUrls: ['./pre-login-header.component.scss'],
})
export class PreLoginHeaderComponent { 


    constructor(
      private router: Router,
    ) {}

  navigateToSignIn(): void {
    this.router.navigate(['/sign-in']);
  }
}
