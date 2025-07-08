import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../../environments/environment';

import { transactionsReducer } from './transactions/transactions.reducer';
import { categoriesReducer } from './categories/categories.reducer';
import { accountsReducer } from './accounts/accounts.reducer';
import { budgetsReducer } from './budgets/budgets.reducer';
// import { profileReducer } from './profile/profile.reducer';

import { TransactionsEffects } from './transactions/transactions.effects';
import { CategoriesEffects } from './categories/categories.effects';
import { AccountsEffects } from './accounts/accounts.effects';
import { BudgetsEffects } from './budgets/budgets.effects';
// import { ProfileEffects } from './profile/profile.effects';

@NgModule({
  imports: [
    StoreModule.forRoot({
      transactions: transactionsReducer,
      categories: categoriesReducer,
      accounts: accountsReducer,
      budgets: budgetsReducer,
      // profile: profileReducer
    }),
    EffectsModule.forRoot([
      TransactionsEffects,
      CategoriesEffects,
      AccountsEffects,
      BudgetsEffects,
      // ProfileEffects
    ]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production
    })
  ]
})
export class AppStoreModule { } 