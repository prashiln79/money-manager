import { Component } from '@angular/core';
import { ThemeSwitchingService } from './util/service/theme-switching.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  public title = 'money-manager';
  isOnline = navigator.onLine;

  constructor(private location: Location) {

  }

  ngOnInit() {
    this.onLoadEvent();
  }

  onLoadEvent() {

    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
    window.addEventListener('popstate', (event) => {
      this.goBack();
    });
  }

  goBack() {
    this.location.back();
  }
}
