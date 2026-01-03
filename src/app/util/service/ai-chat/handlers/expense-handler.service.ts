import { Injectable } from "@angular/core";


@Injectable({ providedIn: 'root' })
export class ExpenseHandlerService {


    addExpense(text: string, amount: number) {
        console.log('Adding expense:', amount);
        return `Expense added: ₹${amount}`;
    }
}
