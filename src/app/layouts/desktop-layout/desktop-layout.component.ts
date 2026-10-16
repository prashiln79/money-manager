import { Component, ChangeDetectionStrategy, inject, OnInit, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { SidebarNavParent, getAllNavigationItems } from '../../util/config/sidebar.config';
import { UserService } from '../../util/service/db/user.service';
import { AppState } from '../../store/app.state';
import { selectIsFamilyMode } from '../../store/profile/profile.selectors';
import { UserComponent } from '../../component/dashboard/header/user/user.component';
import { MatDialog } from '@angular/material/dialog';
import { MobileAddTransactionComponent } from '../../component/dashboard/transaction-list/add-transaction/mobile-add-transaction/mobile-add-transaction.component';

@Component({
  selector: 'app-desktop-layout',
  templateUrl: './desktop-layout.component.html',
  styleUrls: ['./desktop-layout.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TranslateModule,
    UserComponent
  ]
})
export class DesktopLayoutComponent implements OnInit {
  @Input() updateAvailable = false;
  @Output() refreshApp = new EventEmitter<void>();
  @Output() dismissUpdate = new EventEmitter<void>();

  public readonly userService = inject(UserService);
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  public readonly isSidebarCollapsed = signal(false);
  public navigationSections: SidebarNavParent[] = [];
  public isAdmin = false;

  readonly isFamilyMode = toSignal(this.store.select(selectIsFamilyMode), { initialValue: false });
  readonly isGuestUser = toSignal(
    this.userService.userAuth$.pipe(map(u => u?.uid === 'offline-guest')),
    { initialValue: false }
  );

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  ngOnInit(): void {
    this.isAdmin = this.userService.isAdmin;
    this.navigationSections = getAllNavigationItems();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(collapsed => !collapsed);
  }

  toggleSection(section: SidebarNavParent): void {
    if (section.isCollapsible) {
      section.isExpanded = !section.isExpanded;
    }
  }

  openAddTransaction(): void {
    this.dialog.open(MobileAddTransactionComponent, {
      closeOnNavigation: false,
      panelClass: 'desktop-dialog'
    });
  }

  async logout(): Promise<void> {
    await this.userService.logout();
  }
}
