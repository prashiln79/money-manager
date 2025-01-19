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
  public currentTheme: BehaviorSubject<ThemeType> = new BehaviorSubject<ThemeType>(environment.defaultAppTheme);
  private previousClass: ThemeType = environment.defaultAppTheme;
  public body = this.document.body;

  constructor(rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this._switchTheme();
  }

  private _switchTheme() {
    this.currentTheme.subscribe((theme: ThemeType) => {
      this.renderer.removeClass(this.body, this.previousClass)
      this.renderer.addClass(this.body, theme);
      this.previousClass = theme;
    })
  }
}
