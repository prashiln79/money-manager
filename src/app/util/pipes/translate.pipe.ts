import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../service/translation.service';

@Pipe({
  name: 'translate',
  standalone: true
})
export class TranslatePipe implements PipeTransform {
  constructor(private translationService: TranslationService) {}

  transform(key: string, params?: Record<string, string>): string {
    if (params) {
      return this.translationService.translateWithParams(key, params);
    }
    return this.translationService.translate(key);
  }
} 