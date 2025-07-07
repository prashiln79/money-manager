import { Component, Inject, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationService } from 'src/app/util/service/notification.service';
import { Papa } from 'ngx-papaparse';

@Component({
  selector: 'import-transactions',
  templateUrl: './import-transactions.component.html',
  styleUrls: ['./import-transactions.component.scss']
})
export class ImportTransactionsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('fileUploadContainer') fileUploadContainer!: ElementRef;
  
  selectedFile: File | null = null;
  parsedTransactions: any[] = [];
  selectedToImport: Set<number> = new Set();
  error: string = '';
  isLoading: boolean = false;
  isMobile: boolean = false;
  isDragOver: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ImportTransactionsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private notificationService: NotificationService,
    private papa: Papa
  ) {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  ngAfterViewInit() {
    this.setupDragAndDrop();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', () => this.checkScreenSize());
  }

  private setupDragAndDrop() {
    const container = this.fileUploadContainer?.nativeElement;
    if (!container) return;

    container.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.isDragOver = true;
    });

    container.addEventListener('dragleave', (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.isDragOver = false;
    });

    container.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.isDragOver = false;
      
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        this.handleFile(files[0]);
      }
    });
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File) {
    if (!file) {
      this.notificationService.warning('Please select a file');
      return;
    }
    
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      this.notificationService.error('Please select a CSV, XLSX, or XLS file');
      return;
    }
    
    this.selectedFile = file;
    this.error = '';
    this.isLoading = true;
    this.notificationService.info('Processing file...');
    
    if (fileExtension === '.csv') {
      this.parseCSVFile(file);
    } else {
      // For Excel files, you might need a different library like xlsx
      this.notificationService.error('Excel file support coming soon. Please use CSV format.');
      this.isLoading = false;
    }
  }

  parseCSVFile(file: File) {
    this.papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        this.isLoading = false;
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
          // Continue with partial results if there are only warnings
          if (results.data.length === 0) {
            this.error = 'Error parsing CSV file. Please check the format.';
            this.notificationService.error('Failed to parse CSV file');
            return;
          }
        }
        
        this.processParsedData(results.data);
        this.notificationService.success(`Successfully parsed ${this.parsedTransactions.length} transactions`);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.error = 'Error reading file.';
        this.notificationService.error('Failed to read file');
        console.error('CSV parsing error:', error);
      }
    });
  }

  processParsedData(data: any[]) {
    if (!data || data.length === 0) {
      this.error = 'No valid data found in the file.';
      this.notificationService.error('No transactions found in the file');
      return;
    }

    // Check if this is an HDFC bank statement format
    if (this.isHDFCStatement(data)) {
      this.parseHDFCStatement(data);
    } else {
      this.parseStandardFormat(data);
    }
    
    if (this.parsedTransactions.length === 0) {
      this.error = 'No valid transactions found in the file.';
      this.notificationService.error('No valid transactions found');
      return;
    }
    
    // Select all transactions by default
    this.selectedToImport = new Set(this.parsedTransactions.map(t => t._idx));
  }

  isHDFCStatement(data: any[]): boolean {
    // Check for HDFC bank statement indicators
    const firstRow = data[0];
    if (!firstRow) return false;
    
    // Check for HDFC specific column names
    const hasHDFCColumns = firstRow['Date'] !== undefined && 
                          firstRow['Narration'] !== undefined && 
                          firstRow['Withdrawal Amt.'] !== undefined && 
                          firstRow['Deposit Amt.'] !== undefined;
    
    // Also check for HDFC bank name in any field
    const hasHDFCName = Object.values(firstRow).some((value: any) => 
      typeof value === 'string' && value.toLowerCase().includes('hdfc')
    );
    
    return hasHDFCColumns || hasHDFCName;
  }

  parseHDFCStatement(data: any[]) {
    this.parsedTransactions = data
      .filter(row => {
        // Filter out header rows and empty rows
        return row['Date'] && 
               row['Date'].trim() && 
               !row['Date'].includes('*') && 
               !row['Date'].includes('Date') &&
               row['Date'].match(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
      })
      .map((row, idx) => {
        const date = this.parseHDFCDate(row['Date']);
        const amount = this.parseHDFCAmount(row['Withdrawal Amt.'], row['Deposit Amt.']);
        const type = amount > 0 ? 'income' : 'expense';
        
        return {
          _idx: idx,
          payee: this.cleanHDFCNarration(row['Narration']),
          amount: Math.abs(amount),
          type: type,
          category: this.categorizeHDFCTransaction(row['Narration']),
          date: date,
          narration: row['Narration'],
          reference: row['Chq./Ref.No.'] || ''
        };
      })
      .filter(tx => tx.amount > 0); // Filter out zero amount transactions
  }

  parseStandardFormat(data: any[]) {
    this.parsedTransactions = data.map((row, idx) => {
      return {
        _idx: idx,
        payee: row['payee'] || row['Payee'] || row['PAYEE'] || '',
        amount: parseFloat(row['amount'] || row['Amount'] || row['AMOUNT'] || '0'),
        type: (row['type'] || row['Type'] || row['TYPE'] || 'expense').toLowerCase(),
        category: row['category'] || row['Category'] || row['CATEGORY'] || 'Other',
        date: row['date'] || row['Date'] || row['DATE'] || new Date().toISOString().split('T')[0]
      };
    });
  }

  private parseHDFCDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    // Handle DD/MM/YY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      return `${year}-${month}-${day}`;
    }
    
    return dateStr;
  }

  private parseHDFCAmount(withdrawal: string, deposit: string): number {
    const withdrawalAmount = parseFloat(withdrawal?.replace(/,/g, '') || '0');
    const depositAmount = parseFloat(deposit?.replace(/,/g, '') || '0');
    return depositAmount - withdrawalAmount;
  }

  private cleanHDFCNarration(narration: string): string {
    if (!narration) return 'Unknown';
    
    // Remove common prefixes
    let cleaned = narration
      .replace(/^(UPI|NEFT|IMPS|ACH|POS|EMI|IB BILLPAY|DC)\s*-?\s*/i, '')
      .replace(/^[A-Z0-9]+-[A-Z0-9]+-/, '')
      .replace(/^[A-Z0-9]+-/, '');
    
    // Extract merchant name from UPI transactions
    const upiMatch = cleaned.match(/^([^-]+)-/);
    if (upiMatch) {
      cleaned = upiMatch[1];
    }
    
    // Clean up common patterns
    cleaned = cleaned
      .replace(/@[A-Z0-9]+/g, '')
      .replace(/-[A-Z0-9]+$/g, '')
      .replace(/\s+/, ' ')
      .trim();
    
    return cleaned || 'Unknown';
  }

  private categorizeHDFCTransaction(narration: string): string {
    const lowerNarration = narration.toLowerCase();
    
    // Salary
    if (lowerNarration.includes('salary') || lowerNarration.includes('techmahindra')) {
      return 'Salary';
    }
    
    // Food & Dining
    if (lowerNarration.includes('zomato') || lowerNarration.includes('swiggy') || 
        lowerNarration.includes('restaurant') || lowerNarration.includes('food') ||
        lowerNarration.includes('hungerbox')) {
      return 'Food & Dining';
    }
    
    // Fuel
    if (lowerNarration.includes('fuel') || lowerNarration.includes('petrol') || 
        lowerNarration.includes('oil') || lowerNarration.includes('bp ') ||
        lowerNarration.includes('quality fuel')) {
      return 'Fuel';
    }
    
    // Shopping
    if (lowerNarration.includes('flipkart') || lowerNarration.includes('amazon') || 
        lowerNarration.includes('shopping') || lowerNarration.includes('mr diy') ||
        lowerNarration.includes('bata') || lowerNarration.includes('lenskart')) {
      return 'Shopping';
    }
    
    // Entertainment
    if (lowerNarration.includes('spotify') || lowerNarration.includes('netflix') || 
        lowerNarration.includes('entertainment')) {
      return 'Entertainment';
    }
    
    // Utilities
    if (lowerNarration.includes('electricity') || lowerNarration.includes('water') || 
        lowerNarration.includes('gas') || lowerNarration.includes('utility') ||
        lowerNarration.includes('vodafone') || lowerNarration.includes('jio')) {
      return 'Utilities';
    }
    
    // Transport
    if (lowerNarration.includes('uber') || lowerNarration.includes('ola') || 
        lowerNarration.includes('parking') || lowerNarration.includes('transport') ||
        lowerNarration.includes('irctc')) {
      return 'Transport';
    }
    
    // Rent
    if (lowerNarration.includes('rent')) {
      return 'Rent';
    }
    
    // EMI
    if (lowerNarration.includes('emi')) {
      return 'EMI';
    }
    
    // Medical
    if (lowerNarration.includes('medical') || lowerNarration.includes('wellness') ||
        lowerNarration.includes('pharmacy') || lowerNarration.includes('chemist')) {
      return 'Medical';
    }
    
    return 'Other';
  }

  toggleSelect(idx: number) {
    if (this.selectedToImport.has(idx)) {
      this.selectedToImport.delete(idx);
    } else {
      this.selectedToImport.add(idx);
    }
  }

  toggleSelectAll() {
    if (this.selectedToImport.size === this.parsedTransactions.length) {
      this.selectedToImport.clear();
    } else {
      this.selectedToImport = new Set(this.parsedTransactions.map(t => t._idx));
    }
  }

  downloadTemplate() {
    try {
      const csv = 'payee,amount,type,category,date\nSample Payee,1000,income,Salary,2024-06-01\nSample Expense,500,expense,Food,2024-06-01';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transaction_template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      this.notificationService.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      this.notificationService.error('Failed to download template');
    }
  }

  importSelected() {
    const selected = this.parsedTransactions.filter(t => this.selectedToImport.has(t._idx));
    if (selected.length === 0) {
      this.notificationService.warning('Please select at least one transaction to import');
      return;
    }
    
    // Validate selected transactions
    const validTransactions = selected.filter(tx => {
      if (!tx.payee || !tx.payee.trim()) {
        this.notificationService.warning(`Transaction ${tx._idx + 1}: Payee is required`);
        return false;
      }
      if (!tx.amount || tx.amount <= 0) {
        this.notificationService.warning(`Transaction ${tx._idx + 1}: Amount must be greater than 0`);
        return false;
      }
      if (!tx.type || !['income', 'expense'].includes(tx.type)) {
        this.notificationService.warning(`Transaction ${tx._idx + 1}: Invalid transaction type`);
        return false;
      }
      if (!tx.date) {
        this.notificationService.warning(`Transaction ${tx._idx + 1}: Date is required`);
        return false;
      }
      return true;
    });
    
    if (validTransactions.length === 0) {
      this.notificationService.error('No valid transactions to import');
      return;
    }
    
    if (validTransactions.length < selected.length) {
      this.notificationService.warning(`${selected.length - validTransactions.length} transactions were skipped due to validation errors`);
    }
    
    this.notificationService.success(`Importing ${validTransactions.length} transactions`);
    this.dialogRef.close(validTransactions);
  }

  close() {
    this.dialogRef.close();
  }
} 