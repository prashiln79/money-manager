import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  deviceType = {
    mobile: false,
    tablet: false,
    desktop: false
  };

  constructor(
    private breakpointObserver: BreakpointObserver,
  ) {
    this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.Tablet,
      Breakpoints.Web
    ]).subscribe(result => {
      if (result.breakpoints[Breakpoints.HandsetPortrait]) {
        this.deviceType = { mobile: true, tablet: false, desktop: false };
      } else if (result.breakpoints[Breakpoints.TabletPortrait] || result.breakpoints[Breakpoints.TabletLandscape]) {
        this.deviceType = { mobile: false, tablet: true, desktop: false };
      } else if (result.breakpoints[Breakpoints.WebPortrait]) {
        this.deviceType = { mobile: false, tablet: false, desktop: true };
      }
    });
  }

  ngOnInit() {
  }

 

}
