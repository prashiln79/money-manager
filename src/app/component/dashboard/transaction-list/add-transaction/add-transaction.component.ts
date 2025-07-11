import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
// import { TransactionComponent } from './transaction/transaction.component';
import { MobileAddTransactionComponent } from './mobile-add-transaction/mobile-add-transaction.component';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'add-transaction',
  templateUrl: './add-transaction.component.html',
  styleUrl: './add-transaction.component.scss'
})
export class AddTransactionComponent {
  isMobile = false;
  dialogData: any = null;

  constructor(private _dialog: MatDialog, private breakpointObserver: BreakpointObserver) {
    this.breakpointObserver.observe(['(max-width: 600px)']).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  openDialog() {
    let dialogRef  = this._dialog.open(MobileAddTransactionComponent, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      panelClass: 'full-screen-dialog',
      data: this.dialogData
    });
   



    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}
