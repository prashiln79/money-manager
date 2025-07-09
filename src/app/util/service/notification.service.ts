import { Injectable } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";
import { APP_CONFIG } from "../config/config";

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  // Define a common snack bar config object using APP_CONFIG
  private defaultConfig: MatSnackBarConfig = {
    duration: APP_CONFIG.NOTIFICATIONS.AUTO_HIDE_DELAY, // Use config duration
    horizontalPosition: APP_CONFIG.NOTIFICATIONS.POSITION.split('-')[1] as 'left' | 'center' | 'right', // Extract position from config
    verticalPosition: this.isMobile() ? 'bottom' : APP_CONFIG.NOTIFICATIONS.POSITION.split('-')[0] as 'top' | 'bottom', // Extract position from config
    panelClass: this.isMobile() ? ['snack-bar-success', 'mobile-notification'] : ['snack-bar-success'], // Add mobile class for custom positioning
  };

  // Check if device is mobile
  private isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  constructor(private snackBar: MatSnackBar) {}

  // Show success message
  success(message: string, action: string = "Close"): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      panelClass: this.isMobile() ? ['snack-bar-success', 'mobile-notification'] : ['snack-bar-success'],
    });
  }

  // Show error message
  error(message: string, action: string = "Close"): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      panelClass: this.isMobile() ? ['snack-bar-error', 'mobile-notification'] : ['snack-bar-error'],
    });
  }

  // Show info message
  info(message: string, action: string = "Close"): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      panelClass: this.isMobile() ? ['snack-bar-info', 'mobile-notification'] : ['snack-bar-info'],
    });
  }

  // Show warning message
  warning(message: string, action: string = "Close"): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      panelClass: this.isMobile() ? ['snack-bar-warning', 'mobile-notification'] : ['snack-bar-warning'],
    });
  }

  // Optionally, you can also allow dynamic config for specific cases
  showCustom(message: string, action: string = "Notification", customConfig: MatSnackBarConfig = {}): void {
    const config = { ...this.defaultConfig, ...customConfig }; // Merge default config with custom config
    this.snackBar.open(message, action, config);
  }
}
