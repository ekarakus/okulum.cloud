import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'sortKeys', standalone: true })
export class SortKeysPipe implements PipeTransform {
  transform(value: string[] | undefined): string[] {
    if (!value) return [];
    return value.slice().sort((a,b) => {
      // numeric-first sorting when possible
      const na = Number(a), nb = Number(b);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }
}
