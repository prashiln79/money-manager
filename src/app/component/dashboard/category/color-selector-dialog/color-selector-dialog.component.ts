import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CATEGORY_COLORS } from 'src/app/util/config/config';

export interface ColorSelectorDialogData {
  currentColor: string;
  availableColors: string[];
}

@Component({
  selector: 'app-color-selector-dialog',
  templateUrl: './color-selector-dialog.component.html',
  styleUrls: ['./color-selector-dialog.component.scss']
})
export class ColorSelectorDialogComponent implements OnInit {
  public availableColors: string[] = CATEGORY_COLORS;
  public selectedColor: string;
  public searchTerm: string = '';
  public filteredColors: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<ColorSelectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ColorSelectorDialogData
  ) {
    this.selectedColor = data.currentColor || '#46777f';
    this.filteredColors = [...this.availableColors];
  }

  ngOnInit(): void {
    if (this.data.availableColors) {
      this.availableColors = this.data.availableColors;
      this.filteredColors = [...this.availableColors];
    }
  }

  public selectColor(color: string): void {
    this.selectedColor = color;
    this.dialogRef.close(color);
  }

  public onSearchChange(): void {
    if (!this.searchTerm.trim()) {
      this.filteredColors = [...this.availableColors];
    } else {
      this.filteredColors = this.availableColors.filter(color =>
        color.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  public clearSearch(): void {
    this.searchTerm = '';
    this.filteredColors = [...this.availableColors];
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public trackByColor(index: number, color: string): string {
    return color;
  }
} 