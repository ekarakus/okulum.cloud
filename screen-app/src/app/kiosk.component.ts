import { Component, OnInit, OnDestroy } from '@angular/core';
import { MockApiService } from './mock-api.service';

@Component({
  selector: 'app-kiosk',
  template: `
  <div class="kiosk-root">
    <div class="top-tiles">
      <div class="tile tile-period" [ngClass]="{
            'period-class': schedule?.current?.period_type === 'class',
            'period-break': schedule?.current?.period_type === 'break' || schedule?.current?.period_type === 'recess',
            'period-lunch': schedule?.current?.period_type === 'lunch' || schedule?.current?.period_type === 'noon'
          }">
        <div class="period-label">{{ schedule?.current?.title || '—' }}</div>
        <div class="period-time">{{ schedule?.current?.timeRange || '' }}</div>
      </div>
      <div class="tile tile-countdown">
        <div class="countdown-title">Kalan Süre</div>
        <div class="countdown-clock">{{ schedule?.timeLeftText || '-- : --' }}</div>
      </div>
      <div class="tile tile-date">
          <div class="date-day">{{ todayText }}</div>
        <div class="date-time">{{ nowText }}</div>
      </div>
    </div>

    <div class="content-grid">
      <aside class="left-col">
        <div class="school-card">
          <img *ngIf="school?.logoUrl" [src]="school.logoUrl" alt="logo" class="school-logo" />
          <div class="school-name">{{ school?.name || 'Okulum' }}</div>
        </div>

        <div class="card duty-card">
          <div class="card-title">Nöbetçi Öğretmenler</div>
          <ul>
            <li *ngFor="let g of duty?.guards"><strong>{{g.location}}</strong><div class="guard-name">{{g.name}}</div></li>
            <li *ngIf="!duty" class="empty">Nöbetçi verisi yok</li>
          </ul>
        </div>

        <div class="card birthdays-card">
          <div class="card-title">Bugün Doğanlar</div>
          <ul>
            <li *ngFor="let b of birthdays">{{b.name}} <span class="bd-date">{{b.birthday | date:'dd.MM'}}</span></li>
            <li *ngIf="birthdays.length===0" class="empty">Bugün doğan öğrenci yok.</li>
          </ul>
        </div>
      </aside>

      <main class="main-col">
        <div class="card main-card">
          <div class="announce-area">
            <div *ngIf="announcements.length===0" class="announce-empty">Duyuru yok</div>
            <div *ngFor="let a of announcements" class="announce-item">
              <h2 [innerText]="a.title"></h2>
              <div class="announce-text" [innerHTML]="a.message"></div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <footer class="kiosk-footer">
      <div class="left">Son güncelleme: {{ lastUpdated | date:'HH:mm:ss' }} <span *ngIf="simActive" class="sim-badge">Sim: {{ simulatedNow | date:'dd MMM yyyy HH:mm' }}</span></div>
      <div class="right">
        <button class="fs-btn" (click)="enterFullscreen()">Tam Ekran</button>
      </div>
    </footer>
  </div>
  `,
  styles: [
    `:host { display:block; height:100vh; font-family: 'Segoe UI', Roboto, Arial, sans-serif }
  .kiosk-root { display:flex; flex-direction:column; position:fixed; top:0; left:0; width:100vw; height:100vh; background:#2f3234; color:#111; z-index:1; padding-bottom:50px; }

  .top-tiles{display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; padding:10px}
  .tile{border-radius:12px; padding:18px; color:#fff; display:flex; flex-direction:column; justify-content:center; width:100%; box-sizing:border-box;}
  .tile-period{background:#d94a4a}
  .tile-period.period-class{background:#d94a4a}
  .tile-period.period-break{background:#4caf50}
  .tile-period.period-lunch{background:#f0a23a}
  .tile-countdown{background:#3aa0e6; align-items:center}
  /* Date tile: increase contrast and font sizes for readability */
  .tile-date{background: linear-gradient(180deg,#ffd54f,#f0a23a); align-items:center; justify-content:center; text-align:center; color:#111; box-shadow: inset 0 -2px 6px rgba(0,0,0,0.06);}
  .period-label{font-size:28px; font-weight:700}
  .period-time{font-size:20px; opacity:0.95}
  .countdown-title{font-size:14px}
  .countdown-clock{font-size:42px; font-weight:700}
  .date-day{font-size:34px; font-weight:700; line-height:1; color:#111}
  .date-time{font-size:40px; font-weight:700; opacity:0.95; color:#111}

  .content-grid{display:grid; grid-template-columns: 1fr 2fr; gap:10px; padding:0 18px 18px; height:calc(100vh - 120px);}
  .left-col{display:flex; flex-direction:column; gap:10px}
  .school-card{background:#fff; border-radius:12px; padding:12px; display:flex; align-items:center; gap:12px}
  .school-logo{height:56px; width:56px; object-fit:contain}
  .school-name{font-weight:700; color:#222}

  .card{background:#fff; border-radius:12px; padding:12px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); width:100%; box-sizing:border-box;}
  .card-title{font-weight:700; padding:8px 4px; color:#333}
  .duty-card ul, .birthdays-card ul{list-style:none;padding:0;margin:0}
  .duty-card li{padding:8px 6px;border-bottom:1px solid #eee}
  .guard-name{font-weight:600}
  .main-col{display:flex}
  .main-card{height:100%; min-height:320px; display:flex; align-items:center; justify-content:center; overflow:hidden}
  .announce-area{width:100%; padding:24px; text-align:center}
  .announce-item h2{font-size:48px; margin:8px 0}
  .announce-text{font-size:20px; color:#444}

  .kiosk-footer{display:flex; justify-content:space-between; align-items:center; padding:0 10px 10px; font-size:13px; background:rgba(0,0,0,.04); color:#222; position:fixed; bottom:0; left:0; right:0; width:100vw; z-index:1000;}
  .fs-btn{background:rgba(0,0,0,0.06);border:0;padding:8px 12px;color:#222;border-radius:6px}
  .empty{opacity:0.6}
  @media (max-width:1100px){ .top-tiles{grid-template-columns:1fr 1fr 1fr} .content-grid{grid-template-columns:1fr} }
    `]
})
export class KioskComponent implements OnInit {
  public locale: string = 'tr'; // Varsayılan dil ve yerel ayar Türkçe
  notifications: Array<{title:string,message:string,time:string}> = [];
  schedule: any = null;
  duty: any = null;
  announcements: any[] = [];
  activeAnnouncements: any[] = [];
  currentAnnouncementIndex = 0;
  private announcementTimerId: any = null;
  birthdays: Array<{name:string,birthday:string}> = [];
  lastUpdated = new Date();
  school: any = null;
  now: Date = new Date();
  today: Date = new Date();
  nowText: string = '';
  todayText: string = '';
  // Optional school scope - set this if you have a school id to query
  schoolId?: number = undefined;
  // simulation
  simActive = false;
  simulatedNow?: Date;
  // loading states
  loading = {
    notifications: false,
    schedule: false,
    duty: false,
    announcements: false,
    students: false,
    school: false
  } as any;
  // source markers (live|cache)
  source: { [k: string]: 'live' | 'cache' | 'unknown' } = {};
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

