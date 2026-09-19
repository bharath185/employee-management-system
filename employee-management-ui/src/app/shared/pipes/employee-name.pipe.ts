import { Pipe, PipeTransform } from '@angular/core';

export function formatEmployeeName(emp: { prefix?: string; firstName?: string; middleName?: string; surname?: string } | null | undefined, includePrefix: boolean = true): string {
  if (!emp) return '-';
  const parts: string[] = [];
  if (includePrefix && emp.prefix && emp.prefix.trim()) {
    const p = emp.prefix.trim();
    parts.push(p.endsWith('.') ? p : p + '.');
  }
  if (emp.surname && emp.surname.trim()) {
    parts.push(emp.surname.trim());
  }
  if (emp.firstName && emp.firstName.trim()) {
    parts.push(emp.firstName.trim());
  }
  if (emp.middleName && emp.middleName.trim()) {
    parts.push(emp.middleName.trim());
  }
  return parts.join(' ') || '-';
}

@Pipe({
  name: 'employeeName',
  standalone: true
})
export class EmployeeNamePipe implements PipeTransform {
  transform(emp: { prefix?: string; firstName?: string; middleName?: string; surname?: string } | null | undefined, includePrefix: boolean = true): string {
    return formatEmployeeName(emp, includePrefix);
  }
}
