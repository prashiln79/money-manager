import { Injectable } from "@angular/core";
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

interface DeviceType {
    isMobile: boolean,
    isTablePortrait: boolean,
    isDesktop: boolean,
}


@Injectable({
    providedIn: 'root'
})
export class BreakpointService {

    public device: DeviceType = {
        isMobile: false,
        isTablePortrait: false,
        isDesktop: false
    };

    constructor(private breakpointObserver: BreakpointObserver) {
        this.breakpointObserver
            .observe([Breakpoints.Handset])
            .subscribe((result) => {
                this.device.isMobile = result.matches;
            });

        this.breakpointObserver
            .observe([Breakpoints.TabletPortrait])
            .subscribe((result) => {
                this.device.isTablePortrait = result.matches;
            });

        this.breakpointObserver
            .observe([Breakpoints.Web])
            .subscribe((result) => {
                this.device.isDesktop = result.matches;
            });
    }

}