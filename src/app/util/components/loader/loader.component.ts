import { Component, Input } from '@angular/core';
import { LoaderService } from '../../service/loader.service';
import { AsyncPipe, NgFor } from '@angular/common';

export interface SkeletonItem {
  width: string;
  height: string;
  margin: string;
}

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
  standalone: true,
  imports: [AsyncPipe, NgFor]
})
export class LoaderComponent {
  @Input() type: 'default' | 'dashboard' | 'transaction' | 'card' | 'list' = 'default';
  @Input() message: string = 'Loading...';
  
  loading$ = this.loaderService.loading$;
  skeletonItems: SkeletonItem[] = [];

  constructor(private loaderService: LoaderService) { }

  ngOnInit() {
    this.skeletonItems = this.getSkeletonItems();
  }

  trackByIndex(index: number): number {
    return index;
  }

  private getSkeletonItems(): SkeletonItem[] {
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
