import { Component, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { TextFieldModule } from '@angular/cdk/text-field';
import { Note, NOTE_COLORS } from '../note.model';
import { ConfirmDialogComponent } from 'src/app/util/components/confirm-dialog/confirm-dialog.component';
import { CategoryFacadeService } from 'src/app/util/service/db/category-facade.service';
import { UserService } from 'src/app/util/service/db/user.service';

@Component({
  selector: 'app-note-add-sheet',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSelectModule,
    TextFieldModule,
  ],
  templateUrl: './note-add-sheet.component.html',
  styleUrls: ['./note-add-sheet.component.scss']
})
export class NoteAddSheetComponent implements OnInit {
  private bottomSheetRef = inject(MatBottomSheetRef<NoteAddSheetComponent>, { optional: true });
  private dialogRef = inject(MatDialogRef<NoteAddSheetComponent>, { optional: true });
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private categoryFacadeService = inject(CategoryFacadeService);
  private userService = inject(UserService);

  public bottomSheetData = inject<{ note?: Note, mode?: 'add' | 'edit' | 'view' }>(MAT_BOTTOM_SHEET_DATA, { optional: true });
  public dialogData = inject<{ note?: Note, mode?: 'add' | 'edit' | 'view' }>(MAT_DIALOG_DATA, { optional: true });
  public data = this.bottomSheetData || this.dialogData;
  public isDialog = !!this.dialogRef;
  public currentMode = signal<'add' | 'edit' | 'view'>(this.data?.mode || (this.data?.note ? 'edit' : 'add'));
  
  public categories$ = this.categoryFacadeService.getCategories(this.userService.getCurrentUserId() || '');
  @ViewChild('noteTextarea') noteTextarea!: ElementRef<HTMLTextAreaElement>;
  hasSelection = signal(false);

  title = '';
  content = '';
  selectedColor = signal(NOTE_COLORS[0].value);
  selectedCategoryIds: string[] = [];
  noteColors = NOTE_COLORS;

  ngOnInit() {
    if (this.data?.note) {
      this.title = this.data.note.title;
      this.content = this.data.note.content;
      this.selectedColor.set(this.data.note.color);
      this.selectedCategoryIds = this.data.note.categoryIds || [];
    }
  }

  private close(result?: any) {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss(result);
    } else if (this.dialogRef) {
      this.dialogRef.close(result);
    }
  }

  save() {
    if (!this.title.trim() && !this.content.trim()) {
      this.close();
      return;
    }
    this.close({
      title: this.title.trim() || 'Untitled',
      content: this.content.trim(),
      color: this.selectedColor(),
      categoryIds: this.selectedCategoryIds
    });
  }

  delete() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '320px',
      data: {
        title: 'Delete Note',
        message: 'Are you sure you want to delete this note? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'delete'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.close({ action: 'delete' });
      }
    });
  }

  cancel() {
    this.close();
  }

  setColor(color: string) {
    if (this.currentMode() === 'view') return;
    this.selectedColor.set(color);
  }

  switchToEdit() {
    this.currentMode.set('edit');
  }

  copyToClipboard() {
    const textarea = this.noteTextarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // If text is selected, copy only that. Otherwise copy everything.
    const textToCopy = (start !== end) 
      ? textarea.value.substring(start, end) 
      : this.content;

    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
      const message = (start !== end) ? 'Selection copied' : 'Full note copied';
      this.snackBar.open(message, '', { duration: 2000 });
    });
  }

  checkSelection() {
    if (!this.noteTextarea) return;
    const textarea = this.noteTextarea.nativeElement;
    this.hasSelection.set(textarea.selectionStart !== textarea.selectionEnd);
  }

  async pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        this.content = (this.content || '') + text;
        this.snackBar.open('Pasted from clipboard', '', { duration: 2000 });
      }
    } catch (err) {
      this.snackBar.open('Clipboard access denied', '', { duration: 2000 });
    }
  }
}
