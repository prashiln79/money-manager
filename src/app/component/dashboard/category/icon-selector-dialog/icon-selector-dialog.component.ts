import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AVAILABLE_ICONS } from 'src/app/util/models';

export interface IconSelectorDialogData {
  currentIcon: string;
  availableIcons: string[];
}

@Component({
  selector: 'app-icon-selector-dialog',
  templateUrl: './icon-selector-dialog.component.html',
  styleUrls: ['./icon-selector-dialog.component.scss']
})
export class IconSelectorDialogComponent implements OnInit {
  public availableIcons: string[] = AVAILABLE_ICONS;
  public selectedIcon: string;
  public searchTerm: string = '';
  public filteredIcons: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<IconSelectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IconSelectorDialogData
  ) {
    this.selectedIcon = data.currentIcon || 'category';
    this.filteredIcons = [...this.availableIcons];
  }

  ngOnInit(): void {
    if (this.data.availableIcons) {
      this.availableIcons = this.data.availableIcons;
      this.filteredIcons = [...this.availableIcons];
    }
  }

  public selectIcon(icon: string): void {
    this.selectedIcon = icon;
    this.dialogRef.close(icon);
  }

  public onSearchChange(): void {
    if (!this.searchTerm.trim()) {
      this.filteredIcons = [...this.availableIcons];
    } else {
      this.filteredIcons = this.availableIcons.filter(icon =>
        icon.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  public clearSearch(): void {
    this.searchTerm = '';
    this.filteredIcons = [...this.availableIcons];
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public trackByIcon(index: number, icon: string): string {
    return icon;
  }
} 