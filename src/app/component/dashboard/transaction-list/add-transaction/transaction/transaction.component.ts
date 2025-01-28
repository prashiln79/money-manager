import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrl: './transaction.component.scss'
})
export class TransactionComponent {

  transactionForm: FormGroup;
  categories: string[] = ['Food', 'Travel', 'Entertainment', 'Health', 'Other'];
  buttons: string[] = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'];


  constructor(private fb: FormBuilder, public dialogRef: MatDialogRef<TransactionComponent>) {
    this.transactionForm = this.fb.group({
      name: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      expression: [''],

      category: ['', Validators.required],
      date: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      console.log('Transaction Data:', this.transactionForm.value);
      // Here you can add the code to save the transaction data
    }
  }

  appendExpression(value: string): void {
    if (value === '=') {
      this.calculate();
    } else {
      this.transactionForm.get("amount")?.setValue(this.transactionForm.get("amount")?.value + value);
    }
  }

  calculate(): void {
    try {
      this.transactionForm.get("amount")?.setValue(this.transactionForm.get("amount")?.value);
    } catch (e) {
      this.transactionForm.get('amount')?.setValue('Error');
    }
  }

  clear(): void {
    this.transactionForm.get('amount')?.setValue('');
  }

}
