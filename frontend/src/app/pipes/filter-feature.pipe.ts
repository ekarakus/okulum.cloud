import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterFeature', standalone: true })
export class FilterFeaturePipe implements PipeTransform {
  transform(items: any[], query: string): any[] {
    if (!items) return [];
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(i => ((i.name || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q)));
  }
}
