import { BreakpointObserver } from '@angular/cdk/layout';
import { Component } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Timestamp } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Transaction, TransactionsService } from 'src/app/util/service/transactions.service';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrl: './transaction.component.scss'
})
export class TransactionComponent {
  isMobile = false;
  transactionForm: FormGroup;
  categories: string[] = ['Food', 'Travel', 'Entertainment', 'Health', 'Other'];
  buttons: string[] = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'];
  public tagList: string[] = ['Personal', 'Business', 'Family', 'Friends', 'Other'];
  public statusList: string[] = ['Pending', 'Completed', 'Cancelled'];
  public userId: any;
  newTransaction: Transaction = {
    transactionId: '',
    userId: '',
    accountId: '',
    amount: 0,
    category: 'Food',
    type: 'expense',
    date: Timestamp.fromDate(new Date()),
    recurring: false,
    recurringInterval: 'monthly',  // Default to monthly
  };


  constructor(private transactionsService: TransactionsService, private fb: FormBuilder, public dialogRef: MatDialogRef<TransactionComponent>, private breakpointObserver: BreakpointObserver, private auth: Auth) {

    this.transactionForm = this.fb.group({
      name: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      date: [new Date(), Validators.required],
      description: [''],
      tag: [''],
      status: ['']
    });

    this.breakpointObserver.observe(['(max-width: 600px)']).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  ngOnInit(): void {
    this.userId = this.auth.currentUser?.uid;
  }

  async onSubmit(): Promise<void> {
    if (this.transactionForm.valid) {
      this.newTransaction.userId = this.userId;
      this.newTransaction.transactionId = `${this.newTransaction.userId}-${new Date().getTime()}`;

      await this.transactionsService.createTransaction(this.userId, this.newTransaction);
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
