import { Component, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Auth } from '@angular/fire/auth';
import { Transaction, TransactionsService } from 'src/app/util/service/transactions.service';
import { NotificationService } from 'src/app/util/service/notification.service';
import { TransactionComponent } from './add-transaction/transaction/transaction.component';
import { MatDialog } from '@angular/material/dialog';
import { LoaderService } from 'src/app/util/service/loader.service';

@Component({
  selector: 'transaction-list',
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss'
})
export class TransactionListComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild("tableSort", { static: false }) sort!: MatSort;
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  isMobile = false;
  displayedColumns: string[] = ['Payee', 'Amount', 'Status', 'Type', 'Date', 'Actions'];
  public pageSizeOptions: number[] = [10, 25, 100];
  selectedTx: any = null;
  longPressTimeout: any;


  constructor(private loaderService: LoaderService, private _dialog: MatDialog, private breakpointObserver: BreakpointObserver, private auth: Auth, private transactionsService: TransactionsService, private notificationService: NotificationService) {

    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });
    this.loadTransactions();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }


  ngOnInit() {

  }

  loadTransactions() {
    this.loaderService.show();
    this.transactionsService.getTransactions(this.auth.currentUser?.uid || '').subscribe(transactions => {
      this.dataSource.data = transactions.sort((a: any, b: any) => b.date.toDate() - a.date.toDate());
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.loaderService.hide();
    });

  }

  editTransaction(transaction: Transaction) {
    const dialogRef = this._dialog.open(TransactionComponent, {
      data: transaction
    });
  }

  async deleteTransaction(transaction: Transaction) {
    await this.transactionsService.deleteTransaction(this.auth.currentUser?.uid || '', transaction.id || '');
    this.notificationService.success('Transaction deleted successfully');
  }

  onLongPress(tx: any) {
    this.selectedTx = tx;
  }

}
