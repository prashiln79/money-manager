import { Injectable } from "@angular/core";



@Injectable({ providedIn: 'root' })
export class ReportHandlerService {


    generateReport() {
        console.log('Generating report...');
        return 'Generating your financial report...';
    }
}