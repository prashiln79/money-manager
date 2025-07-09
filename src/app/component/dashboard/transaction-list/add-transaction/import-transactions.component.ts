import {
  Component,
  Inject,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationService } from 'src/app/util/service/notification.service';
import { Papa } from 'ngx-papaparse';
import * as XLSX from 'xlsx';
import { Auth } from '@angular/fire/auth';
import { Account } from 'src/app/util/models/account.model';
import { Category } from 'src/app/util/models';
import { AppState } from 'src/app/store/app.state';
import { Store } from '@ngrx/store';
import { selectAllAccounts } from 'src/app/store/accounts/accounts.selectors';
import { selectAllCategories } from 'src/app/store/categories/categories.selectors';
import { APP_CONFIG } from 'src/app/util/config/config';

@Component({
  selector: 'import-transactions',
  templateUrl: './import-transactions.component.html',
  styleUrls: ['./import-transactions.component.scss'],
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
  fileType: string = '';

  // Inline editing
  editingTransaction: number | null = null;
  editingField: string | null = null;

  // Dropdown data
  accounts: Account[] = [];
  categories: Category[] = [];
  incomeCategories: Category[] = [];
  expenseCategories: Category[] = [];

  // Default values
  defaultAccountId: string = '';

  constructor(
    public dialogRef: MatDialogRef<ImportTransactionsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private notificationService: NotificationService,
    private papa: Papa,
    private auth: Auth,
    private store: Store<AppState>,
  ) {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
    this.loadAccountsAndCategories();
  }

  ngAfterViewInit() {
    this.setupDragAndDrop();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', () => this.checkScreenSize());
  }

  private async loadAccountsAndCategories() {
    const userId = this.auth.currentUser?.uid;
    if (!userId) return;

    try {
      // Load accounts
      this.store.select(selectAllAccounts).subscribe(accounts => {
        this.accounts = accounts;
        if (accounts.length > 0) {
          this.defaultAccountId = accounts[0].accountId;
        }
      });

      // Load categories
      this.store.select(selectAllCategories).subscribe(categories => {
        this.categories = categories;
        this.incomeCategories = categories.filter(cat => cat.type === 'income');
        this.expenseCategories = categories.filter(cat => cat.type === 'expense');
      });
    } catch (error) {
      console.error('Error loading accounts and categories:', error);
    }
  }

  // Inline editing methods
  startEditing(transactionIndex: number, field: string) {
    this.editingTransaction = transactionIndex;
    this.editingField = field;
  }

  stopEditing() {
    this.editingTransaction = null;
    this.editingField = null;
  }

  updateTransaction(transactionIndex: number, field: string, value: any) {
    if (transactionIndex >= 0 && transactionIndex < this.parsedTransactions.length) {
      this.parsedTransactions[transactionIndex][field] = value;
      
      // Update category based on type if needed
      if (field === 'type') {
        const transaction = this.parsedTransactions[transactionIndex];
        if (value === 'income' && this.incomeCategories.length > 0) {
          transaction.category = this.incomeCategories[0].name;
        } else if (value === 'expense' && this.expenseCategories.length > 0) {
          transaction.category = this.expenseCategories[0].name;
        }
      }
    }
    this.stopEditing();
  }

  getCategoriesForType(type: string): Category[] {
    return type === 'income' ? this.incomeCategories : this.expenseCategories;
  }

  // Keyboard event handlers for inline editing
  onKeyDown(event: KeyboardEvent, transactionIndex: number, field: string, value: any) {
    if (event.key === 'Enter') {
      this.updateTransaction(transactionIndex, field, value);
    } else if (event.key === 'Escape') {
      this.stopEditing();
    }
  }

  onBlur(transactionIndex: number, field: string, value: any) {
    this.updateTransaction(transactionIndex, field, value);
  }

  // Helper method to get input value safely
  getInputValue(event: Event): string {
    const target = event.target as HTMLInputElement;
    return target ? target.value : '';
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
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      this.notificationService.error('Please select a CSV, XLSX, or XLS file');
      return;
    }

    this.selectedFile = file;
    this.fileType = fileExtension.toUpperCase();
    this.error = '';
    this.isLoading = true;
    this.notificationService.info(`Processing ${this.fileType} file...`);

    if (fileExtension === '.csv') {
      this.parseCSVFile(file);
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      this.parseExcelFile(file);
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
        this.notificationService.success(
          `Successfully parsed ${this.parsedTransactions.length} transactions from CSV file`
        );
      },
      error: (error: any) => {
        this.isLoading = false;
        this.error = 'Error reading file.';
        this.notificationService.error('Failed to read file');
        console.error('CSV parsing error:', error);
      },
    });
  }

  parseExcelFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        if (workbook.SheetNames.length === 0) {
          this.isLoading = false;
          this.error = 'Excel file contains no sheets.';
          this.notificationService.error('No sheets found in Excel file');
          return;
        }

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          this.isLoading = false;
          this.error = 'Excel file is empty or has no data rows.';
          this.notificationService.error('No data found in Excel file');
          return;
        }

        // Convert to array of objects with headers
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        // Validate headers
        if (!headers || headers.length === 0) {
          this.isLoading = false;
          this.error = 'Excel file must have a header row.';
          this.notificationService.error(
            'Invalid Excel format - missing headers'
          );
          return;
        }

        const excelData = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: true,
        });

        if (excelData.length === 0) {
          this.isLoading = false;
          this.error = 'No valid data rows found in Excel file.';
          this.notificationService.error('No valid data in Excel file');
          return;
        }

        this.isLoading = false;
        this.processParsedData(excelData);
        this.notificationService.success(
          `Successfully parsed ${this.parsedTransactions.length} transactions from Excel file`
        );

      } catch (error) {
        this.isLoading = false;
        this.error = 'Error parsing Excel file. Please check the format.';
        this.notificationService.error('Failed to parse Excel file');
        console.error('Excel parsing error:', error);
      }
    };

    reader.onerror = () => {
      this.isLoading = false;
      this.error = 'Error reading Excel file.';
      this.notificationService.error('Failed to read Excel file');
    };

    reader.readAsArrayBuffer(file);
  }

  processParsedData(data: any[]) {
    if (!data || data.length === 0) {
      this.error = 'No valid data found in the file.';
      this.notificationService.error('No transactions found in the file');
      return;
    }

    // Check if this is an HDFC bank statement format
    //this.isHDFCStatement(data) later use this
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
    this.selectedToImport = new Set(this.parsedTransactions.map((t) => t._idx));
  }

  isHDFCStatement(data: any[]): boolean {
    // Check for HDFC bank statement indicators
    const firstRow = data[0];
    if (!firstRow) return false;

    // Check for HDFC specific column names
    const hasHDFCColumns =
      firstRow['Date'] !== undefined &&
      firstRow['Narration'] !== undefined &&
      firstRow['Withdrawal Amt.'] !== undefined &&
      firstRow['Deposit Amt.'] !== undefined;

    // Also check for HDFC bank name in any field
    const hasHDFCName = Object.values(firstRow).some(
      (value: any) =>
        typeof value === 'string' && value.toLowerCase().includes('hdfc')
    );

    return hasHDFCColumns || hasHDFCName;
  }

  parseHDFCStatement(data: any[]) {
    const getColumn = (row: any, label: string) =>
      Object.keys(row).find((k) => k.toLowerCase().includes(label));

    const dateKey = getColumn(data[0], 'date');
    const narrationKey = getColumn(data[0], 'narration');
    const withdrawalKey: any = getColumn(data[0], 'withdrawal');
    const depositKey: any = getColumn(data[0], 'deposit');
    const refKey: any = getColumn(data[0], 'ref') || getColumn(data[0], 'chq');

    if (!dateKey || !narrationKey || (!withdrawalKey && !depositKey)) {
      this.error = 'Missing expected columns in HDFC statement.';
      this.notificationService.error('Invalid format for HDFC statement.');
      return;
    }

    this.parsedTransactions = data
      .filter((row) => {
        const rawDate = row[dateKey];
        return rawDate && typeof rawDate !== 'string'
          ? true
          : rawDate.trim() !== '' &&
              !rawDate.includes('Date') &&
              !rawDate.includes('*');
      })
      .map((row, idx) => {
        const rawDate = row[dateKey];
        const narration = row[narrationKey];
        const withdrawal = row[withdrawalKey];
        const deposit = row[depositKey];
        const amount = this.parseHDFCAmount(withdrawal, deposit);
        const type = amount > 0 ? 'income' : 'expense';

        return {
          _idx: idx,
          payee: this.cleanHDFCNarration(narration),
          amount: Math.abs(amount),
          type: type,
          category: this.categorizeHDFCTransaction(narration),
          date: this.parseHDFCDate(rawDate),
          narration: narration,
          reference: row[refKey] || '',
        };
      })
      .filter((tx) => tx.amount > 0);
  }

  parseStandardFormat(data: any[]) {
    this.parsedTransactions = data.map((row, idx) => {
      return {
        _idx: idx,
        payee: row['payee'] || row['Payee'] || row['PAYEE'] || '',
        amount: parseFloat(
          row['amount'] || row['Amount'] || row['AMOUNT'] || '0'
        ),
        type: (
          row['type'] ||
          row['Type'] ||
          row['TYPE'] ||
          'expense'
        ).toLowerCase(),
        category:
          row['category'] || row['Category'] || row['CATEGORY'] || 'Other',
        date:
          row['date'] ||
          row['Date'] ||
          row['DATE'] ||
          new Date().toISOString().split('T')[0],
      };
    });
  }

  private parseHDFCDate(dateStr: string | number): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];

    // Excel serial number
    if (typeof dateStr === 'number') {
      const date = XLSX.SSF.parse_date_code(dateStr);
      if (date) {
        const yyyy = date.y.toString().padStart(4, '0');
        const mm = date.m.toString().padStart(2, '0');
        const dd = date.d.toString().padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }

    // String format DD/MM/YYYY or DD/MM/YY
    if (typeof dateStr === 'string') {
      const parts = dateStr.trim().split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        return `${year}-${month}-${day}`;
      }
    }

    return new Date().toISOString().split('T')[0];
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
    if (
      lowerNarration.includes('salary') ||
      lowerNarration.includes('techmahindra')
    ) {
      return 'Salary';
    }

    // Food & Dining
    if (
      lowerNarration.includes('zomato') ||
      lowerNarration.includes('swiggy') ||
      lowerNarration.includes('restaurant') ||
      lowerNarration.includes('food') ||
      lowerNarration.includes('hungerbox')
    ) {
      return 'Food & Dining';
    }

    // Fuel
    if (
      lowerNarration.includes('fuel') ||
      lowerNarration.includes('petrol') ||
      lowerNarration.includes('oil') ||
      lowerNarration.includes('bp ') ||
      lowerNarration.includes('quality fuel')
    ) {
      return 'Fuel';
    }

    // Shopping
    if (
      lowerNarration.includes('flipkart') ||
      lowerNarration.includes('amazon') ||
      lowerNarration.includes('shopping') ||
      lowerNarration.includes('mr diy') ||
      lowerNarration.includes('bata') ||
      lowerNarration.includes('lenskart')
    ) {
      return 'Shopping';
    }

    // Entertainment
    if (
      lowerNarration.includes('spotify') ||
      lowerNarration.includes('netflix') ||
      lowerNarration.includes('entertainment')
    ) {
      return 'Entertainment';
    }

    // Utilities
    if (
      lowerNarration.includes('electricity') ||
      lowerNarration.includes('water') ||
      lowerNarration.includes('gas') ||
      lowerNarration.includes('utility') ||
      lowerNarration.includes('vodafone') ||
      lowerNarration.includes('jio')
    ) {
      return 'Utilities';
    }

    // Transport
    if (
      lowerNarration.includes('uber') ||
      lowerNarration.includes('ola') ||
      lowerNarration.includes('parking') ||
      lowerNarration.includes('transport') ||
      lowerNarration.includes('irctc')
    ) {
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
    if (
      lowerNarration.includes('medical') ||
      lowerNarration.includes('wellness') ||
      lowerNarration.includes('pharmacy') ||
      lowerNarration.includes('chemist')
    ) {
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
      this.selectedToImport = new Set(
        this.parsedTransactions.map((t) => t._idx)
      );
    }
  }

  downloadTemplate() {
    try {
      // CSV Template
      const csv =
        `payee,amount,type,category,date\nSample Payee,${APP_CONFIG.VALIDATION.MIN_AMOUNT * 1000},income,Salary,2024-06-01\nSample Expense,${APP_CONFIG.VALIDATION.MIN_AMOUNT * 500},expense,Food,2024-06-01`;
      const csvBlob = new Blob([csv], { type: 'text/csv' });
      const csvUrl = window.URL.createObjectURL(csvBlob);
      const csvLink = document.createElement('a');
      csvLink.href = csvUrl;
      csvLink.download = 'transaction_template.csv';
      csvLink.click();
      window.URL.revokeObjectURL(csvUrl);

      // Excel Template
      const excelData = [
        ['payee', 'amount', 'type', 'category', 'date'],
        ['Sample Payee', APP_CONFIG.VALIDATION.MIN_AMOUNT * 1000, 'income', 'Salary', '2024-06-01'],
        ['Sample Expense', APP_CONFIG.VALIDATION.MIN_AMOUNT * 500, 'expense', 'Food', '2024-06-01'],
      ];

      const ws = XLSX.utils.aoa_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const excelUrl = window.URL.createObjectURL(excelBlob);
      const excelLink = document.createElement('a');
      excelLink.href = excelUrl;
      excelLink.download = 'transaction_template.xlsx';
      excelLink.click();
      window.URL.revokeObjectURL(excelUrl);

      this.notificationService.success(
        'CSV and Excel templates downloaded successfully'
      );
    } catch (error) {
      console.error('Error downloading templates:', error);
      this.notificationService.error('Failed to download templates');
    }
  }

  importSelected() {
    const selected = this.parsedTransactions.filter((t) =>
      this.selectedToImport.has(t._idx)
    );
    if (selected.length === 0) {
      this.notificationService.warning(
        'Please select at least one transaction to import'
      );
      return;
    }

    // Validate selected transactions
    const validTransactions = selected.filter((tx) => {
      if (!tx.payee || !tx.payee.trim()) {
        this.notificationService.warning(
          `Transaction ${tx._idx + 1}: Payee is required`
        );
        return false;
      }
      if (!tx.amount || tx.amount <= 0) {
        this.notificationService.warning(
          `Transaction ${tx._idx + 1}: Amount must be greater than 0`
        );
        return false;
      }
      if (!tx.type || !['income', 'expense'].includes(tx.type)) {
        this.notificationService.warning(
          `Transaction ${tx._idx + 1}: Invalid transaction type`
        );
        return false;
      }
      if (!tx.category || !tx.category.trim()) {
        this.notificationService.warning(
          `Transaction ${tx._idx + 1}: Category is required`
        );
        return false;
      }
      if (!tx.date) {
        this.notificationService.warning(
          `Transaction ${tx._idx + 1}: Date is required`
        );
        return false;
      }
      return true;
    });

    if (validTransactions.length === 0) {
      this.notificationService.error('No valid transactions to import');
      return;
    }

    if (validTransactions.length < selected.length) {
      this.notificationService.warning(
        `${
          selected.length - validTransactions.length
        } transactions were skipped due to validation errors`
      );
    }

    // Add account ID to each transaction
    const transactionsWithAccount = validTransactions.map(tx => ({
      ...tx,
      accountId: this.defaultAccountId || 'default'
    }));

    this.notificationService.success(
      `Importing ${validTransactions.length} transactions`
    );
    this.dialogRef.close(transactionsWithAccount);
  }

  close() {
    this.dialogRef.close();
  }
}