    // detect simulation param: window.__SIM_TIME__ or ?sim=... (accept ISO or Turkish-ish dates)
    const urlParams = new URLSearchParams(window.location.search);
    const simParam = (window as any).__SIM_TIME__ || urlParams.get('sim');
    if (simParam) {
      const parsed = this.parseSimTime(String(simParam));
      if (parsed) {
        this.simActive = true;
        this.simulatedNow = parsed;
        this.now = new Date(this.simulatedNow);
        this.today = new Date(this.simulatedNow);
      }
    }

    // update clock every second; if simulation active, advance simulatedNow; else use real now
    const tick = () => {
      if (this.simActive && this.simulatedNow) {
        this.simulatedNow = new Date(this.simulatedNow.getTime() + 1000);
        this.now = new Date(this.simulatedNow);
        this.today = new Date(this.simulatedNow);
      } else {
        this.now = new Date();
        this.today = new Date();
      }
      // update human-readable strings to avoid relying on date pipe in template
      try{
        this.nowText = this.now.toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.todayText = this.today.toLocaleDateString('tr', { day: '2-digit', month: 'long', year: 'numeric' });
      }catch(e){
        this.nowText = '';
        this.todayText = '';
      }
      // recompute derived schedule values (current/next period and countdown) each tick so countdown updates live
      try{ if (this.schedule) this.updateScheduleDerived(this.now); }catch(e){}
    };
    tick();
    setInterval(tick, 1000);
  }

  ngOnDestroy(): void {
    this.stopAnnouncementCarousel();
  }

  load(){
    // fetch each dataset and track loading + cached/live source
    this.loadNotifications();
    this.loadSchedule();
    this.loadDuty();
    this.loadAnnouncements();
    this.loadStudents();
    // load school info if available
    if (this.schoolId) {
      this.loadSchool();
    }
  }

  private async loadNotifications(){
    this.loading.notifications = true; this.source.notifications = 'unknown';
    try{
      const notes = await this.api.getNotifications();
      this.notifications = notes || [];
      this.source.notifications = 'live';
    }catch(e){
      // MockApiService already falls back to cache; if it returned data it will be assigned.
      this.source.notifications = 'cache';
    }finally{ this.loading.notifications = false; this.lastUpdated = new Date(); }
  }

  private async loadSchedule(){
    this.loading.schedule = true; this.source.schedule = 'unknown';
    try{
      const sched = await this.api.getSchedule(this.schoolId);
      if (sched) { this.schedule = sched; this.source.schedule = 'live'; }
      else this.source.schedule = 'cache';
    }catch(e){ this.source.schedule = 'cache'; }
    finally{ this.loading.schedule = false; this.lastUpdated = new Date(); if (this.schedule) this.updateScheduleDerived(this.now); }
  }

  private async loadDuty(){
    this.loading.duty = true; this.source.duty = 'unknown';
    try{
      const d = await this.api.getDuty(this.schoolId);
      if (d) { this.duty = d; this.source.duty = 'live'; } else this.source.duty = 'cache';
    }catch(e){ this.source.duty = 'cache'; }
    finally{ this.loading.duty = false; this.lastUpdated = new Date(); }
  }

  private async loadAnnouncements(){
    this.loading.announcements = true; this.source.announcements = 'unknown';
    try{
      const a = await this.api.getAnnouncements();
      this.announcements = a || [];
      this.source.announcements = 'live';
      // compute active announcements based on schedule and simulated/real time
      this.computeActiveAnnouncements();
      this.startAnnouncementCarousel();
    }catch(e){ this.source.announcements = 'cache'; }
    finally{ this.loading.announcements = false; this.lastUpdated = new Date(); }
  }

  private async loadStudents(){
    this.loading.students = true; this.source.students = 'unknown';
    try{
      const students = await this.api.getStudents(this.schoolId) || [];
      this.birthdays = (students || []).filter(s=>{
        try{ const d=new Date(s.birthday); const today=new Date(); return d.getDate()===today.getDate() && d.getMonth()===today.getMonth(); }catch(e){return false}
      });
      this.source.students = 'live';
    }catch(e){ this.source.students = 'cache'; }
    finally{ this.loading.students = false; this.lastUpdated = new Date(); }
  }

  private async loadSchool(){
    this.loading.school = true; this.source.school = 'unknown';
    try{
      const s = await this.api.getSchool(this.schoolId);
      if (s) { this.school = s; this.source.school = 'live'; } else this.source.school = 'cache';
    }catch(e){ this.source.school = 'cache'; }
    finally{ this.loading.school = false; }
  }

  async enterFullscreen(){
    try{
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    }catch(e){ console.debug('Fullscreen failed', e); }
  }

  private updateScheduleDerived(nowDate: Date){
    try{
      if (!this.schedule || !Array.isArray(this.schedule.lessons)) return;
      const lessons = this.schedule.lessons;
      const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
      let active: any = null;
      let next: any = null;
      for (const l of lessons){
        // Support two data shapes:
        // 1) legacy: { time: '09:00 - 09:45', title }
        // 2) api: { start_time: '08:00:00', duration_minutes: 30, end_time?: '08:30:00', period_name, period_type, day_of_week }
        let start: Date | null = null;
        let end: Date | null = null;
        let title = l.title || l.period_name || '';

        if (l.start_time || l.duration_minutes || l.end_time){
          // API-style entry
          // if day_of_week provided, skip entries not matching today
          if (typeof l.day_of_week !== 'undefined' && l.day_of_week !== null){
            // API: 1 = Monday, JS getDay(): 1 = Monday, so direct compare
            const jsDay = nowDate.getDay();
            if (Number(l.day_of_week) !== jsDay) continue;
          }
          if (l.start_time) start = this.parseTimeToDate(String(l.start_time), today);
          if (l.end_time) end = this.parseTimeToDate(String(l.end_time), today);
          if (!end && l.duration_minutes) {
            if (start) end = new Date(start.getTime() + Number(l.duration_minutes) * 60000);
          }
          if (!title){
            if (l.period_type === 'class') title = l.period_name || 'Ders';
            else if (l.period_type) title = l.period_type.replace(/(^|_)([a-z])/g, (m,p,c)=>c.toUpperCase());
            else title = 'Periyot';
          }
        } else if (l.time){
          const parts = String(l.time).split('-').map((p:string)=>p.trim());
          if (parts.length >= 2){
            start = this.parseTimeToDate(parts[0], today);
            end = this.parseTimeToDate(parts[1], today);
            if (!title) title = l.title || 'Ders';
          }
        }
        if (!start || !end) continue;
        const timeRange = `${this.formatTime(start)} - ${this.formatTime(end)}`;
          if (nowDate >= start && nowDate <= end){
            active = { title: title || l.period_name || 'Ders', start, end, timeRange, period_type: l.period_type || (l.duration_minutes ? 'class' : undefined) };
          break;
        }
          if (nowDate < start && (!next || start < next.start)) next = { title: title || l.period_name || 'Ders', start, end, timeRange, period_type: l.period_type || (l.duration_minutes ? 'class' : undefined) };
      }
      if (active){
        const diffMs = active.end.getTime() - nowDate.getTime();
        const mm = Math.floor(diffMs / 60000);
        const ss = Math.floor((diffMs % 60000) / 1000);
        const mmStr = String(mm).padStart(2,'0');
        const ssStr = String(ss).padStart(2,'0');
        this.schedule.current = active;
        this.schedule.timeLeftText = `${mmStr} : ${ssStr}`;
      } else if (next){
        const diffMs = next.start.getTime() - nowDate.getTime();
        const mm = Math.floor(diffMs / 60000);
        const ss = Math.floor((diffMs % 60000) / 1000);
        const mmStr = String(mm).padStart(2,'0');
        const ssStr = String(ss).padStart(2,'0');
        this.schedule.current = { title: 'Sonraki: ' + (next.title||''), start: next.start, end: next.end, timeRange: next.timeRange };
        this.schedule.timeLeftText = `${mmStr} : ${ssStr}`;
      } else {
        this.schedule.current = null;
        this.schedule.timeLeftText = '-- : --';
      }
    }catch(e){ /* ignore */ }
  }

  private formatTime(d: Date){
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    return `${hh}:${mm}`;
  }

  private parseTimeToDate(t:string, base: Date): Date | null{
    try{
      const m = t.match(/(\d{1,2}):(\d{2})/);
      if (!m) return null;
      const hh = parseInt(m[1]);
      const mm = parseInt(m[2]);
      return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh, mm, 0);
    }catch(e){ return null; }
  }

  // compute which announcements are active at the provided now (uses this.now)
  private computeActiveAnnouncements(){
    try{
      const now = this.now || new Date();
      const list = (this.announcements || []).filter((a:any)=>{
        try{
          // fields considered: start_date, expiration_date, publish_start_time, publish_end_time
          // if no scheduling fields provided, treat as always active
          if (a.start_date && a.expiration_date){
            const sd = new Date(a.start_date);
            const ed = new Date(a.expiration_date);
            if (now < sd || now > ed) return false;
          }
          if (a.publish_start_time && a.publish_end_time){
            // publish times may be in HH:MM format -> compare against today's times
            const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const ps = this.parseTimeToDate(String(a.publish_start_time), base);
            const pe = this.parseTimeToDate(String(a.publish_end_time), base);
            if (ps && pe){ if (now < ps || now > pe) return false; }
          }
          return true;
        }catch(e){ return true; }
      });
      this.activeAnnouncements = list;
      if (this.currentAnnouncementIndex >= this.activeAnnouncements.length) this.currentAnnouncementIndex = 0;
    }catch(e){ this.activeAnnouncements = this.announcements || []; }
  }

  private startAnnouncementCarousel(){
    this.stopAnnouncementCarousel();
    if (!this.activeAnnouncements || this.activeAnnouncements.length===0) return;
    const show = this.activeAnnouncements[this.currentAnnouncementIndex] || this.activeAnnouncements[0];
    const duration = (show && show.display_duration_ms) ? Number(show.display_duration_ms) : 10000;
    this.announcementTimerId = setTimeout(()=>{
      this.currentAnnouncementIndex = (this.currentAnnouncementIndex + 1) % (this.activeAnnouncements.length || 1);
      this.computeActiveAnnouncements();
      this.startAnnouncementCarousel();
    }, duration);
  }

  private stopAnnouncementCarousel(){
    if (this.announcementTimerId) { clearTimeout(this.announcementTimerId); this.announcementTimerId = null; }
  }

  // parse simulation time. Accepts ISO or '20 ekim 2025 09:25' (Turkish month names), or '20 ekim pazartesi 09:25'
  private parseSimTime(s: string): Date | null{
    if (!s) return null;
    // try ISO first
    const iso = Date.parse(s);
    if (!isNaN(iso)) return new Date(iso);

    // normalize and try to parse Turkish month names
    const months: { [k:string]: number } = {
      'ocak':0,'şubat':1,'subat':1,'mart':2,'nisan':3,'mayıs':4,'mayis':4,'haziran':5,'temmuz':6,'ağustos':7,'agustos':7,'eylül':8,'eylul':8,'ekim':9,'kasım':10,'kasim':10,'aralık':11,'aralik':11
    };
    // remove weekday words and commas
    let t = s.toLowerCase().replace(/[,]/g,' ').replace(/\b(pazartesi|salı|sali|çarşamba|carsamba|perşembe|persembe|cuma|cumartesi|pazar)\b/g,'');
    t = t.replace(/\s+/g,' ').trim();
    // expected patterns: '20 ekim 2025 09:25' or '20 ekim 09:25' (assume current year)
    const parts = t.split(' ');
    if (parts.length >= 2) {
      // find day
      const day = parseInt(parts[0]);
      // find month token in parts
      let monthIdx = -1; let monthNum = -1; let year = (new Date()).getFullYear(); let timePart = '00:00';
      for (let i=1;i<parts.length;i++){
        const p = parts[i];
        if (months[p]!==undefined){ monthIdx = i; monthNum = months[p]; }
      }
      if (monthIdx===-1) return null;
      // year might be the token after month
      if (parts.length > monthIdx+1 && /^\d{4}$/.test(parts[monthIdx+1])) year = parseInt(parts[monthIdx+1]);
      // time may be at the end
      const last = parts[parts.length-1];
      if (/^\d{1,2}:\d{2}$/.test(last)) timePart = last;
      const [hh,mm] = timePart.split(':').map(x=>parseInt(x)||0);
      if (!day || monthNum<0) return null;
      return new Date(year, monthNum, day, hh, mm, 0);
    }
    return null;
  }
}
