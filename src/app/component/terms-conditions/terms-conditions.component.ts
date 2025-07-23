import { Component } from '@angular/core';

@Component({
  selector: 'app-terms-conditions',
  templateUrl: './terms-conditions.component.html',
  styleUrls: ['./terms-conditions.component.scss']
})
export class TermsConditionsComponent {
  
  lastUpdated = 'December 2024';
  
  navigateBack() {
    window.history.back();
  }
} 