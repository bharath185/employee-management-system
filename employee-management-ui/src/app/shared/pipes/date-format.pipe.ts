import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | undefined | null, format: string = 'dd/MM/yyyy'): string {
    if (!value) return '-';

    // If it's a string in YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss format
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch && (format === 'dd/MM/yyyy' || format === 'mediumDate' || format === 'default')) {
        return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
      }
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) return typeof value === 'string' ? value : '-';

    switch (format) {
      case 'MM/yyyy':
        return `${this.pad(date.getMonth() + 1)}/${date.getFullYear()}`;
      case 'yyyy-MM-dd':
        return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`;
      case 'dd/MM/yyyy HH:mm':
      case 'short':
      case 'medium':
        return `${this.pad(date.getDate())}/${this.pad(date.getMonth() + 1)}/${date.getFullYear()} ${this.pad(date.getHours())}:${this.pad(date.getMinutes())}`;
      case 'dd/MM/yyyy':
      case 'mediumDate':
      default:
        return `${this.pad(date.getDate())}/${this.pad(date.getMonth() + 1)}/${date.getFullYear()}`;
    }
  }

  private pad(n: number): string {
    return n < 10 ? '0' + n : n.toString();
  }
}
