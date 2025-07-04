import { Component, HostListener } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';

@Component({
  selector: 'side-bar',
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss'
})
export class SideBarComponent {
  @ViewChild('drawer') drawer!: MatDrawer;

  constructor(
    private auth: Auth,
    private router: Router
  ){}

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.drawer && this.drawer.opened) {
      this.drawer.close();
    }
  }

  public async logout() {
    await this.auth.signOut();
    this.router.navigate(['/sign-in'], { queryParams: { loggedOut: 'true' } });
  }
}
