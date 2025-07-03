import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tax',
  templateUrl: './tax.component.html',
  styleUrls: ['./tax.component.scss']
})
export class TaxComponent implements OnInit {

  selectedRegime: 'old' | 'new' = 'old';

  constructor() { }

  ngOnInit(): void {
  }

  calculateTax(): void {
    // TODO: Implement tax calculation based on Indian tax slabs
    console.log('Calculate tax clicked');
  }

  downloadTaxReport(): void {
    // TODO: Implement tax report download functionality
    console.log('Download tax report clicked');
  }

  addTransaction(): void {
    // TODO: Navigate to add transaction
    console.log('Add transaction clicked');
  }

  selectRegime(regime: 'old' | 'new'): void {
    this.selectedRegime = regime;
    console.log('Selected regime:', regime);
  }
} 