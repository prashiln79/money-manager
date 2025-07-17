import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Auth } from '@angular/fire/auth';
import { NotificationService } from 'src/app/util/service/notification.service';
import { SplitwiseService } from 'src/app/util/service/splitwise.service';
import { SplitwiseGroup, CreateSplitTransactionRequest, TransactionSplit, GroupMember } from 'src/app/util/models/splitwise.model';
import { TransactionType } from 'src/app/util/config/enums';
import { Category } from 'src/app/util/models';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.state';
import { selectAllCategories } from 'src/app/store/categories/categories.selectors';
import moment from 'moment';

@Component({
  selector: 'app-split-transaction-dialog',
  templateUrl: './split-transaction-dialog.component.html',
  styleUrls: ['./split-transaction-dialog.component.scss']
})
export class SplitTransactionDialogComponent implements OnInit {
  @ViewChild('amountInput', { static: false }) amountInput!: ElementRef;

  transactionForm: FormGroup;
  isSubmitting = false;
  group: SplitwiseGroup;
  categoryList: Category[] = [];
  splitMethods = [
    { value: 'equal', label: 'Split Equally', icon: 'balance' },
    { value: 'percentage', label: 'Split by Percentage', icon: 'pie_chart' },
    { value: 'custom', label: 'Custom Amounts', icon: 'edit' }
  ];
  selectedSplitMethod = 'equal';
  totalAmount = 0;
  remainingAmount = 0;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<SplitTransactionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { group: SplitwiseGroup },
    private auth: Auth,
    private splitwiseService: SplitwiseService,
    private notificationService: NotificationService,
    private store: Store<AppState>
  ) {
    this.group = data.group;
    this.transactionForm = this.fb.group({
      payee: ['', [Validators.required, Validators.minLength(2)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      type: [TransactionType.EXPENSE, Validators.required],
      date: [moment().format('YYYY-MM-DD'), Validators.required],
      notes: [''],
      categoryId: ['', Validators.required],
      category: ['', Validators.required],
      splits: this.fb.array([])
    });
  }

  ngOnInit(): void {
    // Subscribe to categories
    this.store.select(selectAllCategories).subscribe((categories) => {
      this.categoryList = categories;
      this.initializeForm();
    });

    // Watch for amount changes
    this.transactionForm.get('amount')?.valueChanges.subscribe(amount => {
      this.totalAmount = parseFloat(amount) || 0;
      this.updateSplits();
    });
  }

  ngAfterViewInit(): void {
    // Focus on amount field after view is initialized
    setTimeout(() => {
      if (this.amountInput) {
        this.amountInput.nativeElement.focus();
      }
    }, 200);
  }

  private initializeForm(): void {
    if (this.categoryList.length > 0) {
      const defaultCategory = this.categoryList[0];
      this.transactionForm.patchValue({
        categoryId: defaultCategory.id,
        category: defaultCategory.name
      });
    }

    this.initializeSplits();
  }

  private initializeSplits(): void {
    const splitsArray = this.transactionForm.get('splits') as FormArray;
    splitsArray.clear();

    this.group.members.forEach(member => {
      splitsArray.push(this.createSplitControl(member));
    });

    this.updateSplits();
  }

  private createSplitControl(member: GroupMember): FormGroup {
    return this.fb.group({
      userId: [member.userId],
      email: [member.email],
      displayName: [member.displayName],
      amount: [0, [Validators.required, Validators.min(0)]],
      percentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      isPaid: [false]
    });
  }

  get splitsArray(): FormArray {
    return this.transactionForm.get('splits') as FormArray;
  }

  onSplitMethodChange(): void {
    this.updateSplits();
  }

  private updateSplits(): void {
    const memberCount = this.group.members.length;
    if (memberCount === 0) return;

    switch (this.selectedSplitMethod) {
      case 'equal':
        this.splitEqually();
        break;
      case 'percentage':
        this.splitByPercentage();
        break;
      case 'custom':
        this.resetCustomSplits();
        break;
    }
  }

  private splitEqually(): void {
    const equalAmount = this.totalAmount / this.group.members.length;
    const splitsArray = this.transactionForm.get('splits') as FormArray;

    splitsArray.controls.forEach((control, index) => {
      const percentage = (100 / this.group.members.length);
      control.patchValue({
        amount: parseFloat(equalAmount.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2))
      }, { emitEvent: false });
    });

    this.calculateRemaining();
  }

  private splitByPercentage(): void {
    const equalPercentage = 100 / this.group.members.length;
    const splitsArray = this.transactionForm.get('splits') as FormArray;

    splitsArray.controls.forEach((control, index) => {
      const amount = (this.totalAmount * equalPercentage) / 100;
      control.patchValue({
        amount: parseFloat(amount.toFixed(2)),
        percentage: parseFloat(equalPercentage.toFixed(2))
      }, { emitEvent: false });
    });

    this.calculateRemaining();
  }

  private resetCustomSplits(): void {
    const splitsArray = this.transactionForm.get('splits') as FormArray;
    splitsArray.controls.forEach(control => {
      control.patchValue({
        amount: 0,
        percentage: 0
      }, { emitEvent: false });
    });
    this.calculateRemaining();
  }

  onSplitAmountChange(index: number): void {
    const splitsArray = this.transactionForm.get('splits') as FormArray;
    const splitControl = splitsArray.at(index);
    const amount = splitControl.get('amount')?.value || 0;

    if (this.totalAmount > 0) {
      const percentage = (amount / this.totalAmount) * 100;
      splitControl.patchValue({
        percentage: parseFloat(percentage.toFixed(2))
      }, { emitEvent: false });
    }

    this.calculateRemaining();
  }

  onSplitPercentageChange(index: number): void {
    const splitsArray = this.transactionForm.get('splits') as FormArray;
    const splitControl = splitsArray.at(index);
    const percentage = splitControl.get('percentage')?.value || 0;

    const amount = (this.totalAmount * percentage) / 100;
    splitControl.patchValue({
      amount: parseFloat(amount.toFixed(2))
    }, { emitEvent: false });

    this.calculateRemaining();
  }

  private calculateRemaining(): void {
    const splitsArray = this.transactionForm.get('splits') as FormArray;
    const totalSplit = splitsArray.controls.reduce((sum, control) => {
      return sum + (control.get('amount')?.value || 0);
    }, 0);

    this.remainingAmount = this.totalAmount - totalSplit;
  }

  onCategoryChange(event: any): void {
    const categoryId = event.value;
    const category = this.categoryList.find(cat => cat.id === categoryId);
    if (category) {
      this.transactionForm.patchValue({
        category: category.name
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.transactionForm.valid && !this.isSubmitting && Math.abs(this.remainingAmount) < 0.01) {
      this.isSubmitting = true;

      try {
        const formData = this.transactionForm.value;
        const splits: any[] = formData.splits.map((split: any) => ({
          userId: split.userId,
          amount: parseFloat(split.amount),
          percentage: parseFloat(split.percentage),
          isPaid: split.isPaid
        }));

        const request: CreateSplitTransactionRequest = {
          groupId: this.group.id!,
          payee: formData.payee.trim(),
          amount: parseFloat(formData.amount),
          type: formData.type,
          date: new Date(formData.date),
          notes: formData.notes?.trim() || '',
          categoryId: formData.categoryId,
          category: formData.category,
          splits: splits
        };

        await this.splitwiseService.createSplitTransaction(request);
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error creating split transaction:', error);
        this.notificationService.error('Failed to create split transaction');
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.transactionForm.markAllAsTouched();
      if (Math.abs(this.remainingAmount) >= 0.01) {
        this.notificationService.error('Split amounts must equal the total amount');
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(controlName: string): string {
    const control = this.transactionForm.get(controlName);
    if (control?.hasError('required')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    }
    if (control?.hasError('minlength')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    if (control?.hasError('min')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be greater than 0`;
    }
    return '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.group.currency
    }).format(amount);
  }

  getRemainingAmountClass(): string {
    if (Math.abs(this.remainingAmount) < 0.01) {
      return 'balanced';
    }
    return this.remainingAmount > 0 ? 'positive' : 'negative';
  }
} 