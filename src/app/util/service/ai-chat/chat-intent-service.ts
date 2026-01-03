import { Injectable } from "@angular/core";


@Injectable({ providedIn: 'root' })
export class ChatIntentService {
  detectIntent(text: string): string {
    const t = text.toLowerCase();

    const amount = /₹?\$?\d+[.,]?\d*/.test(t);
    const actions = ['add','paid','received','got','spent','debit','credit','purchase','buy','transfer','sent','deposit','withdraw'];
    const hasAction = actions.some(a => t.includes(a));
    const isIncome = ['salary','income','received','got','credited','deposit'].some(w => t.includes(w));
    const isExpense = ['spent','expense','paid','debited','withdraw','purchase','buy'].some(w => t.includes(w));

    if (amount && hasAction && isIncome) return 'ADD_INCOME';
    if (amount && hasAction && isExpense) return 'ADD_EXPENSE';

    if (t.includes('balance') || t.includes('wallet') || t.includes('bank')) return 'CHECK_BALANCE';

    if (t.includes('report') || t.includes('summary') || t.includes('statement') || t.includes('overview')) return 'GET_REPORT';
    
    if (t.includes('advice') || t.includes('suggest') || t.includes('tips') || t.includes('insight') || t.includes('analyze')) return 'GET_INSIGHTS';

    return 'AI_REPLY';
  }
}



