import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from 'src/app/component/dashboard/chat/chat.component';

@Component({
  selector: 'app-dashboard-mobile-page',
  templateUrl: './dashboard-mobile-page.component.html',
  styleUrls: ['./dashboard-mobile-page.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ChatComponent]
})
export class DashboardMobilePageComponent {}
