import { Component, Input } from '@angular/core';
import { LoaderService } from '../../service/loader.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
  standalone: true,
  imports: [AsyncPipe]
})
export class LoaderComponent {
  @Input() message: string = 'Loading...';
  
  loading$ = this.loaderService.loading$;

  constructor(private loaderService: LoaderService) { }
}
