import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class AmountExtractor {
    extractAmount(text: string): number {
        const match = text.match(/(\d[\d,]*)/);
        return match ? Number(match[1].replace(/,/g, '')) : 0;
    }
}
