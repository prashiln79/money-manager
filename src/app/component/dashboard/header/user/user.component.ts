import { Component } from '@angular/core';
import { UserService } from 'src/app/util/service/user.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent {
  isOpen = false;

  constructor(private userService: UserService) { }


  toggle() {
    console.log('toggling');
    this.isOpen = !this.isOpen;
  }

  close() {
    setTimeout(() => {
      this.isOpen = false;
    }, 10);
  }

  async signOut(e:any) {
    console.log('signing out');
    await this.userService.signOut();
    e.stopPropagation();
  }

}
