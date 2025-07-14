import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  AdminSidebarSection, 
  AdminSidebarNavItem, 
  ADMIN_SIDEBAR_CONFIG,
  getAllAdminSections,
  getVisibleAdminItems,
  getAdminItemById,
  getAdminNavigationItems
} from './admin-sidebar.config';

export interface AdminSidebarState {
  sections: AdminSidebarSection[];
  navigationItems: AdminSidebarNavItem[];
  activeSection: string;
  userPermissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminSidebarService {
  private sidebarState = new BehaviorSubject<AdminSidebarState>({
    sections: [],
    navigationItems: [],
    activeSection: 'dashboard',
    userPermissions: ['admin']
  });

  public sidebarState$ = this.sidebarState.asObservable();

  constructor() {
    this.initializeSidebar();
  }

  private initializeSidebar(): void {
    const currentState = this.sidebarState.value;
    const sections = getAllAdminSections();
    const navigationItems = getVisibleAdminItems(currentState.userPermissions);

    this.sidebarState.next({
      ...currentState,
      sections,
      navigationItems
    });
  }

  public getSidebarState(): Observable<AdminSidebarState> {
    return this.sidebarState$;
  }

  public getCurrentState(): AdminSidebarState {
    return this.sidebarState.value;
  }

  public setActiveSection(sectionId: string): void {
    const currentState = this.sidebarState.value;
    this.sidebarState.next({
      ...currentState,
      activeSection: sectionId
    });
  }

  public getActiveSection(): AdminSidebarNavItem | undefined {
    const currentState = this.sidebarState.value;
    return getAdminItemById(currentState.activeSection);
  }

  public getActiveSectionLabel(): string {
    const activeItem = this.getActiveSection();
    return activeItem ? activeItem.label : 'Dashboard';
  }

  public setUserPermissions(permissions: string[]): void {
    const currentState = this.sidebarState.value;
    const navigationItems = getVisibleAdminItems(permissions);

    this.sidebarState.next({
      ...currentState,
      userPermissions: permissions,
      navigationItems
    });
  }

  public toggleSection(sectionId: string): void {
    const currentState = this.sidebarState.value;
    const sections = currentState.sections.map(section => {
      if (section.id === sectionId && section.isCollapsible) {
        return {
          ...section,
          isExpanded: !section.isExpanded
        };
      }
      return section;
    });

    this.sidebarState.next({
      ...currentState,
      sections
    });
  }

  public isSectionExpanded(sectionId: string): boolean {
    const currentState = this.sidebarState.value;
    const section = currentState.sections.find(s => s.id === sectionId);
    return section ? section.isExpanded || false : false;
  }

  public isSectionCollapsible(sectionId: string): boolean {
    const currentState = this.sidebarState.value;
    const section = currentState.sections.find(s => s.id === sectionId);
    return section ? section.isCollapsible || false : false;
  }

  public getSectionItems(sectionId: string): AdminSidebarNavItem[] {
    const currentState = this.sidebarState.value;
    const section = currentState.sections.find(s => s.id === sectionId);
    return section ? section.items : [];
  }

  public getAllSections(): AdminSidebarSection[] {
    return this.sidebarState.value.sections;
  }

  public getAllNavigationItems(): AdminSidebarNavItem[] {
    return this.sidebarState.value.navigationItems;
  }

  public addBadgeToItem(itemId: string, badge: { text: string; color: 'primary' | 'accent' | 'warn' | 'success' }): void {
    const currentState = this.sidebarState.value;
    const sections = currentState.sections.map(section => ({
      ...section,
      items: section.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            badge
          };
        }
        return item;
      })
    }));

    this.sidebarState.next({
      ...currentState,
      sections
    });
  }

  public removeBadgeFromItem(itemId: string): void {
    const currentState = this.sidebarState.value;
    const sections = currentState.sections.map(section => ({
      ...section,
      items: section.items.map(item => {
        if (item.id === itemId) {
          const { badge, ...itemWithoutBadge } = item;
          return itemWithoutBadge;
        }
        return item;
      })
    }));

    this.sidebarState.next({
      ...currentState,
      sections
    });
  }

  public showItem(itemId: string): void {
    const currentState = this.sidebarState.value;
    const sections = currentState.sections.map(section => ({
      ...section,
      items: section.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            isVisible: true
          };
        }
        return item;
      })
    }));

    this.sidebarState.next({
      ...currentState,
      sections
    });
  }

  public hideItem(itemId: string): void {
    const currentState = this.sidebarState.value;
    const sections = currentState.sections.map(section => ({
      ...section,
      items: section.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            isVisible: false
          };
        }
        return item;
      })
    }));

    this.sidebarState.next({
      ...currentState,
      sections
    });
  }

  public refreshSidebar(): void {
    this.initializeSidebar();
  }
} 