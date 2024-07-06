import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'money-manager';

  savings = [
    { icon: 'home', name: 'New House', duration: '5 years', amount: '$80,000', progress: 100 },
    { icon: 'flight', name: 'Hawaii Vacation', duration: '4 months left', amount: '$3,400 of $10,000', progress: 34 },
  ];

  currentTheme = 'dark-theme';

}
