import { Component, HostListener } from '@angular/core';
import { ThemeSwitchingService } from '../../../util/service/theme-switching.service';
import { ThemeType } from 'src/app/util/models/theme.model';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { LanguageSwitcherComponent } from '../../../util/components/language-switcher/language-switcher.component';
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
    private _themeSwitchingService: ThemeSwitchingService,
    private auth: Auth,
    private router: Router
  ){}

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.drawer && this.drawer.opened) {
      this.drawer.close();
    }
  }

  public changeTheme(theme:ThemeType,drawer:any){
    this._themeSwitchingService.currentTheme.next(theme);
    drawer.toggle()
  }

  public async logout() {
    await this.auth.signOut();
    this.router.navigate(['/sign-in'], { queryParams: { loggedOut: 'true' } });
  }
}
