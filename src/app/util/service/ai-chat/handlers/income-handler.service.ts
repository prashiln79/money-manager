
import { Injectable } from "@angular/core";


@Injectable({ providedIn: 'root' })
export class IncomeHandlerService {
    addIncome(text: string, amount: number) {
        // later you can plug API, DB, or NgRx dispatch here
        console.log('Adding income:', amount);
        return `Income added: ₹${amount}`;
    }
}