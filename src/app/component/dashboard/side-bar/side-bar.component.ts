import { Component } from '@angular/core';
import { ThemeSwitchingService } from '../../../util/service/theme-switching.service';
import { ThemeType } from 'src/app/util/models/theme.model';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'side-bar',
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss'
})
export class SideBarComponent {
  

  constructor(
    private _themeSwitchingService: ThemeSwitchingService,
    private auth: Auth,
    private router: Router
  ){}

  public changeTheme(theme:ThemeType,drawer:any){
    this._themeSwitchingService.currentTheme.next(theme);
    drawer.toggle()
  }

  public async logout() {
    await this.auth.signOut();
    this.router.navigate(['/sign-in'], { queryParams: { loggedOut: 'true' } });
  }
}
