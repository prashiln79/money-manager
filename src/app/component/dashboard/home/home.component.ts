import { Component } from '@angular/core';
import { BreakpointService } from 'src/app/util/service/breakpoint.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  constructor(
    public breakpointService: BreakpointService,
  ) { }
}
