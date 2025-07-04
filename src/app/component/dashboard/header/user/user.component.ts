import { Component } from '@angular/core';
import { UserService } from 'src/app/util/service/user.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss',
  animations: [
    trigger('slideDown', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(-10px) scale(0.95)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'translateY(0) scale(1)'
      })),
      transition('void => *', [
        animate('200ms ease-out')
      ]),
      transition('* => void', [
        animate('150ms ease-in')
      ])
    ])
  ]
})
export class UserComponent {
  isOpen = false;
  public user = this.userService.getUser();

  constructor(private userService: UserService) {
    this.user;
  }

  toggle(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    console.log('toggling');
    this.isOpen = !this.isOpen;
  }

  close() {
    this.isOpen = false;
  }

  viewProfile() {
    console.log('View profile clicked');
    // TODO: Implement view profile functionality
    this.close();
  }

  openSettings() {
    console.log('Settings clicked');
    // TODO: Implement settings functionality
    this.close();
  }

  openHelp() {
    console.log('Help clicked');
    // TODO: Implement help functionality
    this.close();
  }

  async signOut(e: any) {
    console.log('signing out');
    await this.userService.signOut();
    e.stopPropagation();
    this.close();
  }
}
