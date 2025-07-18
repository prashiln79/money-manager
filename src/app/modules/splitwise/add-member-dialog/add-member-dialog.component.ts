import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Auth } from '@angular/fire/auth';
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

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddMemberDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { group: SplitwiseGroup },
    private auth: Auth
  ) {
    this.group = data.group;
    this.memberForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
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
          role: GroupMemberRole.MEMBER
        };

        // Return the request to be handled by the parent component via NgRx
        this.dialogRef.close(request);
      } catch (error) {
        console.error('Error adding member:', error);
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



  isEmailAlreadyMember(email: string): boolean {
    return this.group.members.some(member => 
      member.email.toLowerCase() === email.toLowerCase()
    );
  }

  getRoleDisplayName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'admin': 'Admin',
      'member': 'Member'
    };
    return roleNames[role] || role;
  }

  onEmailChange(): void {
    const email = this.memberForm.get('email')?.value;
    if (email && this.isEmailAlreadyMember(email)) {
      this.memberForm.get('email')?.setErrors({ alreadyMember: true });
    }
  }

} 