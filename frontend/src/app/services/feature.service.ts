import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

export interface Feature {
  id?: number;
  name: string;
  description?: string;
  sort_order?: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeatureService {
  private apiUrl = `${environment.apiUrl}/api/features`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private getAuthHeaders(): HttpHeaders {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
      }
    }
    return new HttpHeaders();
  }

  getFeatures(): Observable<Feature[]> {
    return this.http.get<Feature[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getFeature(id: number): Observable<Feature> {
    return this.http.get<Feature>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  createFeature(feature: Feature): Observable<Feature> {
    return this.http.post<Feature>(this.apiUrl, feature, { headers: this.getAuthHeaders() });
  }

  updateFeature(id: number, feature: Feature): Observable<Feature> {
    return this.http.put<Feature>(`${this.apiUrl}/${id}`, feature, { headers: this.getAuthHeaders() });
  }

  deleteFeature(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
