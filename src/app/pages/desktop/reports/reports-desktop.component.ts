import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule, DecimalPipe, TitleCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

// App Components & Pipes
import { CategoryReportItemComponent } from 'src/app/util/components/cards/category-report-item/category-report-item.component';
import { CurrencyPipe } from 'src/app/util/pipes/currency.pipe';
import { AbsPipe } from 'src/app/util/pipes/abs.pipe';
import { MathPipe } from 'src/app/util/pipes/math.pipe';
import { TrendPipe } from 'src/app/util/pipes/trend.pipe';

import type { ReportsComponent } from 'src/app/modules/features/component/reports/reports.component';

@Component({
  selector: 'app-reports-desktop',
  templateUrl: './reports-desktop.component.html',
  styleUrls: ['./reports-desktop.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    DecimalPipe,
    TitleCasePipe,
    MatCardModule,
    MatTabsModule,
    MatButtonToggleModule,
    MatTableModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatExpansionModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    CategoryReportItemComponent,
    CurrencyPipe,
    AbsPipe,
    MathPipe,
    TrendPipe
  ]
})
export class ReportsDesktopComponent {
  @Input({ required: true }) c!: ReportsComponent;
}
