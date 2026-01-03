import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class ChatFlowService {
    private stage: 'askType' | 'askCategory' | null = null;
    private amount: number | null = null;
    private type: 'INCOME' | 'EXPENSE' | null = null;

    startAmountFlow(amount: number) {
        this.amount = amount;
        this.stage = 'askType';
        return `Got ₹${amount}. Is this income or expense?`;
    }

    handleTypeReply(userText: string, detected: string) {
        const t = userText.toLowerCase();
        if (detected === 'ADD_INCOME' || /income|salary|earned|paid/.test(t)) {
            this.type = 'INCOME';
            this.stage = 'askCategory';
            return `Which category should I add this income to?`;
        }
        if (detected === 'ADD_EXPENSE' || /expense|spent|buy|purchase/.test(t)) {
            this.type = 'EXPENSE';
            this.stage = 'askCategory';
            return `Which category should I add this expense to?`;
        }
        return `Please reply with "income" or "expense".`;
    }

    handleCategoryReply(category: string) {
        if (!category) return 'Please provide a category name.';
        const label = this.type === 'INCOME' ? 'Income' : 'Expense';
        const result = `${label} added: ₹${this.amount} to ${category}`;
        this.reset();
        return result;
    }

    getStage() { return this.stage; }
    getAmount() { return this.amount; }
    getType() { return this.type; }

    // reset() { this.reset(); }

    private reset() {
        this.stage = null;
        this.amount = null;
        this.type = null;
    }
}
