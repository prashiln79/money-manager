import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from 'src/app/component/dashboard/chat/chat.component';

@Component({
  selector: 'app-dashboard-desktop-page',
  templateUrl: './dashboard-desktop-page.component.html',
  styleUrls: ['./dashboard-desktop-page.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ChatComponent]
})
export class DashboardDesktopPageComponent {}
