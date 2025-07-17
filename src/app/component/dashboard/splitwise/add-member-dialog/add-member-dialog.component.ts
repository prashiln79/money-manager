import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Auth } from '@angular/fire/auth';
import { NotificationService } from 'src/app/util/service/notification.service';
import { SplitwiseService } from 'src/app/util/service/splitwise.service';
import { SplitwiseGroup, AddMemberRequest, GroupMemberRole } from 'src/app/util/models/splitwise.model';

@Component({
  selector: 'app-add-member-dialog',
  templateUrl: './add-member-dialog.component.html',
  styleUrls: ['./add-member-dialog.component.scss']
})
export class AddMemberDialogComponent implements OnInit {
  memberForm: FormGroup;
  isSubmitting = false;
  group: SplitwiseGroup;
  roles = Object.values(GroupMemberRole);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddMemberDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { group: SplitwiseGroup },
    private auth: Auth,
    private splitwiseService: SplitwiseService,
    private notificationService: NotificationService
  ) {
    this.group = data.group;
    this.memberForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      role: [GroupMemberRole.MEMBER, Validators.required]
    });
  }

  ngOnInit(): void {
    // Focus on email field
    setTimeout(() => {
      const emailField = document.querySelector('input[formControlName="email"]') as HTMLInputElement;
      if (emailField) {
        emailField.focus();
      }
    }, 100);
  }

  async onSubmit(): Promise<void> {
    if (this.memberForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      try {
        const formData = this.memberForm.value;
        const request: AddMemberRequest = {
          email: formData.email.trim().toLowerCase(),
          role: formData.role
        };

        await this.splitwiseService.addMemberToGroup(this.group.id!, request);
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error adding member:', error);
        this.notificationService.error('Failed to add member');
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.memberForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(controlName: string): string {
    const control = this.memberForm.get(controlName);
    if (control?.hasError('required')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    return '';
  }

  getRoleDisplayName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'admin': 'Admin',
      'member': 'Member'
    };
    return roleNames[role] || role;
  }

  getRoleDescription(role: string): string {
    const roleDescriptions: { [key: string]: string } = {
      'admin': 'Can manage group settings and members',
      'member': 'Can add expenses and view group activity'
    };
    return roleDescriptions[role] || '';
  }

  isEmailAlreadyMember(email: string): boolean {
    return this.group.members.some(member => 
      member.email.toLowerCase() === email.toLowerCase()
    );
  }

  onEmailChange(): void {
    const email = this.memberForm.get('email')?.value;
    if (email && this.isEmailAlreadyMember(email)) {
      this.memberForm.get('email')?.setErrors({ alreadyMember: true });
    }
  }
} 