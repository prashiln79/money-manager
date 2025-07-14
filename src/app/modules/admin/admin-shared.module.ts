import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Material Modules commonly used in admin components
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// Shared Components
import { ConfirmDialogComponent } from '../../util/components/confirm-dialog/confirm-dialog.component';

// Admin-specific components, directives, and pipes can be added here
// Example: AdminStatsCardComponent, AdminStatusBadgeDirective, etc.

@NgModule({
  declarations: [
    // Admin-specific components, directives, pipes
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  exports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ]
})
export class AdminSharedModule { } 