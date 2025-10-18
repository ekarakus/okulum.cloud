import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { InfoNugget, InfoNuggetCategory } from '../models/info-nugget.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InfoNuggetService {
  private http = inject(HttpClient);

  list(page = 1, limit = 20, categoryId?: number, sortBy?: string, order?: string, search?: string): Observable<any> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (categoryId) params = params.set('categoryId', String(categoryId));
    if (sortBy) params = params.set('sortBy', sortBy);
    if (order) params = params.set('order', order);
    if (search) params = params.set('search', search);
    return this.http.get('/api/info-nuggets', { params });
  }

  get(id: number) { return this.http.get<InfoNugget>('/api/info-nuggets/' + id); }
  create(payload: Partial<InfoNugget>) { return this.http.post('/api/info-nuggets', payload); }
  update(id: number, payload: Partial<InfoNugget>) { return this.http.put('/api/info-nuggets/' + id, payload); }
  delete(id: number) { return this.http.delete('/api/info-nuggets/' + id); }

  listCategories() { return this.http.get<InfoNuggetCategory[]>('/api/info-nugget-categories'); }
  createCategory(payload: Partial<InfoNuggetCategory>) { return this.http.post('/api/info-nugget-categories', payload); }
  updateCategory(id: number, payload: Partial<InfoNuggetCategory>) { return this.http.put('/api/info-nugget-categories/' + id, payload); }
  deleteCategory(id: number) { return this.http.delete('/api/info-nugget-categories/' + id); }
}
