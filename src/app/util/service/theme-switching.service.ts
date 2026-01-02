import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { environment } from '@env/environment';
import { BehaviorSubject } from 'rxjs';
import { ThemeType } from '../models/theme.model';




@Injectable({
  providedIn: 'root'
})
export class ThemeSwitchingService {
  private renderer: Renderer2;
  public currentTheme = new BehaviorSubject<ThemeType>(environment.defaultAppTheme);
  private previousClass: ThemeType = environment.defaultAppTheme; // match default
  private body = this.document.body;

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.applyInitialTheme(); // ensure default is applied on start
    this._switchTheme();
  }

  private applyInitialTheme() {
    // Set the default theme class immediately on app start
    this.renderer.addClass(this.body, environment.defaultAppTheme);
  }

  private _switchTheme() {
    this.currentTheme.subscribe(theme => {
      if (theme === this.previousClass) return; // avoid unnecessary DOM updates
      this.renderer.removeClass(this.body, this.previousClass);
      this.renderer.addClass(this.body, theme);
      this.previousClass = theme;
    });
  }
}
