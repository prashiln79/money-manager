import { Component, Inject, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CategoryService } from 'src/app/util/service/category.service';
import { HapticFeedbackService } from 'src/app/util/service/haptic-feedback.service';
import { NotificationService } from 'src/app/util/service/notification.service';

export interface Category {
  id?: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  createdAt: number;
}

@Component({
  selector: 'app-mobile-category',
  templateUrl: './mobile-category.component.html',
  styleUrls: ['./mobile-category.component.scss']
})
export class MobileCategoryComponent implements OnInit {
  categoryForm: FormGroup;
  public availableIcons: string[] = [
    'shopping_cart', 'restaurant', 'local_gas_station', 'home', 'directions_car',
    'flight', 'hotel', 'local_hospital', 'school', 'work', 'sports_esports',
    'movie', 'music_note', 'fitness_center', 'pets', 'child_care', 'elderly',
    'celebration', 'card_giftcard', 'local_offer', 'account_balance', 'trending_up',
    'attach_money', 'account_balance_wallet', 'credit_card', 'savings', 'payments',
    'receipt', 'receipt_long', 'description', 'category', 'label', 'bookmark',
    'favorite', 'star', 'thumb_up', 'thumb_down', 'check_circle', 'cancel',
    'warning', 'info', 'help', 'settings', 'build', 'tune', 'filter_list',
    'add', 'remove', 'edit', 'delete', 'save', 'cancel', 'close', 'check',
    'arrow_back', 'arrow_forward', 'arrow_upward', 'arrow_downward', 'arrow_drop_up',
    'arrow_drop_down', 'arrow_drop_left', 'arrow_drop_right', 'arrow_back_ios',
    'arrow_forward_ios', 'arrow_upward_ios', 'arrow_downward_ios', 'arrow_drop_up_ios',
    'arrow_drop_down_ios', 'arrow_drop_left_ios', 'arrow_drop_right_ios', 'arrow_back_ios_new',
    'arrow_forward_ios_new', 'arrow_upward_ios_new', 'arrow_downward_ios_new', 'arrow_drop_up_ios_new',
  ];
  public showIconPicker: boolean = false;
  public isSubmitting: boolean = false;
  public userId: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: Category | null,
    private categoryService: CategoryService,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MobileCategoryComponent>,
    private auth: Auth,
    private notificationService: NotificationService,
    private router: Router,
    private hapticFeedback: HapticFeedbackService,
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      type: ['expense', Validators.required],
      icon: ['category', Validators.required],
    });
  }

  ngOnInit(): void {
    this.userId = this.auth.currentUser?.uid || '';
    
    // Handle browser back button
    window.addEventListener("popstate", (event) => {
      this.dialogRef.close();
      event.preventDefault();
    });

    // If editing, populate form with existing data
    if (this.dialogData) {
      this.categoryForm.patchValue({
        name: this.dialogData.name,
        type: this.dialogData.type,
        icon: this.dialogData.icon || 'category',
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.categoryForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      try {
        const formValue = this.categoryForm.value;
        
        if (this.dialogData?.id) {
          // Update existing category
          await this.categoryService.updateCategory(
            this.userId,
            this.dialogData.id,
            formValue.name.trim(),
            formValue.type,
            formValue.icon
          );
          this.notificationService.success("Category updated successfully");
        } else {
          // Create new category
          await this.categoryService.createCategory(
            this.userId,
            formValue.name.trim(),
            formValue.type,
            formValue.icon
          );
          this.notificationService.success("Category added successfully");
          this.hapticFeedback.successVibration();
        }

        this.dialogRef.close(true);
        this.router.navigate(["/dashboard/category"]);
      } catch (error) {
        this.notificationService.error("Failed to save category");
        console.error('Error saving category:', error);
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  toggleIconPicker(): void {
    this.showIconPicker = !this.showIconPicker;
  }

  selectIcon(icon: string): void {
    this.categoryForm.patchValue({ icon });
    this.showIconPicker = false;
  }

  closeIconPicker(): void {
    this.showIconPicker = false;
  }

  getNameError(): string {
    const nameControl = this.categoryForm.get('name');
    if (nameControl?.hasError('required')) {
      return 'Category name is required';
    }
    if (nameControl?.hasError('maxlength')) {
      return 'Category name must be 50 characters or less';
    }
    return '';
  }

  getTypeError(): string {
    const typeControl = this.categoryForm.get('type');
    if (typeControl?.hasError('required')) {
      return 'Category type is required';
    }
    return '';
  }
} 