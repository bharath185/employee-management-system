import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'titleCase',
  standalone: true
})
export class TitleCasePipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) return '';
    return value.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    });
  }
}
