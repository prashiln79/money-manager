import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Auth } from '@angular/fire/auth';
import { NotificationService } from 'src/app/util/service/notification.service';
import { SplitwiseService } from 'src/app/util/service/splitwise.service';
import { CreateGroupRequest } from 'src/app/util/models/splitwise.model';
import { CurrencyCode } from 'src/app/util/config/enums';

@Component({
  selector: 'app-create-group-dialog',
  templateUrl: './create-group-dialog.component.html',
  styleUrls: ['./create-group-dialog.component.scss']
})
export class CreateGroupDialogComponent implements OnInit {
  groupForm: FormGroup;
  isSubmitting = false;
  currencies = Object.values(CurrencyCode);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CreateGroupDialogComponent>,
    private auth: Auth,
    private splitwiseService: SplitwiseService,
    private notificationService: NotificationService
  ) {
    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      currency: ['USD', Validators.required],
      initialMembers: [[]]
    });
  }

  ngOnInit(): void {
    // Set default currency based on user's locale or preference
    const userCurrency = this.getUserCurrency();
    this.groupForm.patchValue({ currency: userCurrency });
  }

  async onSubmit(): Promise<void> {
    if (this.groupForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      try {
        const formData = this.groupForm.value;
        const request: CreateGroupRequest = {
          name: formData.name.trim(),
          description: formData.description?.trim() || '',
          currency: formData.currency,
          initialMembers: formData.initialMembers || []
        };

        await this.splitwiseService.createGroup(request);
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error creating group:', error);
        this.notificationService.error('Failed to create group');
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.groupForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(controlName: string): string {
    const control = this.groupForm.get(controlName);
    if (control?.hasError('required')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    }
    if (control?.hasError('minlength')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    if (control?.hasError('maxlength')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must not exceed ${control.errors?.['maxlength'].requiredLength} characters`;
    }
    return '';
  }

  private getUserCurrency(): string {
    // Try to get currency from user's locale
    try {
      const locale = navigator.language || 'en-US';
      const currency = new Intl.NumberFormat(locale, { style: 'currency' }).resolvedOptions().currency;
      if (currency && this.currencies.includes(currency as CurrencyCode)) {
        return currency;
      }
    } catch (error) {
      console.warn('Could not determine user currency from locale');
    }

    // Default to USD
    return 'USD';
  }

  getCurrencyDisplayName(currency: string): string {
    const currencyNames: { [key: string]: string } = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound',
      'INR': 'Indian Rupee',
      'CAD': 'Canadian Dollar',
      'AUD': 'Australian Dollar',
      'JPY': 'Japanese Yen',
      'CNY': 'Chinese Yuan'
    };
    return currencyNames[currency] || currency;
  }
} 