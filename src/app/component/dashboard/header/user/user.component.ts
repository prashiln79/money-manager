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
    this.isOpen = !this.isOpen;
  }

  signOut() {
    this.userService.signOut();
  }

}
