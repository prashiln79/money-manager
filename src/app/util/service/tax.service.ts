import { Injectable } from '@angular/core';
import { TransactionsService, Transaction } from './transactions.service';

export interface TaxSlab {
  minIncome: number;
  maxIncome: number;
  rate: number;
  description: string;
}

export interface TaxDeduction {
  section: string;
  description: string;
  maxAmount: number;
  currentAmount: number;
}

export interface TaxCalculation {
  totalIncome: number;
  deductions: TaxDeduction[];
  totalDeductions: number;
  taxableIncome: number;
  incomeTax: number;
  cess: number;
  totalTaxLiability: number;
  regime: 'old' | 'new';
}

export interface GSTCalculation {
  baseAmount: number;
  cgst: number;
  sgst: number;
  totalGST: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaxService {

  // Old Regime Tax Slabs (FY 2024-25)
  private oldRegimeSlabs: TaxSlab[] = [
    { minIncome: 0, maxIncome: 250000, rate: 0, description: 'Up to ₹2,50,000' },
    { minIncome: 250001, maxIncome: 500000, rate: 5, description: '₹2,50,001 - ₹5,00,000' },
    { minIncome: 500001, maxIncome: 1000000, rate: 20, description: '₹5,00,001 - ₹10,00,000' },
    { minIncome: 1000001, maxIncome: Infinity, rate: 30, description: 'Above ₹10,00,000' }
  ];

  // New Regime Tax Slabs (FY 2024-25)
  private newRegimeSlabs: TaxSlab[] = [
    { minIncome: 0, maxIncome: 300000, rate: 0, description: 'Up to ₹3,00,000' },
    { minIncome: 300001, maxIncome: 600000, rate: 5, description: '₹3,00,001 - ₹6,00,000' },
    { minIncome: 600001, maxIncome: 900000, rate: 10, description: '₹6,00,001 - ₹9,00,000' },
    { minIncome: 900001, maxIncome: 1200000, rate: 15, description: '₹9,00,001 - ₹12,00,000' },
    { minIncome: 1200001, maxIncome: 1500000, rate: 20, description: '₹12,00,001 - ₹15,00,000' },
    { minIncome: 1500001, maxIncome: Infinity, rate: 30, description: 'Above ₹15,00,000' }
  ];

  // Standard deductions for new regime
  private readonly NEW_REGIME_STANDARD_DEDUCTION = 50000;

  constructor(private transactionsService: TransactionsService) {}

  /**
   * Calculate total income from transactions for a specific year
   */
  calculateTotalIncome(transactions: Transaction[], financialYear: number = 2025): number {
    const startDate = new Date(financialYear - 1, 3, 1); // April 1st of previous year
    const endDate = new Date(financialYear, 2, 31); // March 31st of current year

    return transactions
      .filter(t => {
        const transactionDate = t.date.toDate();
        return t.type === 'income' && 
               transactionDate >= startDate && 
               transactionDate <= endDate;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Get default deductions for old regime
   */
  getDefaultDeductions(): TaxDeduction[] {
    return [
      { section: '80C', description: 'ELSS, PPF, EPF, Life Insurance, etc.', maxAmount: 150000, currentAmount: 0 },
      { section: '80D', description: 'Health Insurance Premium', maxAmount: 25000, currentAmount: 0 },
      { section: '80G', description: 'Donations to Charitable Institutions', maxAmount: 100000, currentAmount: 0 },
      { section: '80TTA', description: 'Interest on Savings Account', maxAmount: 10000, currentAmount: 0 },
      { section: 'HRA', description: 'House Rent Allowance Exemption', maxAmount: 0, currentAmount: 0 },
      { section: 'LTA', description: 'Leave Travel Allowance', maxAmount: 0, currentAmount: 0 }
    ];
  }

  /**
   * Calculate tax for old regime
   */
  calculateOldRegimeTax(totalIncome: number, deductions: TaxDeduction[]): TaxCalculation {
    const totalDeductions = deductions.reduce((sum, d) => sum + d.currentAmount, 0);
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);
    
    const incomeTax = this.calculateTaxBySlabs(taxableIncome, this.oldRegimeSlabs);
    const cess = incomeTax * 0.04; // 4% cess
    const totalTaxLiability = incomeTax + cess;

    return {
      totalIncome,
      deductions,
      totalDeductions,
      taxableIncome,
      incomeTax,
      cess,
      totalTaxLiability,
      regime: 'old'
    };
  }

  /**
   * Calculate tax for new regime
   */
  calculateNewRegimeTax(totalIncome: number): TaxCalculation {
    const taxableIncome = Math.max(0, totalIncome - this.NEW_REGIME_STANDARD_DEDUCTION);
    
    const incomeTax = this.calculateTaxBySlabs(taxableIncome, this.newRegimeSlabs);
    const cess = incomeTax * 0.04; // 4% cess
    const totalTaxLiability = incomeTax + cess;

    return {
      totalIncome,
      deductions: [{ section: 'Standard', description: 'Standard Deduction', maxAmount: 50000, currentAmount: 50000 }],
      totalDeductions: this.NEW_REGIME_STANDARD_DEDUCTION,
      taxableIncome,
      incomeTax,
      cess,
      totalTaxLiability,
      regime: 'new'
    };
  }

  /**
   * Calculate tax based on tax slabs
   */
  private calculateTaxBySlabs(taxableIncome: number, slabs: TaxSlab[]): number {
    let totalTax = 0;
    let remainingIncome = taxableIncome;

    for (const slab of slabs) {
      if (remainingIncome <= 0) break;

      const slabIncome = Math.min(
        remainingIncome,
        slab.maxIncome === Infinity ? remainingIncome : slab.maxIncome - slab.minIncome + 1
      );

      totalTax += (slabIncome * slab.rate) / 100;
      remainingIncome -= slabIncome;
    }

    return totalTax;
  }

  /**
   * Calculate GST
   */
  calculateGST(baseAmount: number, gstRate: number = 18): GSTCalculation {
    const totalGST = (baseAmount * gstRate) / 100;
    const cgst = totalGST / 2; // CGST is half of total GST
    const sgst = totalGST / 2; // SGST is half of total GST

    return {
      baseAmount,
      cgst,
      sgst,
      totalGST
    };
  }

  /**
   * Get tax slabs for display
   */
  getTaxSlabs(regime: 'old' | 'new'): TaxSlab[] {
    return regime === 'old' ? this.oldRegimeSlabs : this.newRegimeSlabs;
  }

  /**
   * Compare old vs new regime
   */
  compareRegimes(totalIncome: number, deductions: TaxDeduction[]): {
    oldRegime: TaxCalculation;
    newRegime: TaxCalculation;
    recommendation: string;
    savings: number;
  } {
    const oldRegime = this.calculateOldRegimeTax(totalIncome, deductions);
    const newRegime = this.calculateNewRegimeTax(totalIncome);
    
    const savings = oldRegime.totalTaxLiability - newRegime.totalTaxLiability;
    const recommendation = savings > 0 ? 'new' : 'old';

    return {
      oldRegime,
      newRegime,
      recommendation,
      savings: Math.abs(savings)
    };
  }

  /**
   * Generate tax report
   */
  generateTaxReport(calculations: TaxCalculation, gstCalculation?: GSTCalculation): string {
    const report = `
INDIAN TAX ANALYSIS REPORT
Financial Year: 2024-25
Tax Regime: ${calculations.regime === 'old' ? 'Old Regime (With Deductions)' : 'New Regime (Simplified)'}

INCOME DETAILS:
Total Income: ₹${calculations.totalIncome.toLocaleString('en-IN')}

${calculations.regime === 'old' ? `
DEDUCTIONS:
${calculations.deductions.map(d => `${d.section}: ₹${d.currentAmount.toLocaleString('en-IN')}`).join('\n')}
Total Deductions: ₹${calculations.totalDeductions.toLocaleString('en-IN')}
` : `
STANDARD DEDUCTION:
Standard Deduction: ₹${calculations.totalDeductions.toLocaleString('en-IN')}
`}

TAXABLE INCOME: ₹${calculations.taxableIncome.toLocaleString('en-IN')}

TAX CALCULATION:
Income Tax: ₹${calculations.incomeTax.toLocaleString('en-IN')}
Cess (4%): ₹${calculations.cess.toLocaleString('en-IN')}
TOTAL TAX LIABILITY: ₹${calculations.totalTaxLiability.toLocaleString('en-IN')}

${gstCalculation ? `
GST ANALYSIS:
Base Amount: ₹${gstCalculation.baseAmount.toLocaleString('en-IN')}
CGST (9%): ₹${gstCalculation.cgst.toLocaleString('en-IN')}
SGST (9%): ₹${gstCalculation.sgst.toLocaleString('en-IN')}
Total GST (18%): ₹${gstCalculation.totalGST.toLocaleString('en-IN')}
` : ''}

Generated on: ${new Date().toLocaleDateString('en-IN')}
    `;

    return report;
  }
} 