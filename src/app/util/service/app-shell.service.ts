import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { APP_CONFIG } from '../config/config';

export interface AppShellState {
  isVisible: boolean;
  loadingMessage: string;
  loadingSubMessage: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppShellService {
  private stateSubject = new BehaviorSubject<AppShellState>({
    isVisible: false,
    loadingMessage: `Loading ${APP_CONFIG.APP_NAME}`,
    loadingSubMessage: 'Preparing your financial dashboard...'
  });

  public state$: Observable<AppShellState> = this.stateSubject.asObservable();

  constructor() {}

  show(message?: string, subMessage?: string) {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      isVisible: true,
      loadingMessage: message || currentState.loadingMessage,
      loadingSubMessage: subMessage || currentState.loadingSubMessage
    });
  }

  hide() {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      isVisible: false
    });
  }

  updateMessage(message: string, subMessage?: string) {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      loadingMessage: message,
      loadingSubMessage: subMessage || currentState.loadingSubMessage
    });
  }



  // Predefined loading scenarios
  showInitialLoad() {
    this.show('Loading Money Manager', 'Initializing your financial dashboard...');
  }

  showDataSync() {
    this.show('Syncing Data', 'Updating your financial information...');
  }

  showOfflineMode() {
    this.show('Offline Mode', 'Loading cached data for offline use...');
  }

  showAuthentication() {
    this.show('Authenticating', 'Verifying your credentials...');
  }
} 