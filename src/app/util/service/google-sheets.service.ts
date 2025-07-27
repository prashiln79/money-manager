import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { Firestore, collection, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, Timestamp, addDoc, onSnapshot, writeBatch, serverTimestamp } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, from, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface GoogleSheetsConnection {
  id: string;
  name: string;
  spreadsheetId: string;
  sheetName: string;
  apiKey: string;
  isActive: boolean;
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleSheetsService extends BaseService {
  private readonly COLLECTION_NAME = 'googleSheetsConnections';
  private readonly GOOGLE_SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

  constructor(
    protected override readonly firestore: Firestore,
    protected override readonly auth: Auth
  ) {
    super(firestore, auth);
  }

  /**
   * Get all Google Sheets connections for the current user
   */
  getConnections(): Observable<GoogleSheetsConnection[]> {
    try {
      const collectionRef = this.getCollectionRef(this.COLLECTION_NAME);
      
      return from(getDocs(collectionRef)).pipe(
        map(snapshot => {
          return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as GoogleSheetsConnection));
        }),
        catchError(error => this.handleError(error, 'getConnections'))
      );
    } catch (error) {
      return this.handleError(error, 'getConnections');
    }
  }

  /**
   * Create a new Google Sheets connection
   */
  createConnection(connection: Omit<GoogleSheetsConnection, 'id' | 'createdAt' | 'updatedAt'>): Observable<GoogleSheetsConnection> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return throwError(() => new Error('User not authenticated'));
      }

      const newConnection: GoogleSheetsConnection = {
        ...connection,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = this.getDocumentRef(this.COLLECTION_NAME, newConnection.id);
      
      return from(setDoc(docRef, newConnection)).pipe(
        map(() => newConnection),
        catchError(error => this.handleError(error, 'createConnection'))
      );
    } catch (error) {
      return this.handleError(error, 'createConnection');
    }
  }

  /**
   * Update an existing Google Sheets connection
   */
  updateConnection(id: string, updates: Partial<GoogleSheetsConnection>): Observable<void> {
    try {
      const docRef = this.getDocumentRef(this.COLLECTION_NAME, id);
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      return from(updateDoc(docRef, updateData)).pipe(
        catchError(error => this.handleError(error, 'updateConnection'))
      );
    } catch (error) {
      return this.handleError(error, 'updateConnection');
    }
  }

  /**
   * Delete a Google Sheets connection
   */
  deleteConnection(id: string): Observable<void> {
    try {
      const docRef = this.getDocumentRef(this.COLLECTION_NAME, id);
      
      return from(deleteDoc(docRef)).pipe(
        catchError(error => this.handleError(error, 'deleteConnection'))
      );
    } catch (error) {
      return this.handleError(error, 'deleteConnection');
    }
  }

  /**
   * Test connection to Google Sheets
   */
  testConnection(config: GoogleSheetsConfig): Observable<boolean> {
    try {
      const url = `${this.GOOGLE_SHEETS_API_BASE}/${config.spreadsheetId}?key=${config.apiKey}`;
      
      return from(fetch(url)).pipe(
        switchMap(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return from(response.json());
        }),
        map((data: any) => {
          // Check if the sheet exists
          const sheetExists = data.sheets?.some((sheet: any) => 
            sheet.properties?.title === config.sheetName
          );
          return !!sheetExists;
        }),
        catchError(error => {
          console.error('Google Sheets connection test failed:', error);
          return of(false);
        })
      );
    } catch (error) {
      return of(false);
    }
  }

  /**
   * Import data from Google Sheets
   */
  importFromSheet(config: GoogleSheetsConfig): Observable<any[]> {
    try {
      const range = `${config.sheetName}!A:Z`; // Import all columns
      const url = `${this.GOOGLE_SHEETS_API_BASE}/${config.spreadsheetId}/values/${range}?key=${config.apiKey}`;
      
      return from(fetch(url)).pipe(
        switchMap(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return from(response.json());
        }),
        map((data: any) => {
          if (!data.values || data.values.length === 0) {
            return [];
          }

          // Assume first row contains headers
          const headers = data.values[0];
          const rows = data.values.slice(1);

          return rows.map((row: any[]) => {
            const obj: any = {};
            headers.forEach((header: string, index: number) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
        }),
        catchError(error => this.handleError(error, 'importFromSheet'))
      );
    } catch (error) {
      return this.handleError(error, 'importFromSheet');
    }
  }

  /**
   * Export data to Google Sheets
   */
  exportToSheet(config: GoogleSheetsConfig, data: any[]): Observable<boolean> {
    try {
      if (!data || data.length === 0) {
        return of(false);
      }

      // Convert data to 2D array format
      const headers = Object.keys(data[0]);
      const values = [
        headers,
        ...data.map(row => headers.map(header => row[header] || ''))
      ];

      const range = `${config.sheetName}!A1`;
      const url = `${this.GOOGLE_SHEETS_API_BASE}/${config.spreadsheetId}/values/${range}?valueInputOption=RAW&key=${config.apiKey}`;

      const body = {
        values: values
      };

      return from(fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })).pipe(
        map(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return true;
        }),
        catchError(error => {
          console.error('Export to Google Sheets failed:', error);
          return of(false);
        })
      );
    } catch (error) {
      return of(false);
    }
  }

  /**
   * Get Google Sheets API documentation URL
   */
  getApiDocsUrl(): string {
    return 'https://developers.google.com/sheets/api/guides/concepts';
  }

  /**
   * Get Google Sheets API setup instructions
   */
  getSetupInstructions(): string[] {
    return [
      '1. Go to Google Cloud Console (https://console.cloud.google.com/)',
      '2. Create a new project or select an existing one',
      '3. Enable the Google Sheets API',
      '4. Create credentials (API Key)',
      '5. Copy your API Key and paste it in the configuration',
      '6. Share your Google Sheet with the service account email (if using service account)',
      '7. Copy the Spreadsheet ID from the URL',
      '8. Enter the Sheet name (default is usually "Sheet1")'
    ];
  }
} 