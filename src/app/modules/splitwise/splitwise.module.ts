import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';

// NgRx
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

// Components
import { SplitwiseComponent } from './splitwise.component';
import { CreateGroupDialogComponent } from './create-group-dialog/create-group-dialog.component';
import { AddMemberDialogComponent } from './add-member-dialog/add-member-dialog.component';

// Store
import { splitwiseReducer } from './store/splitwise.reducer';
import { SplitwiseEffects } from './store/splitwise.effects';

// Services
import { SplitwiseService } from './services/splitwise.service';

// Utility Components
import { LoaderComponent } from '../../util/components/loader/loader.component';
import { TranslatePipe } from '../../util/pipes/translate.pipe';
import { CurrencyPipe } from '../../util/pipes/currency.pipe';

@NgModule({
  declarations: [
    SplitwiseComponent,
    CreateGroupDialogComponent,
    AddMemberDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    
    // Material Modules
    MatCardModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatMenuModule,
    
    // NgRx
    StoreModule.forFeature('splitwise', splitwiseReducer),
    EffectsModule.forFeature([SplitwiseEffects]),
    
    // Standalone Components
    LoaderComponent,
    TranslatePipe,
    CurrencyPipe
  ],
  providers: [
    SplitwiseService
  ],
  exports: [
    SplitwiseComponent
  ]
})
export class SplitwiseModule { } 