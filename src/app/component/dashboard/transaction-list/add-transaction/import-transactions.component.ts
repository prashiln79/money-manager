import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationService } from 'src/app/util/service/notification.service';

@Component({
  selector: 'import-transactions',
  templateUrl: './import-transactions.component.html',
  styleUrls: ['./import-transactions.component.scss']
})
export class ImportTransactionsComponent {
  selectedFile: File | null = null;
  parsedTransactions: any[] = [];
  selectedToImport: Set<number> = new Set();
  error: string = '';

  constructor(
    public dialogRef: MatDialogRef<ImportTransactionsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private notificationService: NotificationService
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) {
      this.notificationService.warning('Please select a file');
      return;
    }
    
    if (!file.name.endsWith('.csv')) {
      this.notificationService.error('Please select a CSV file');
      return;
    }
    
    this.selectedFile = file;
    this.error = '';
    this.notificationService.info('Processing CSV file...');
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      try {
        this.parseCSV(text);
        this.notificationService.success(`Successfully parsed ${this.parsedTransactions.length} transactions`);
      } catch (err) {
        this.error = 'Invalid file format.';
        this.notificationService.error('Failed to parse CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  }

  parseCSV(text: string) {
    // Simple CSV parser for demo (expects: payee,amount,type,category,date)
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    this.parsedTransactions = lines.slice(1).map((line, idx) => {
      const values = line.split(',');
      const obj: any = {};
      header.forEach((h, i) => obj[h] = values[i]?.trim());
      obj._idx = idx;
      return obj;
    });
    this.selectedToImport = new Set(this.parsedTransactions.map(t => t._idx));
  }

  toggleSelect(idx: number) {
    if (this.selectedToImport.has(idx)) {
      this.selectedToImport.delete(idx);
    } else {
      this.selectedToImport.add(idx);
    }
  }

  downloadTemplate() {
    try {
      const csv = 'payee,amount,type,category,date\nSample Payee,1000,income,Salary,2024-06-01';
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
    
    this.notificationService.success(`Importing ${selected.length} transactions`);
    this.dialogRef.close(selected);
  }

  close() {
    this.dialogRef.close();
  }
} 