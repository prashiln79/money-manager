import { Component } from '@angular/core';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss']
})
export class PrivacyPolicyComponent {
  
  lastUpdated = 'December 2024';
  
  navigateBack() {
    window.history.back();
  }
} 