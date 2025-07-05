import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  template: `
    <div class="skeleton-container" [ngClass]="type">
      <div class="skeleton-item rounded-lg" 
           *ngFor="let item of items; trackBy: trackByIndex"
           [style.width]="item.width"
           [style.height]="item.height"
           [style.margin]="item.margin">
      </div>
    </div>
  `,
  styleUrls: ['./skeleton-loader.component.scss']
})
export class SkeletonLoaderComponent {
  @Input() type: 'dashboard' | 'transaction' | 'card' | 'list' | 'custom' = 'dashboard';
  @Input() items: SkeletonItem[] = [];

  ngOnInit() {
    if (this.items.length === 0) {
      this.items = this.getDefaultItems();
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  private getDefaultItems(): SkeletonItem[] {
    switch (this.type) {
      case 'dashboard':
        return [
          { width: '100%', height: '60px', margin: '0 0 16px 0' },
          { width: '100%', height: '120px', margin: '0 0 16px 0' },
          { width: '48%', height: '80px', margin: '0 0 16px 0' },
          { width: '48%', height: '80px', margin: '0 0 16px 0' },
          { width: '100%', height: '200px', margin: '0' }
        ];
      case 'transaction':
        return [
          { width: '100%', height: '20px', margin: '0 0 8px 0' },
          { width: '70%', height: '16px', margin: '0 0 8px 0' },
          { width: '50%', height: '16px', margin: '0 0 16px 0' },
          { width: '100%', height: '1px', margin: '0 0 16px 0' },
          { width: '100%', height: '20px', margin: '0 0 8px 0' },
          { width: '60%', height: '16px', margin: '0 0 8px 0' },
          { width: '40%', height: '16px', margin: '0' }
        ];
      case 'card':
        return [
          { width: '100%', height: '20px', margin: '0 0 12px 0' },
          { width: '80%', height: '16px', margin: '0 0 8px 0' },
          { width: '60%', height: '16px', margin: '0' }
        ];
      case 'list':
        return [
          { width: '100%', height: '20px', margin: '0 0 12px 0' },
          { width: '100%', height: '20px', margin: '0 0 12px 0' },
          { width: '100%', height: '20px', margin: '0 0 12px 0' },
          { width: '100%', height: '20px', margin: '0 0 12px 0' },
          { width: '100%', height: '20px', margin: '0' }
        ];
      default:
        return [
          { width: '100%', height: '20px', margin: '0 0 8px 0' },
          { width: '80%', height: '16px', margin: '0' }
        ];
    }
  }
}

export interface SkeletonItem {
  width: string;
  height: string;
  margin: string;
} 