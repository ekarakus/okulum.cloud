import { Component, OnInit } from '@angular/core';
import { MockApiService } from './mock-api.service';

@Component({
  selector: 'app-kiosk',
  template: `
  <div class="kiosk-root">
    <header class="kiosk-header">
      <div class="header-left">
        <img *ngIf="school?.logoUrl" [src]="school.logoUrl" alt="logo" class="school-logo" />
        <div class="school-title">{{ school?.name || 'Okulum Bilgilendirme Ekranı' }}</div>
      </div>
      <div class="header-right">
        <button (click)="enterFullscreen()" class="fs-btn">Tam Ekran</button>
      </div>
    </header>
    <main class="kiosk-main">
      <section class="left">
        <h3>Duyurular</h3>
        <div *ngFor="let a of announcements" class="notice"><h4>{{a.title}}</h4><p>{{a.message}}</p></div>

        <h3>Program</h3>
        <ul class="schedule">
          <li *ngFor="let s of schedule?.lessons">{{s.time}} — {{s.title}}</li>
        </ul>
      </section>

      <aside class="right">
        <h3>Nöbetçi Tablosu</h3>
        <ul>
          <li *ngFor="let g of duty?.guards">{{g.shift}} — {{g.name}} ({{g.location}})</li>
        </ul>

        <h3>Bugün Doğanlar</h3>
        <ul>
          <li *ngFor="let b of birthdays">{{b.name}} — {{b.birthday | date:'dd.MM'}}</li>
          <li *ngIf="birthdays.length===0">Bugün doğan öğrenci yok.</li>
        </ul>
      </aside>
    </main>
    <footer class="kiosk-footer">Son güncelleme: {{ lastUpdated | date:'HH:mm:ss' }}</footer>
  </div>
  `,
  styles: [
    `:host { display:block; height:100vh; }
  .kiosk-root { display:flex; flex-direction:column; height:100%; background:#0a2540; color:#fff; }
  .kiosk-header{padding:12px 24px; font-size:28px; background:linear-gradient(90deg,#023048,#04506b); display:flex;align-items:center;justify-content:space-between}
  .school-logo{height:40px;margin-right:12px;border-radius:6px}
  .header-left{display:flex;align-items:center}
  .fs-btn{background:rgba(255,255,255,0.08);border:0;padding:8px 12px;color:#fff;border-radius:6px}
    .kiosk-main{flex:1; padding:24px; overflow:auto; display:flex; flex-direction:column; gap:18px}
    .notice{background:rgba(255,255,255,0.06); padding:16px; border-radius:8px}
    .notice h2{margin:0 0 8px 0}
    .meta{font-size:12px; color:rgba(255,255,255,0.6); margin-top:8px}
    .kiosk-footer{padding:8px 16px; font-size:12px; text-align:right; background:rgba(0,0,0,0.12)}
    .empty{opacity:0.7}
    `]
})
export class KioskComponent implements OnInit {
  notifications: Array<{title:string,message:string,time:string}> = [];
  schedule: any = null;
  duty: any = null;
  announcements: any[] = [];
  birthdays: Array<{name:string,birthday:string}> = [];
  lastUpdated = new Date();
  school: any = null;
  // Optional school scope - set this if you have a school id to query
  schoolId?: number = undefined;
  constructor(private api: MockApiService) {}
  ngOnInit(){
    // read runtime schoolId if provided
    try{ const sid = (window as any).__SCHOOL_ID__; if (sid) this.schoolId = Number(sid);}catch(e){}

    // If no numeric schoolId provided, try to resolve from first path segment (school code)
    if (!this.schoolId) {
      try{
        const path = window.location.pathname || '/';
        const seg = path.split('/').filter(Boolean)[0];
        if (seg) {
          // try resolving via public API
          this.api.getSchoolByCode(seg).then((s:any)=>{
            if (s && s.id) {
              this.schoolId = Number(s.id);
              this.school = s;
              this.load();
            } else {
              // fallback: just load without school scope
              this.load();
            }
          }).catch(()=>{
            this.load();
          });
          return; // load will be triggered after resolution
        }
      }catch(e){ /* ignore */ }
    }

    this.load();
    setInterval(()=> this.load(), 30_000); // refresh every 30s
  }
  load(){
    Promise.all([
      this.api.getNotifications().catch(()=>[]),
      this.api.getSchedule(this.schoolId).catch(()=>null),
      this.api.getDuty(this.schoolId).catch(()=>null),
      this.api.getAnnouncements().catch(()=>[]),
      this.api.getStudents(this.schoolId).catch(()=>[])
    ]).then(([notes, sched, duty, ann, students])=>{
      this.notifications = notes || [];
      this.schedule = sched;
      this.duty = duty;
      this.announcements = ann || [];
      this.birthdays = (students || []).filter(s=>{
        try{ const d=new Date(s.birthday); const today=new Date(); return d.getDate()===today.getDate() && d.getMonth()===today.getMonth(); }catch(e){return false}
      });
      this.lastUpdated = new Date();
    });
    // load school info if available
    if (this.schoolId) {
      this.api.getSchool(this.schoolId).then(s => this.school = s).catch(()=>{});
    }
  }

  async enterFullscreen(){
    try{
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    }catch(e){ console.debug('Fullscreen failed', e); }
  }
}
