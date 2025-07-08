import { Component, Inject, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { HapticFeedbackService } from 'src/app/util/service/haptic-feedback.service';
import { NotificationService } from 'src/app/util/service/notification.service';
import {
  Category,
  AVAILABLE_ICONS,
  AVAILABLE_COLORS,
} from 'src/app/util/models';
import { IconSelectorDialogComponent } from '../icon-selector-dialog/icon-selector-dialog.component';
import { ColorSelectorDialogComponent } from '../color-selector-dialog/color-selector-dialog.component';
import { AppState } from 'src/app/store/app.state';
import { Store } from '@ngrx/store';
import { createCategory, updateCategory } from 'src/app/store/categories/categories.actions';

@Component({
  selector: 'app-mobile-category-add-edit-popup',
  templateUrl: './mobile-category-add-edit-popup.component.html',
  styleUrls: ['./mobile-category-add-edit-popup.component.scss'],
})
export class MobileCategoryAddEditPopupComponent implements OnInit {
  categoryForm: FormGroup;
  public availableIcons: string[] = AVAILABLE_ICONS;

  public availableColors: string[] = AVAILABLE_COLORS;

  public isSubmitting: boolean = false;
  public userId: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: Category | null,
    private store: Store<AppState>,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MobileCategoryAddEditPopupComponent>,
    private auth: Auth,
    private notificationService: NotificationService,
    private router: Router,
    private hapticFeedback: HapticFeedbackService,
    private dialog: MatDialog
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      type: ['expense', Validators.required],
      icon: ['category', Validators.required],
      color: ['#46777f', Validators.required],
    });
  }

  ngOnInit(): void {
    this.userId = this.auth.currentUser?.uid || '';

    // Handle browser back button
    window.addEventListener('popstate', (event) => {
      this.dialogRef.close();
      event.preventDefault();
    });

    if (this.dialogData) {
      // Edit mode - populate form with existing data
      this.categoryForm.patchValue({
        name: this.dialogData.name,
        type: this.dialogData.type,
        icon: this.dialogData.icon || 'category',
        color: this.dialogData.color || '#46777f',
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
          await this.store.dispatch(
            updateCategory({
              userId: this.userId,
              categoryId: this.dialogData.id,
              name: formValue.name.trim(),
              categoryType: formValue.type,
              icon: formValue.icon,
              color: formValue.color,
            })
          );
          this.notificationService.success('Category updated successfully');
        } else {
          // Create new category
          await this.store.dispatch(
            createCategory({
              userId: this.userId,
              name: formValue.name.trim(),
              categoryType: formValue.type,
              icon: formValue.icon,
              color: formValue.color,
            })
          );
          this.notificationService.success('Category added successfully');
          this.hapticFeedback.successVibration();
        }

        this.dialogRef.close(true);
        this.router.navigate(['/dashboard/category']);
      } catch (error) {
        this.notificationService.error('Failed to save category');
        console.error('Error saving category:', error);
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  selectType(type: 'income' | 'expense'): void {
    this.categoryForm.patchValue({ type });
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

  openIconSelectorDialog(): void {
    this.dialog
      .open(IconSelectorDialogComponent, {
        width: '90vw',
        maxWidth: '500px',
        height: '80vh',
        maxHeight: '600px',
        data: {
          currentIcon: this.categoryForm.get('icon')?.value,
          availableIcons: this.availableIcons,
        },
        disableClose: false,
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((selectedIcon: string) => {
        if (selectedIcon) {
          this.categoryForm.patchValue({ icon: selectedIcon });
          this.hapticFeedback.lightVibration();
        }
      });
  }

  openColorSelectorDialog(): void {
    const dialogRef = this.dialog.open(ColorSelectorDialogComponent, {
      width: '90vw',
      maxWidth: '500px',
      height: '80vh',
      maxHeight: '600px',
      data: {
        currentColor: this.categoryForm.get('color')?.value,
        availableColors: this.availableColors,
      },
      disableClose: false,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((selectedColor: string) => {
      if (selectedColor) {
        this.categoryForm.patchValue({ color: selectedColor });
        this.hapticFeedback.lightVibration();
      }
    });
  }
}
