import { Component, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

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
  displayedColumns: string[] = ['Date', 'Type', 'Payee', 'Amount', 'Status'];
  public pageSizeOptions: number[] = [10, 25, 100];


  constructor(private breakpointObserver: BreakpointObserver) {

    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });

    this.dataSource.data = [{
      date: '01/01/2020',
      type: 'Deposit',
      payee: 'John Doe',
      amount: 100,
      status: 'Completed'
    },
    {
      date: '01/01/2020',
      type: 'Deposit',
      payee: 'John Doe',
      amount: 100,
      status: 'Completed'
    },
    {
      date: '01/01/2020',
      type: 'Deposit',
      payee: 'John Doe',
      amount: 100,
      status: 'Completed'
    },
    {
      date: '01/01/2020',
      type: 'Deposit',
      payee: 'John Doe',
      amount: 100,
      status: 'Completed'
    },
    {
      date: '01/01/2020',
      type: 'Deposit',
      payee: 'John Doe',
      amount: 100,
      status: 'Completed'
    },
    {
      date: '01/01/2020',
      type: 'Deposit',
      payee: 'John Doe',
      amount: 100,
      status: 'Completed'
    },
    {
      date: '01/01/2020',
      type: 'Deposit',
      payee: 'John Doe',
      amount: 100,
      status: 'Completed'
    },
    {
      date: '01/01/2020',
      type: 'Deposit',
      payee: 'John Doe',
      amount: 100,
      status: 'Completed'
    },
    {
      date: '01/01/2020',
      type: 'Deposit',
      payee: 'John Doe',
      amount: 100,
      status: 'Completed'
    },
    {
      date: '01/01/2020',
      type: 'Deposit',
      payee: 'John Doe',
      amount: 100,
      status: 'Completed'
    },
    {
      date: '01/01/2020',
      type: 'Deposit',
      payee: 'John Doe',
      amount: 100,
      status: 'Completed'
    },
    {
      date: '01/01/2020',
      type: 'Deposit',
      payee: 'John Doe',
      amount: 100,
      status: 'Completed'
    },
    ];
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }


  ngOnInit() {
  }



}
