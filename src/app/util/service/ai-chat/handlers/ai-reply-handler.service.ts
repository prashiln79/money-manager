
import { Injectable } from "@angular/core";
import { OpenaiService } from "../openai.service";

@Injectable({ providedIn: 'root' })
export class AiReplyHandlerService {

    constructor(private ai: OpenaiService) {

    }

    handleAI(userText: string) {
        const systemMessage = this.ai.createFinancialAdvisorMessage();
        const userMessage = { role: 'user' as const, content: userText };
        return this.ai.sendMessage([systemMessage, userMessage]);
    }
}