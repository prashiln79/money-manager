import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-settings',
  template: `
    <div class="settings-container">
      <div class="section-header">
        <h2>Admin Settings</h2>
        <p>Configure application settings and preferences</p>
      </div>
      
      <div class="settings-content">
        <div class="settings-card">
          <h3>Coming Soon</h3>
          <p>Admin settings will be implemented in future updates.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 2rem;
    }
    
    .section-header {
      margin-bottom: 2rem;
    }
    
    .section-header h2 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 0.5rem 0;
    }
    
    .section-header p {
      font-size: 1rem;
      color: #6b7280;
      margin: 0;
    }
    
    .settings-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      text-align: center;
    }
    
    .settings-card h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 1rem 0;
    }
    
    .settings-card p {
      font-size: 1rem;
      color: #6b7280;
      margin: 0;
    }
  `]
})
export class AdminSettingsComponent {
  // Settings functionality will be implemented in future updates
} 