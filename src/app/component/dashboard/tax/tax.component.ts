import { Component, OnInit, OnDestroy } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { TransactionsService, Transaction } from '../../../util/service/transactions.service';
import { TaxService, TaxCalculation, TaxDeduction, GSTCalculation } from '../../../util/service/tax.service';
import { NotificationService } from '../../../util/service/notification.service';

@Component({
  selector: 'app-tax',
  templateUrl: './tax.component.html',
  styleUrls: ['./tax.component.scss']
})
export class TaxComponent implements OnInit, OnDestroy {

  selectedRegime: 'old' | 'new' = 'old';
  
  // Tax calculation data
  oldRegimeCalculation: TaxCalculation | null = null;
  newRegimeCalculation: TaxCalculation | null = null;
  gstCalculation: GSTCalculation | null = null;
  
  // Form data
  taxForm: FormGroup;
  deductions: TaxDeduction[] = [];
  
  // Transaction data
  transactions: Transaction[] = [];
  totalIncome: number = 0;
  
  // UI states
  isLoading: boolean = false;
  showInputForm: boolean = false;
  showComparison: boolean = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private auth: Auth,
    private transactionsService: TransactionsService,
    private taxService: TaxService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.taxForm = this.fb.group({
      totalIncome: [0, [Validators.required, Validators.min(0)]],
      gstBaseAmount: [0, [Validators.min(0)]],
      section80C: [0, [Validators.min(0), Validators.max(150000)]],
      section80D: [0, [Validators.min(0), Validators.max(25000)]],
      section80G: [0, [Validators.min(0), Validators.max(100000)]],
      section80TTA: [0, [Validators.min(0), Validators.max(10000)]],
      hraExemption: [0, [Validators.min(0)]],
      ltaExemption: [0, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadTransactions();
    this.initializeDeductions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Load transactions from the service
   */
  private loadTransactions(): void {
    const userId = this.auth.currentUser?.uid;
    if (userId) {
      const sub = this.transactionsService.getTransactions(userId).subscribe({
        next: (transactions) => {
          this.transactions = transactions;
          this.totalIncome = this.taxService.calculateTotalIncome(transactions);
          this.taxForm.patchValue({ totalIncome: this.totalIncome });
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          this.notificationService.error('Failed to load transaction data');
        }
      });
      this.subscriptions.push(sub);
    }
  }

  /**
   * Initialize deductions with default values
   */
  private initializeDeductions(): void {
    this.deductions = this.taxService.getDefaultDeductions();
  }

  /**
   * Update deductions from form values
   */
  private updateDeductions(): void {
    const formValue = this.taxForm.value;
    
    this.deductions = [
      { section: '80C', description: 'ELSS, PPF, EPF, Life Insurance, etc.', maxAmount: 150000, currentAmount: formValue.section80C || 0 },
      { section: '80D', description: 'Health Insurance Premium', maxAmount: 25000, currentAmount: formValue.section80D || 0 },
      { section: '80G', description: 'Donations to Charitable Institutions', maxAmount: 100000, currentAmount: formValue.section80G || 0 },
      { section: '80TTA', description: 'Interest on Savings Account', maxAmount: 10000, currentAmount: formValue.section80TTA || 0 },
      { section: 'HRA', description: 'House Rent Allowance Exemption', maxAmount: 0, currentAmount: formValue.hraExemption || 0 },
      { section: 'LTA', description: 'Leave Travel Allowance', maxAmount: 0, currentAmount: formValue.ltaExemption || 0 }
    ];
  }

  /**
   * Calculate tax based on selected regime
   */
  calculateTax(): void {
    if (!this.taxForm.valid) {
      this.notificationService.error('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    
    try {
      const formValue = this.taxForm.value;
      const totalIncome = formValue.totalIncome || 0;
      
      // Update deductions
      this.updateDeductions();
      
      // Calculate tax for both regimes
      this.oldRegimeCalculation = this.taxService.calculateOldRegimeTax(totalIncome, this.deductions);
      this.newRegimeCalculation = this.taxService.calculateNewRegimeTax(totalIncome);
      
      // Calculate GST if base amount is provided
      if (formValue.gstBaseAmount && formValue.gstBaseAmount > 0) {
        this.gstCalculation = this.taxService.calculateGST(formValue.gstBaseAmount);
      } else {
        this.gstCalculation = null;
      }
      
      this.showComparison = true;
      this.notificationService.success('Tax calculation completed successfully!');
      
    } catch (error) {
      console.error('Error calculating tax:', error);
      this.notificationService.error('Failed to calculate tax. Please check your inputs.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Download tax report
   */
  downloadTaxReport(): void {
    if (!this.oldRegimeCalculation && !this.newRegimeCalculation) {
      this.notificationService.error('Please calculate tax first');
      return;
    }

    try {
      const calculation = this.selectedRegime === 'old' ? this.oldRegimeCalculation! : this.newRegimeCalculation!;
      const report = this.taxService.generateTaxReport(calculation, this.gstCalculation || undefined);
      
      // Create and download file
      const blob = new Blob([report], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tax-report-${this.selectedRegime}-regime-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      this.notificationService.success('Tax report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      this.notificationService.error('Failed to download tax report');
    }
  }

  /**
   * Select tax regime
   */
  selectRegime(regime: 'old' | 'new'): void {
    this.selectedRegime = regime;
    this.showInputForm = regime === 'old'; // Show input form only for old regime
  }

  /**
   * Toggle input form visibility
   */
  toggleInputForm(): void {
    this.showInputForm = !this.showInputForm;
  }

  /**
   * Get comparison data
   */
  getComparisonData(): { recommendation: string; savings: number } | null {
    if (!this.oldRegimeCalculation || !this.newRegimeCalculation) {
      return null;
    }

    const comparison = this.taxService.compareRegimes(
      this.oldRegimeCalculation.totalIncome,
      this.deductions
    );

    return {
      recommendation: comparison.recommendation,
      savings: comparison.savings
    };
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  /**
   * Get current calculation based on selected regime
   */
  getCurrentCalculation(): TaxCalculation | null {
    return this.selectedRegime === 'old' ? this.oldRegimeCalculation : this.newRegimeCalculation;
  }

  /**
   * Get deduction by section
   */
  getDeductionBySection(section: string): TaxDeduction | undefined {
    return this.deductions.find(d => d.section === section);
  }

  /**
   * Get total deductions amount
   */
  getTotalDeductions(): number {
    return this.deductions.reduce((sum, d) => sum + d.currentAmount, 0);
  }
} 