import { Component, HostListener, ElementRef, AfterViewInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { SidebarNavParent, getAllNavigationItems } from '../../../util/config/sidebar.config';

@Component({
  selector: 'side-bar',
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss'
})
export class SideBarComponent implements AfterViewInit {
  @ViewChild('drawer') drawer!: MatDrawer;
  
  navigationSections: SidebarNavParent[] = [];

  constructor(
    private auth: Auth,
    public router: Router,
    private elementRef: ElementRef
  ){
    this.navigationSections = getAllNavigationItems();
  }

  toggleSection(section: SidebarNavParent) {
    if (section.isCollapsible) {
      section.isExpanded = !section.isExpanded;
    }
  }

  ngAfterViewInit() {
    // Add click listener to document after view is initialized
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.drawer && this.drawer.opened) {
      this.drawer.close();
    }
  }

  private handleDocumentClick(event: Event) {
    // Check if sidebar is open and click is outside
    if (this.drawer && this.drawer.opened) {
      const clickedElement = event.target as HTMLElement;
      const sidebarElement = this.elementRef.nativeElement;
      
      // Check if click is outside the sidebar
      if (!sidebarElement.contains(clickedElement)) {
        // Check if it's not a click on the menu button (which should open the sidebar)
        const menuButton = clickedElement.closest('button[aria-label="Open sidebar"]');
        if (!menuButton) {
          this.drawer.close();
        }
      }
    }
  }

  public async logout() {
    await this.auth.signOut();
    this.router.navigate(['/sign-in'], { queryParams: { loggedOut: 'true' } });
  }
}
