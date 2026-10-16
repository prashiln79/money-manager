import { InjectionToken } from '@angular/core';

export interface ITransactionsFacade {
  listenToTransactions(userId: string): any;
  [key: string]: any;
}

export const TRANSACTIONS_FACADE_TOKEN = new InjectionToken<ITransactionsFacade>('TransactionsFacadeToken');
