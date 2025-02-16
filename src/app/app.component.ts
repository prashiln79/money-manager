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

  constructor(private location: Location) {


  }

  ngOnInit() {
    window.addEventListener('popstate', (event) => {
      this.goBack();
    });
  }

  goBack() {
    this.location.back(); 
  }
}
