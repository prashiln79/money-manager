import { Injectable } from "@angular/core";


@Injectable({ providedIn: 'root' })
export class ChatIntentService {
    detectIntent(text: string) {
        const t = text.toLowerCase();
        if (t.includes('salary') || t.includes('income')) return 'ADD_INCOME';
        if (t.includes('spent') || t.includes('expense')) return 'ADD_EXPENSE';
        if (t.includes('report') || t.includes('summary')) return 'GET_REPORT';
        return 'AI_REPLY';
    }
}


