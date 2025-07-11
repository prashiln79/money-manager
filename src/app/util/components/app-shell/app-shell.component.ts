import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AppShellService, AppShellState } from '../../service/app-shell.service';
import { APP_CONFIG } from '../../config/config';

@Component({
  selector: 'app-shell',
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss']
})
export class AppShellComponent implements OnInit, OnDestroy {
  APP_CONFIG = APP_CONFIG;
  state: AppShellState = {
    isVisible: false,
    loadingMessage: `Loading ${APP_CONFIG.APP_NAME}`,
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