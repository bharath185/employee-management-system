import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | undefined | null, format: string = 'mediumDate'): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
    
    switch (format) {
      case 'dd/MM/yyyy':
        return `${this.pad(date.getDate())}/${this.pad(date.getMonth() + 1)}/${date.getFullYear()}`;
      case 'MM/yyyy':
        return `${this.pad(date.getMonth() + 1)}/${date.getFullYear()}`;
      case 'yyyy-MM-dd':
        return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`;
      case 'mediumDate':
        return date.toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        });
      default:
        return date.toLocaleDateString('en-US');
    }
  }

  private pad(n: number): string {
    return n < 10 ? '0' + n : n.toString();
  }
}
