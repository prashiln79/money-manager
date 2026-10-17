import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';

import { CurrencyPipe, AppDatePipe } from 'src/app/util/pipes';
import { ImageFallbackDirective } from 'src/app/util/directives/image-fallback.directive';
import type { FamilyDashboardComponent } from 'src/app/modules/family/pages/family-dashboard/family-dashboard.component';

@Component({
  selector: 'app-family-dashboard-desktop',
  templateUrl: './family-dashboard-desktop.component.html',
  styleUrls: ['./family-dashboard-desktop.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatRippleModule,
    CurrencyPipe,
    AppDatePipe,
    ImageFallbackDirective
  ]
})
export class FamilyDashboardDesktopComponent {
  @Input({ required: true }) c!: FamilyDashboardComponent;
}
