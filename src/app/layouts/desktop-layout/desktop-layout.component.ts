import { Component, ChangeDetectionStrategy, inject, OnInit, Input, Output, EventEmitter, signal, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { SidebarNavParent, getAllNavigationItems } from '../../util/config/sidebar.config';
import { UserService } from '../../util/service/db/user.service';
import { AppState } from '../../store/app.state';
import { selectIsFamilyMode } from '../../store/profile/profile.selectors';
import { selectUserFamilies } from '../../modules/family/store/family.selectors';
import { FamilyService } from '../../modules/family/services/family.service';
import { FooterService, FooterAction } from '../../component/dashboard/footer/footer.service';
import { UserComponent } from '../../component/dashboard/header/user/user.component';
import { MatDialog } from '@angular/material/dialog';
import { MobileAddTransactionComponent } from '../../component/dashboard/transaction-list/add-transaction/mobile-add-transaction/mobile-add-transaction.component';
import { LocalStorageKey } from '../../util/models/local-storage.model';
import { APP_CONFIG } from '../../util/config/config';

export interface DesktopHeaderItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  action?: () => void;
  badge?: string | number;
  bgClass?: string;
  isImage?: boolean;
}

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
    MatBadgeModule,
    TranslateModule,
    UserComponent
  ]
})
export class DesktopLayoutComponent implements OnInit {
  @Input() updateAvailable = false;
  @Output() refreshApp = new EventEmitter<void>();
  @Output() dismissUpdate = new EventEmitter<void>();

  readonly appName = APP_CONFIG.APP_NAME;
  public readonly userService = inject(UserService);
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  public readonly footerService = inject(FooterService);
  public readonly familyService = inject(FamilyService);

  private getInitialSidebarCollapsed(): boolean {
    try {
      return localStorage.getItem(LocalStorageKey.SIDEBAR_COLLAPSED) === 'true';
    } catch {
      return false;
    }
  }

