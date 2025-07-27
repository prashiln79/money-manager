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
import * as XLSX from 'xlsx';
import { Auth } from '@angular/fire/auth';
import { Account } from 'src/app/util/models/account.model';
import { Category } from 'src/app/util/models';
import { AppState } from 'src/app/store/app.state';
import { Store } from '@ngrx/store';
import { selectAllAccounts } from 'src/app/store/accounts/accounts.selectors';
import { selectAllCategories } from 'src/app/store/categories/categories.selectors';
import { APP_CONFIG } from 'src/app/util/config/config';
import { SsrService } from 'src/app/util/service/ssr.service';

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
  isDragOver: boolean = false;
  fileType: string = '';

  // Dropdown data
  accounts: Account[] = [];
  categories: Category[] = [];

  // Default values
  defaultAccountId: string = '';

  constructor(
    public dialogRef: MatDialogRef<ImportTransactionsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private notificationService: NotificationService,
    private auth: Auth,
    private store: Store<AppState>,
    private ssrService: SsrService
  ) {
    this.setupDragAndDrop();
    this.loadAccountsAndCategories();
  }

  ngAfterViewInit() {
    // Drag and drop setup is already done in constructor
  }

  ngOnDestroy() {
    // Cleanup if needed
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
      });
    } catch (error) {
      console.error('Error loading accounts and categories:', error);
    }
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

    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      this.notificationService.error('Please select an Excel file (XLSX or XLS)');
      return;
    }

    this.selectedFile = file;
    this.fileType = fileExtension.toUpperCase();
    this.error = '';
    this.isLoading = true;
    this.notificationService.info(`Processing ${this.fileType} file...`);

    this.parseExcelFile(file);
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

    this.parseStandardFormat(data);

    if (this.parsedTransactions.length === 0) {
      this.error = 'No valid transactions found in the file.';
      this.notificationService.error('No valid transactions found');
      return;
    }

    // Select all transactions by default
    this.selectedToImport = new Set(this.parsedTransactions.map((t) => t._idx));
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
      if (this.ssrService.isClientSide()) {
        const excelData = [
          ['Payee', 'Amount', 'Type', 'Category', 'Date', 'Notes'],
          ['Salary Payment', 50000, 'income', 'Salary', '2024-01-15', 'Monthly salary'],
        ];

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        ws['!cols'] = [
          { width: 20 }, { width: 12 }, { width: 10 },
          { width: 18 }, { width: 12 }, { width: 25 },
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

        // Simple instructions sheet
        const instructionsData = [
          ['Transaction Import Template - Instructions'],
          [''],
          ['Column Descriptions:'],
          ['Payee', 'Name of the person, merchant, or company'],
          ['Amount', 'Transaction amount (positive number)'],
          ['Type', 'Must be either "income" or "expense"'],
          ['Category', 'Transaction category (e.g., Salary, Food & Dining, etc.)'],
          ['Date', 'Transaction date in YYYY-MM-DD format'],
          ['Notes', 'Optional description or notes'],
          [''],
          ['Important Notes:'],
          ['- Keep the header row as is (Row 1)'],
          ['- Use YYYY-MM-DD format for dates'],
          ['- Delete sample row (Row 2) before adding your data'],
        ];

        const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
        instructionsWs['!cols'] = [{ width: 60 }];
        XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

        // Generate Excel file
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const excelBlob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const excelUrl = window.URL.createObjectURL(excelBlob);
        const excelLink = document.createElement('a');
        excelLink.href = excelUrl;
        excelLink.download = 'transaction_import_template.xlsx';
        excelLink.click();
        window.URL.revokeObjectURL(excelUrl);

        this.notificationService.success('Excel template downloaded successfully');
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      this.notificationService.error('Failed to download template');
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
        `${selected.length - validTransactions.length
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
