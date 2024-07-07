import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';


export type ThemeType = 'light-theme'|'dark-theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeSwitchingService {
  

  public currentTheme:BehaviorSubject<ThemeType> = new BehaviorSubject<ThemeType>('light-theme');

  constructor() { 

  }
}
