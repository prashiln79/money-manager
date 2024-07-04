import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {MatCardModule} from '@angular/material/card';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { IconModule } from './util/icon.module';
import { HttpClientModule } from '@angular/common/http';
import { TotalBalanceComponent } from './component/total-balance/total-balance.component';
import { CalendarViewComponent } from './component/calendar-view/calendar-view.component';
import { TransactionListComponent } from './component/transaction-list/transaction-list.component';
import { AddTransactionComponent } from './component/add-transaction/add-transaction.component';
import { HeaderComponent } from './component/header/header.component';


@NgModule({
  declarations: [
    AppComponent,
    TotalBalanceComponent,
    CalendarViewComponent,
    TransactionListComponent,
    AddTransactionComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    HttpClientModule,
    IconModule
  ],
  providers: [
    provideAnimationsAsync(),
    MatDatepickerModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
