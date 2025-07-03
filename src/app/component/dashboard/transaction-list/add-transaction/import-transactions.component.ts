import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.selectedFile = file;
    this.error = '';
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      try {
        this.parseCSV(text);
      } catch (err) {
        this.error = 'Invalid file format.';
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
    if (this.selectedToImport.has(idx)) this.selectedToImport.delete(idx);
    else this.selectedToImport.add(idx);
  }

  downloadTemplate() {
    const csv = 'payee,amount,type,category,date\nSample Payee,1000,income,Salary,2024-06-01';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaction_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  importSelected() {
    const selected = this.parsedTransactions.filter(t => this.selectedToImport.has(t._idx));
    this.dialogRef.close(selected);
  }

  close() {
    this.dialogRef.close();
  }
} 