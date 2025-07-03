import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  exportReport(): void {
    // TODO: Implement export functionality
    console.log('Export report clicked');
  }

  generateReport(): void {
    // TODO: Implement report generation
    console.log('Generate report clicked');
  }

  addTransaction(): void {
    // TODO: Navigate to add transaction
    console.log('Add transaction clicked');
  }
} 