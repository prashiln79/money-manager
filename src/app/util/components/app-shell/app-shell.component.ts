import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AppShellService, AppShellState } from '../../service/app-shell.service';

@Component({
  selector: 'app-shell',
  template: `
    <div class="app-shell" [class.app-shell-hidden]="!state.isVisible">
      <header class="app-shell-header">
        <div class="app-shell-logo">
          <div class="app-shell-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
          </div>
          <span class="font-heading font-semibold text-xl">Money Manager</span>
        </div>
        <div class="app-shell-skeleton w-10 h-10 rounded-full"></div>
      </header>
      
      <main class="app-shell-content">
        <div class="app-shell-loading">
          <div class="app-shell-spinner"></div>
          <h2 class="font-heading font-semibold text-2xl mb-2">{{ state.loadingMessage }}</h2>
          <p class="text-sm opacity-80">{{ state.loadingSubMessage }}</p>
        </div>
        
        <div class="app-shell-skeleton-content">
          <app-skeleton-loader type="dashboard"></app-skeleton-loader>
        </div>
      </main>
      
      <footer class="app-shell-footer">
        <p class="m-0 text-sm">© 2024 Money Manager - Your Personal Finance Assistant</p>
      </footer>
    </div>
  `,
  styleUrls: ['./app-shell.component.scss']
})
export class AppShellComponent implements OnInit, OnDestroy {
  state: AppShellState = {
    isVisible: false,
    loadingMessage: 'Loading Money Manager',
    loadingSubMessage: 'Preparing your financial dashboard...'
  };
  private destroy$ = new Subject<void>();

  constructor(
    private appShellService: AppShellService
  ) {}

  ngOnInit() {
    // Subscribe to app shell state changes
    this.appShellService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.state = state;
      });

    // Show initial load
    this.appShellService.showInitialLoad();

    // Hide app shell after a short delay to allow Angular to initialize
    // This ensures it only shows during initial app load
    setTimeout(() => {
      this.appShellService.hide();
    }, 2000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 