import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TransactionComponent } from './transaction/transaction.component';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'add-transaction',
  templateUrl: './add-transaction.component.html',
  styleUrl: './add-transaction.component.scss'
})
export class AddTransactionComponent {
  isMobile = false;

  constructor(private _dialog: MatDialog, private breakpointObserver: BreakpointObserver) {
    this.breakpointObserver.observe(['(max-width: 600px)']).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  openDialog() {
    let dialogRef;
    if (this.isMobile) {
      dialogRef = this._dialog.open(TransactionComponent, {
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        panelClass: 'full-screen-dialog',
      });

    } else {
      dialogRef = this._dialog.open(TransactionComponent);
    }



    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}
