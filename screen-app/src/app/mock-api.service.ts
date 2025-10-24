import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CacheService } from './cache.service';

@Injectable({ providedIn: 'root' })
export class MockApiService {
  // Default API base - configurable via window.__API_BASE__ if needed
  private base = (window as any).__API_BASE__ || 'http://localhost:3000/api';
  constructor(private http: HttpClient, private cache: CacheService) {}

  // Notifications: use announcements as primary notifications
  async getNotifications(): Promise<any[]> {
    const type = 'notifications';
    try{
      const res = await this.http.get<any[]>(`${this.base}/announcements`).toPromise();
      await this.cache.set(undefined, type, res);
      return res;
    }catch(err){
      const cached = await this.cache.get(undefined, type);
      return cached || [];
    }
  }

  async getAnnouncements(): Promise<any[]> {
    const type = 'announcements';
    try{
      const res = await this.http.get<any[]>(`${this.base}/announcements`).toPromise();
      await this.cache.set(undefined, type, res);
      return res;
    }catch(err){
      const cached = await this.cache.get(undefined, type);
      return cached || [];
    }
  }

  // School time table (may accept school_id query param in real API)
  async getSchedule(school_id?: number): Promise<any> {
    const params = school_id ? new HttpParams().set('school_id', String(school_id)) : undefined;
    const type = 'schedule';
    try{
      const res = await this.http.get<any>(`${this.base}/school-time-table`, { params }).toPromise();
      await this.cache.set(school_id, type, res);
      return res;
    }catch(err){
      const cached = await this.cache.get(school_id, type);
      return cached;
    }
  }

  // Duty schedule - now gets complete roster (all shifts)
  async getDuty(school_id?: number): Promise<any[]> {
    // call public duty roster route (no shift parameter needed)
    const id = school_id ? String(school_id) : '';
    const type = 'duty';
    try{
      const res = await this.http.get<any[]>(`${this.base}/public/duty-schedule/roster/${encodeURIComponent(id)}`).toPromise();
      await this.cache.set(school_id, type, res);
      return res;
    }catch(err){
      const cached = await this.cache.get(school_id, type);
      return cached || [];
    }
  }

  // Students list; supports optional school_id
  async getStudents(school_id?: number): Promise<any[]> {
    const type = 'students';
    const id = school_id ? String(school_id) : undefined;
    try{
      const res = school_id ? await this.http.get<any[]>(`${this.base}/public/students/school/${encodeURIComponent(String(school_id))}`).toPromise()
        : await this.http.get<any[]>(`${this.base}/students`).toPromise();
      await this.cache.set(school_id, type, res);
      return res;
    }catch(err){
      const cached = await this.cache.get(school_id, type);
      return cached || [];
    }
  }
  async getSchool(school_id: number): Promise<any> {
    const type = 'school';
    try{
      const res = await this.http.get<any>(`${this.base}/public/schools/id/${encodeURIComponent(String(school_id))}`).toPromise();
      // if backend returns a logo path, try to fetch and embed as base64 for offline use
      try{
        const logoPath = res.logoUrl || res.logo_path || res.logo || null;
        if (logoPath) {
          // construct absolute URL when needed
          let logoUrl = String(logoPath);
          if (logoUrl.indexOf('http') !== 0 && logoUrl.indexOf('data:') !== 0) {
            // derive API origin from this.base (strip trailing /api)
            const origin = String(this.base).replace(/\/api\/?$/,'');
            // ensure leading slash
            if (!logoUrl.startsWith('/')) logoUrl = '/' + logoUrl;
            logoUrl = origin + logoUrl;
          }
          // fetch the image as blob and convert to base64
          if (!logoUrl.startsWith('data:')){
            try{
              const blob = await this.http.get(logoUrl, { responseType: 'blob' as 'json' }).toPromise() as unknown as Blob;
              const base64 = await new Promise<string>((resolve, reject)=>{
                const fr = new FileReader();
                fr.onload = () => { resolve(String((fr.result as string) || '')); };
                fr.onerror = () => reject(fr.error);
                fr.readAsDataURL(blob);
              });
              // store a data URL in logoUrl for offline usage
              res.logoUrl = base64;
            }catch(e){
              // ignore image fetch errors
            }
          }
        }
      }catch(e){ /* ignore logo embedding errors */ }

      await this.cache.set(school_id, type, res);
      return res;
    }catch(err){
      const cached = await this.cache.get(school_id, type);
      return cached;
    }
  }

  // Resolve school by code using the new public endpoint
  async getSchoolByCode(code: string): Promise<any> {
    if (!code) return Promise.reject(new Error('code is required'));
    const type = `schoolByCode:${code}`;
    try{
      const res = await this.http.get<any>(`${this.base}/public/schools/by-code/${encodeURIComponent(code)}`).toPromise();
      // cache by resolved id as well as by code
      if (res && res.id) await this.cache.set(res.id, 'school', res);
      await this.cache.set(undefined, type, res);
      return res;
    }catch(err){
      const cached = await this.cache.get(undefined, type);
      return cached ? cached : Promise.reject(err);
    }
  }
}
