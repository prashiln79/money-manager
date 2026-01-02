import { Injectable } from "@angular/core";
import { OpenaiService } from "./openai.service";
import { ChatIntentService } from "./chat-intent-service";

@Injectable({ providedIn: 'root' })
export class ChatFacadeService {
    messages: Array<{ sender: string, text: string }> = [ { sender: 'bot', text: 'Hi User, your finances are synced securely. How can Money Manager assist you today?' }];
    isTyping = false;

    constructor(
        private intent: ChatIntentService,
        private ai: OpenaiService,
    ) { }

    startBotReply(userText: string) {
        this.isTyping = true;
        const detected = this.intent.detectIntent(userText);

        if (detected === 'ADD_EXPENSE') {
            const amount = this.extractAmount(userText);
            console.log('Adding expense:', amount);
            this.pushBot(`Expense added: ₹${amount}`);
        }

        else if (detected === 'ADD_INCOME') {
            const amount = this.extractAmount(userText);
            console.log('Adding income:', amount);
            this.pushBot(`Income added: ₹${amount}`);
        }

        else if (detected === 'GET_REPORT') {
            this.pushBot('Generating your financial report...');
            console.log('Generating report...');
        }

        else {
            try {
                const systemMessage = this.ai.createFinancialAdvisorMessage();
                const userMessage = { role: 'user' as const, content: userText };

                this.ai.sendMessage([systemMessage, userMessage]).subscribe({
                    next: reply => this.pushBot(reply),
                    error: err => this.pushBot('AI error, try again')
                });
            } catch (error) {
                console.error('Error during AI reply:', error);
                this.pushBot('AI error, try again');
            }

        }
    }

    private pushBot(text: string) {
        this.messages.push({ sender: 'bot', text });
        this.isTyping = false;
    }

    private extractAmount(text: string): number {
        const match = text.match(/(\d[\d,]*)/);
        return match ? Number(match[1].replace(/,/g, '')) : 0;
    }
}
