import { Injectable } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  // Define a common snack bar config object
  private defaultConfig: MatSnackBarConfig = {
    duration: 2000, // Duration for which the snack bar will stay visible
    horizontalPosition: 'right', // Horizontal position of the snack bar
    verticalPosition: 'top', // Vertical position of the snack bar
    panelClass: ['snack-bar-success'], // Default class for success (can be customized)
  };

  constructor(private snackBar: MatSnackBar) {}

  // Show success message
  success(message: string, action: string = "Close"): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      panelClass: ['snack-bar-success'],
    });
  }

  // Show error message
  error(message: string, action: string = "Close"): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      panelClass: ['snack-bar-error'],
    });
  }

  // Optionally, you can also allow dynamic config for specific cases
  showCustom(message: string, action: string = "Notification", customConfig: MatSnackBarConfig = {}): void {
    const config = { ...this.defaultConfig, ...customConfig }; // Merge default config with custom config
    this.snackBar.open(message, action, config);
  }
}
