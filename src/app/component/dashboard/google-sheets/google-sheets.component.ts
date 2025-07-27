import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { GoogleSheetsService, GoogleSheetsConnection, GoogleSheetsConfig } from '../../../util/service/google-sheets.service';

@Component({
  selector: 'app-google-sheets',
  templateUrl: './google-sheets.component.html',
  styleUrls: ['./google-sheets.component.scss']
})
export class GoogleSheetsComponent implements OnInit, OnDestroy {
  connections: GoogleSheetsConnection[] = [];
  isLoading = false;
  isTestingConnection = false;
  isImporting = false;
  isExporting = false;
  
  connectionForm: FormGroup;
  testConfig: GoogleSheetsConfig | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private googleSheetsService: GoogleSheetsService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.connectionForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      spreadsheetId: ['', [Validators.required]],
      sheetName: ['Sheet1', [Validators.required]],
      apiKey: ['', [Validators.required]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadConnections();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConnections(): void {
    this.isLoading = true;
    this.googleSheetsService.getConnections()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (connections) => {
          this.connections = connections;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading connections:', error);
          this.showSnackBar('Error loading connections', 'error');
          this.isLoading = false;
        }
      });
  }

  createConnection(): void {
    if (this.connectionForm.valid) {
      const connectionData = this.connectionForm.value;
      
      this.googleSheetsService.createConnection(connectionData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (connection) => {
            this.connections.push(connection);
            this.connectionForm.reset({ sheetName: 'Sheet1', isActive: true });
            this.showSnackBar('Connection created successfully', 'success');
          },
          error: (error) => {
            console.error('Error creating connection:', error);
            this.showSnackBar('Error creating connection', 'error');
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  updateConnection(connection: GoogleSheetsConnection): void {
    const updates = {
      name: connection.name,
      isActive: connection.isActive
    };

    this.googleSheetsService.updateConnection(connection.id, updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackBar('Connection updated successfully', 'success');
        },
        error: (error) => {
          console.error('Error updating connection:', error);
          this.showSnackBar('Error updating connection', 'error');
        }
      });
  }

  deleteConnection(connection: GoogleSheetsConnection): void {
    if (confirm(`Are you sure you want to delete the connection "${connection.name}"?`)) {
      this.googleSheetsService.deleteConnection(connection.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.connections = this.connections.filter(c => c.id !== connection.id);
            this.showSnackBar('Connection deleted successfully', 'success');
          },
          error: (error) => {
            console.error('Error deleting connection:', error);
            this.showSnackBar('Error deleting connection', 'error');
          }
        });
    }
  }

  testConnection(): void {
    if (this.connectionForm.valid) {
      this.isTestingConnection = true;
      this.testConfig = this.connectionForm.value;

      this.googleSheetsService.testConnection(this.testConfig!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (isValid) => {
            this.isTestingConnection = false;
            if (isValid) {
              this.showSnackBar('Connection test successful!', 'success');
            } else {
              this.showSnackBar('Connection test failed. Please check your configuration.', 'error');
            }
          },
          error: (error) => {
            this.isTestingConnection = false;
            console.error('Connection test error:', error);
            this.showSnackBar('Connection test failed', 'error');
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  importFromSheet(connection: GoogleSheetsConnection): void {
    this.isImporting = true;
    const config: GoogleSheetsConfig = {
      spreadsheetId: connection.spreadsheetId,
      sheetName: connection.sheetName,
      apiKey: connection.apiKey
    };

    this.googleSheetsService.importFromSheet(config)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.isImporting = false;
          if (data.length > 0) {
            this.showSnackBar(`Successfully imported ${data.length} rows from Google Sheets`, 'success');
            // Here you would typically process the imported data
            console.log('Imported data:', data);
          } else {
            this.showSnackBar('No data found in the specified sheet', 'warning');
          }
        },
        error: (error) => {
          this.isImporting = false;
          console.error('Import error:', error);
          this.showSnackBar('Error importing data from Google Sheets', 'error');
        }
      });
  }

  exportToSheet(connection: GoogleSheetsConnection): void {
    this.isExporting = true;
    const config: GoogleSheetsConfig = {
      spreadsheetId: connection.spreadsheetId,
      sheetName: connection.sheetName,
      apiKey: connection.apiKey
    };

    // Sample data for export - in real implementation, this would come from your app's data
    const sampleData = [
      { Date: '2024-01-01', Description: 'Sample Transaction', Amount: 100, Category: 'Food' },
      { Date: '2024-01-02', Description: 'Another Transaction', Amount: 50, Category: 'Transport' }
    ];

    this.googleSheetsService.exportToSheet(config, sampleData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          this.isExporting = false;
          if (success) {
            this.showSnackBar('Data exported to Google Sheets successfully', 'success');
          } else {
            this.showSnackBar('Failed to export data to Google Sheets', 'error');
          }
        },
        error: (error) => {
          this.isExporting = false;
          console.error('Export error:', error);
          this.showSnackBar('Error exporting data to Google Sheets', 'error');
        }
      });
  }

  getSetupInstructions(): string[] {
    return this.googleSheetsService.getSetupInstructions();
  }

  openApiDocs(): void {
    window.open(this.googleSheetsService.getApiDocsUrl(), '_blank');
  }

  private markFormGroupTouched(): void {
    Object.keys(this.connectionForm.controls).forEach(key => {
      const control = this.connectionForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSnackBar(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: type === 'error' ? ['error-snackbar'] : type === 'warning' ? ['warning-snackbar'] : ['success-snackbar']
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.connectionForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'This field is required';
      }
      if (field.errors['minlength']) {
        return `Minimum length is ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }
} 