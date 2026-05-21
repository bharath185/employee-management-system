import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'age',
  standalone: true
})
export class AgePipe implements PipeTransform {
  transform(dob: string | Date | undefined | null): number {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}

export function calculateAge(dob: string | Date | undefined | null): number {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function getAgeBracket(age: number): string {
  if (age <= 25) return '25 & Below';
  if (age <= 30) return '26 to 30';
  if (age <= 35) return '31 to 35';
  if (age <= 40) return '36 to 40';
  if (age <= 50) return '41 to 50';
  return '51 & Above';
}