  public readonly isSidebarCollapsed = signal(this.getInitialSidebarCollapsed());
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
    this.isSidebarCollapsed.update(collapsed => {
      const next = !collapsed;
      try {
        localStorage.setItem(LocalStorageKey.SIDEBAR_COLLAPSED, String(next));
      } catch (e) {
        console.error('Failed to save sidebar state to storage', e);
      }
      return next;
    });
  }

  toggleSection(section: SidebarNavParent): void {
    if (section.isCollapsible) {
      section.isExpanded = !section.isExpanded;
    }
  }

  readonly userFamilies = toSignal(
    this.store.select(selectUserFamilies),
    { initialValue: [] }
  );

  readonly activeFamily = computed(() => {
    const activeId = this.isFamilyMode() ? this.familyService.activeFamilyId() : null;
    return activeId ? this.userFamilies().find(f => f.id === activeId) : null;
  });

  readonly activeFamilyIcon = computed(() => this.activeFamily()?.icon || 'family_restroom');

  isImageIcon(icon: string | null | undefined): boolean {
    return !!icon && icon.startsWith('data:');
  }

  readonly fabAction = computed(() => {
    const config = this.footerService.currentConfig();
    if (!config?.fab || config.hideFab) return null;
    const resolve = <T>(val: T | Signal<T> | undefined): T | undefined =>
      typeof val === 'function' ? (val as Signal<T>)() : val;
    return {
      icon: resolve(config.fab.icon) || 'add',
      label: resolve(config.fab.label) || 'Add',
      action: config.fab.action,
      hideFab: config.hideFab
    };
  });

  readonly dynamicNavItems = computed<DesktopHeaderItem[]>(() => {
    const custom = this.footerService.currentConfig();
    const isFamily = this.isFamilyMode();
    const family = this.activeFamily();
    const familyId = this.familyService.activeFamilyId();

    const resolve = <T>(val: T | Signal<T> | undefined): T | undefined =>
      typeof val === 'function' ? (val as Signal<T>)() : val;

    if (custom?.items && custom.items.length > 0) {
      return custom.items.map(item => ({
        id: item.id,
        label: resolve(item.label) || '',
        icon: resolve(item.icon),
        route: item.route,
        action: item.action,
        badge: resolve(item.badge),
        bgClass: item.bgClass,
        isImage: this.isImageIcon(resolve(item.icon))
      }));
    }

    if (isFamily) {
      const isSplit = family?.mode === 'split';
      return [
        {
          id: 'family-home',
          label: family?.name ? family.name : 'Home',
          icon: this.activeFamilyIcon(),
          route: familyId ? `/dashboard/family/dashboard/${familyId}` : '/dashboard/family',
          isImage: this.isImageIcon(this.activeFamilyIcon())
        },
        {
          id: 'transactions',
          label: 'NAVIGATION.EXPENSE',
          icon: 'receipt_long',
          route: '/dashboard/transactions'
        },
        {
          id: 'accounts',
          label: 'NAVIGATION.ACCOUNTS',
          icon: 'account_balance',
          route: '/dashboard/accounts'
        },
        {
          id: 'categories',
          label: 'NAVIGATION.CATEGORIES',
          icon: 'category',
          route: '/dashboard/category'
        },
        {
          id: 'reports',
          label: isSplit ? 'Settle' : 'NAVIGATION.SUMMARY',
          icon: isSplit ? 'handshake' : 'analytics',
          route: isSplit ? '/dashboard/family/settle' : '/dashboard/family/reports'
        },
        {
          id: 'family-groups',
          label: 'NAVIGATION.GROUP_SELECTION',
          icon: 'group',
          route: '/dashboard/family/groups'
        }
      ];
    } else {
      return [
        {
          id: 'home',
          label: 'NAVIGATION.HOME',
          icon: 'home',
          route: '/dashboard/home'
        },
        {
          id: 'transactions',
          label: 'NAVIGATION.EXPENSE',
          icon: 'receipt_long',
          route: '/dashboard/transactions'
        },
        {
          id: 'accounts',
          label: 'NAVIGATION.ACCOUNTS',
          icon: 'account_balance',
          route: '/dashboard/accounts'
        },
        {
          id: 'categories',
          label: 'NAVIGATION.CATEGORIES',
          icon: 'category',
          route: '/dashboard/category'
        },
        {
          id: 'reports',
          label: 'NAVIGATION.SUMMARY',
          icon: 'analytics',
          route: '/dashboard/reports'
        }
      ];
    }
  });

  handleItemClick(item: DesktopHeaderItem): void {
    if (item.action) {
      item.action();
      return;
    }
    if (item.route) {
      this.router.navigate([item.route]);
      return;
    }
    if (item.id === 'home' || item.id === 'family-home') {
      if (this.isFamilyMode()) {
        const fid = this.familyService.activeFamilyId();
        this.router.navigate([fid ? `/dashboard/family/dashboard/${fid}` : '/dashboard/family']);
      } else {
        this.router.navigate(['/dashboard/home']);
      }
    } else if (item.id === 'reports') {
      if (this.isFamilyMode()) {
        const isSplit = this.activeFamily()?.mode === 'split';
        this.router.navigate([isSplit ? '/dashboard/family/settle' : '/dashboard/family/reports']);
      } else {
        this.router.navigate(['/dashboard/reports']);
      }
    } else if (item.id === 'transactions') {
      this.router.navigate(['/dashboard/transactions']);
    } else if (item.id === 'accounts') {
      this.router.navigate(['/dashboard/accounts']);
    } else if (item.id === 'categories' || item.id === 'category') {
      this.router.navigate(['/dashboard/category']);
    } else if (item.id === 'family-groups') {
      this.router.navigate(['/dashboard/family/groups']);
    }
  }

  handleFabClick(): void {
    const fab = this.fabAction();
    if (fab?.action) {
      fab.action();
    } else {
      this.openAddTransaction();
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
