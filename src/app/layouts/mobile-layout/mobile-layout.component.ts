import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ElementRef, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from '../../component/dashboard/header/header.component';
import { FooterComponent } from '../../component/dashboard/footer/footer.component';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-mobile-layout',
  templateUrl: './mobile-layout.component.html',
  styleUrls: ['./mobile-layout.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent]
})
export class MobileLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('mainContent') mainContent!: ElementRef<HTMLElement>;

  @Input() updateAvailable = false;
  @Output() refreshApp = new EventEmitter<void>();
  @Output() dismissUpdate = new EventEmitter<void>();

  private router = inject(Router);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.mainContent) {
          requestAnimationFrame(() => {
            if (this.mainContent) {
              this.mainContent.nativeElement.scrollTop = 0;
            }
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
