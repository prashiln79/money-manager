import { Component } from '@angular/core';
import { ThemeSwitchingService } from '../../../util/service/theme-switching.service';
import { ThemeType } from 'src/app/util/models/theme.model';

@Component({
  selector: 'side-bar',
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss'
})
export class SideBarComponent {
  

  constructor(private _themeSwitchingService:ThemeSwitchingService){

  }

  public changeTheme(theme:ThemeType,drawer:any){
    this._themeSwitchingService.currentTheme.next(theme);
    drawer.toggle()
  }
}
