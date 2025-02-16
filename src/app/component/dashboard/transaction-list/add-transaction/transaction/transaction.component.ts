import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, Inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Timestamp } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CategoryService } from 'src/app/util/service/category.service';
import { Transaction, TransactionsService } from 'src/app/util/service/transactions.service';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrl: './transaction.component.scss'
})
export class TransactionComponent {
  isMobile = false;
  transactionForm: FormGroup;
  categories: Array<any> = [];
  buttons: string[] = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'];
  public tagList: Array<any> = [];
  public statusList: string[] = ['Pending', 'Completed', 'Cancelled'];
  public typeList: string[] = ['Income', 'Expense'];
  public userId: any;


  constructor(@Inject(MAT_DIALOG_DATA) public dialogData: any, private categoryService: CategoryService, private transactionsService: TransactionsService, private fb: FormBuilder, public dialogRef: MatDialogRef<TransactionComponent>, private breakpointObserver: BreakpointObserver, private auth: Auth) {

    this.transactionForm = this.fb.group({
      payee: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      date: [new Date(), Validators.required],
      description: [''],
      tag: [''],
      type: ['Expense']
    });

    this.breakpointObserver.observe(['(max-width: 600px)']).subscribe(result => {
      this.isMobile = result.matches;
    });
    this.categoryService.getCategories(this.auth.currentUser?.uid || '').subscribe((resp) => {
      this.tagList = resp;
      if (this.dialogData.id) {
        this.transactionForm.patchValue({
          payee: this.dialogData.payee,
          amount: this.dialogData.amount,
          date: this.dialogData.date.toDate(),
          description: this.dialogData.notes,
          tag: this.dialogData.category,
          type: this.dialogData.type
        });
      }
    });


  }

  ngOnInit(): void {
    this.userId = this.auth.currentUser?.uid;

  }

  async onSubmit(): Promise<void> {
    if (this.transactionForm.valid) {
      this.dialogRef.close(true);
      if (this.dialogData.id) {
        await this.transactionsService.updateTransaction(this.userId, this.dialogData.id, {
          payee: this.transactionForm.get('payee')?.value,
          userId: this.userId,
          accountId: '',
          amount: this.transactionForm.get('amount')?.value,
          category: this.transactionForm.get('tag')?.value,
          type: this.transactionForm.get('type')?.value,
          date: Timestamp.fromDate(new Date()),
          notes: this.transactionForm.get('description')?.value
        });
      } else {


        await this.transactionsService.createTransaction(this.userId, {
          payee: this.transactionForm.get('payee')?.value,
          userId: this.userId,
          accountId: '',
          amount: this.transactionForm.get('amount')?.value,
          category: this.transactionForm.get('tag')?.value,
          type: this.transactionForm.get('type')?.value,
          date: Timestamp.fromDate(new Date()),
          notes: this.transactionForm.get('description')?.value
        });
      }
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
