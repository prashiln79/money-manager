import { Injectable } from '@angular/core';

export interface HapticFeedbackOptions {
  duration?: number;
  pattern?: number[];
  intensity?: 'light' | 'medium' | 'heavy';
}

@Injectable({
  providedIn: 'root'
})
export class HapticFeedbackService {
  private isSupported: boolean;
  private isMobile: boolean;

  constructor() {
    this.isSupported = 'vibrate' in navigator;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Check if haptic feedback is supported
   */
  public isHapticSupported(): boolean {
    return this.isSupported && this.isMobile;
  }

  /**
   * Check if device is mobile
   */
  public isMobileDevice(): boolean {
    return this.isMobile;
  }

  /**
   * Light vibration (short)
   */
  public lightVibration(): void {
    if (!this.isHapticSupported()) return;
    
    try {
      navigator.vibrate(50);
    } catch (error) {
      console.warn('Vibration failed:', error);
    }
  }

  /**
   * Medium vibration (standard)
   */
  public mediumVibration(): void {
    if (!this.isHapticSupported()) return;
    
    try {
      navigator.vibrate(100);
    } catch (error) {
      console.warn('Vibration failed:', error);
    }
  }

  /**
   * Heavy vibration (long)
   */
  public heavyVibration(): void {
    if (!this.isHapticSupported()) return;
    
    try {
      navigator.vibrate(200);
    } catch (error) {
      console.warn('Vibration failed:', error);
    }
  }

  /**
   * Custom vibration pattern
   */
  public customVibration(pattern: number[]): void {
    if (!this.isHapticSupported()) return;
    
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Vibration failed:', error);
    }
  }

  /**
   * Vibration with options
   */
  public vibrate(options: HapticFeedbackOptions = {}): void {
    if (!this.isHapticSupported()) return;

    const { duration = 100, pattern, intensity = 'medium' } = options;

    try {
      if (pattern) {
        navigator.vibrate(pattern);
      } else {
        let vibrationDuration = duration;
        
        switch (intensity) {
          case 'light':
            vibrationDuration = 50;
            break;
          case 'medium':
            vibrationDuration = 100;
            break;
          case 'heavy':
            vibrationDuration = 200;
            break;
        }
        
        navigator.vibrate(vibrationDuration);
      }
    } catch (error) {
      console.warn('Vibration failed:', error);
    }
  }

  /**
   * Success vibration pattern
   */
  public successVibration(): void {
    if (!this.isHapticSupported()) return;
    
    try {
      navigator.vibrate([50, 100, 50]);
    } catch (error) {
      console.warn('Vibration failed:', error);
    }
  }

  /**
   * Error vibration pattern
   */
  public errorVibration(): void {
    if (!this.isHapticSupported()) return;
    
    try {
      navigator.vibrate([100, 50, 100, 50, 100]);
    } catch (error) {
      console.warn('Vibration failed:', error);
    }
  }

  /**
   * Warning vibration pattern
   */
  public warningVibration(): void {
    if (!this.isHapticSupported()) return;
    
    try {
      navigator.vibrate([100, 100, 100]);
    } catch (error) {
      console.warn('Vibration failed:', error);
    }
  }

  /**
   * Button click vibration (standard for UI interactions)
   */
  public buttonClick(): void {
    this.lightVibration();
  }

  /**
   * Navigation vibration (for page transitions)
   */
  public navigationClick(): void {
    this.mediumVibration();
  }

  /**
   * Important action vibration (for critical actions)
   */
  public importantAction(): void {
    this.heavyVibration();
  }

  /**
   * Stop any ongoing vibration
   */
  public stopVibration(): void {
    if (!this.isSupported) return;
    
    try {
      navigator.vibrate(0);
    } catch (error) {
      console.warn('Stop vibration failed:', error);
    }
  }

  /**
   * Test vibration (for debugging)
   */
  public testVibration(): void {
    if (!this.isHapticSupported()) {
      console.log('Haptic feedback not supported on this device');
      return;
    }
    
    console.log('Testing haptic feedback...');
    this.lightVibration();
    
    setTimeout(() => {
      this.mediumVibration();
    }, 500);
    
    setTimeout(() => {
      this.heavyVibration();
    }, 1000);
  }
} 