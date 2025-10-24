import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MockApiService } from './mock-api.service';

@Component({
  selector: 'app-kiosk',
  template: `
  <div class="kiosk-root">
    <div class="top-tiles">
      <div class="tile tile-school">
        <div class="period-school">
          <img *ngIf="school?.logoUrl" [src]="school.logoUrl" alt="logo" class="period-school-logo" />
          <div class="period-school-name">{{ school?.name || 'Okulum' }}</div>
        </div>
      </div>
      <div class="tile tile-countdown" [ngClass]="getCountdownTileClass()">
        <div class="countdown-lesson">
          <ng-container *ngIf="schedule?.isActive">
            Şu anda {{ schedule?.current?.period_name || '—' }} teyiz
          </ng-container>
          <ng-container *ngIf="!schedule?.isActive && schedule?.current">
            sıradaki {{ schedule?.current?.period_name || '—' }}
          </ng-container>
          <ng-container *ngIf="!schedule?.isActive && !schedule?.current">
            Ders yok
          </ng-container>
        </div>
        <div class="countdown-next" *ngIf="schedule?.next">
          sıradaki {{ schedule?.next?.period_name || '—' }} 
          <span class="countdown-next-time" *ngIf="schedule?.next?.start">({{ formatTime(schedule?.next?.start) }})</span>
        </div>
        <div class="countdown-clock">{{ schedule?.timeLeftText || '-- : --' }}</div>
      </div>
      <div class="tile tile-date">
          <div class="date-day">{{ todayText }}</div>
        <div class="date-time">{{ nowText }}</div>
      </div>
    </div>

    <div class="content-grid">
      <aside class="left-col">

        <div class="card duty-card" *ngIf="getFilteredDuty().length > 0">
          <div class="card-title">Bugünün Nöbetçileri</div>
          <div *ngFor="let group of getFilteredDuty()" class="duty-group">
            <div class="duty-group-header">{{ group.location }}</div>
            <ul class="duty-list">
              <li *ngFor="let assignment of group.assignments" 
                  [ngClass]="{
                    'administrator': !assignment.duty_location,
                    'vice-principal': assignment.employee?.employee_type?.is_vice_principal && assignment.duty_location
                  }">
                <span class="guard-name">{{ assignment.employee?.name || '—' }}</span> 
                <span class="vice-principal-badge" *ngIf="assignment.employee?.employee_type?.is_vice_principal">• Müdür Yardımcısı</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div class="card birthdays-card">
          <div class="card-title" style="padding:0px 4px;" *ngIf="birthdays.length > 0"><span class="birthday-emoji">🎂</span> Bugün Aramıza Katılan {{ birthdays.length }} kişi var</div>
          <div *ngIf="birthdays.length > 0" class="birthday-carousel">
            <div class="birthday-item" *ngIf="birthdays[currentBirthdayIndex]">
              <span class="student-name">{{ birthdays[currentBirthdayIndex].first_name }} {{ birthdays[currentBirthdayIndex].last_name }}</span>
              <span class="student-class">{{ birthdays[currentBirthdayIndex].class_name }}</span>
            </div>
          </div>
          <div *ngIf="birthdays.length === 0" class="birthday-empty">
            <div class="empty-icon">🎈</div>
            <p>Bugün aramıza katılan kimse yok!</p>
            <p>Yarın yeni doğum günlerinde görüşmek üzere :)</p>
          </div>
        </div>
      <!--birth days -->
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
      <div class="footer-content">
        <span class="status-icon" [title]="isOnline ? 'Çevrimiçi' : 'Çevrimdışı'">
          {{ isOnline ? '🟢' : '🔴' }}
        </span>
        {{ lastUpdated | date:'dd.MM.yyyy HH:mm' }}
        <button class="fs-btn" *ngIf="showFullscreenButton" (click)="enterFullscreen()" title="Tam Ekran">⬜</button>
      </div>
    </footer>

    <!-- Modal for class transition warning -->
    <div class="modal-overlay" *ngIf="showClassTransitionModal">
      <div class="modal-content">
        <div class="modal-icon">🔔</div>
        <h2>Ders Başlıyor! İyi Dersler.</h2>
        <p>Dersin başlamasına {{ classTransitionCountdown }} kaldı</p>
        <p class="modal-subtitle">Lütfen sınıflarınıza geçiniz</p>
      </div>
    </div>
  </div>
  `,
  styles: [
    `:host { display:block; height:100vh; font-family: 'Segoe UI', Roboto, Arial, sans-serif }
  .kiosk-root { display:flex; flex-direction:column; position:fixed; top:0; left:0; width:100vw; height:100vh; background:#2f3234; color:#111; z-index:1; padding-bottom:50px; }

  .top-tiles{display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; padding:10px}
  .tile{ padding:18px; color:#fff; display:flex; flex-direction:column; justify-content:center; width:100%; box-sizing:border-box;}
  .tile-school{background:white}
  .tile-school.period-class{background:#d94a4a}
  .tile-school.period-break{background:#4caf50}
  .tile-school.period-lunch{background:#f0a23a}
  .tile-countdown{background:#3aa0e6; align-items:center;}
  .tile-countdown.period-class{background:#d94a4a;}
  .tile-countdown.period-break{background:#4caf50;}
  .tile-countdown.period-lunch{background:#f0a23a;}
  .tile-countdown.period-class.pulse{background:#d94a4a; animation: pulse-red 1.5s infinite;}
  .tile-countdown.period-break.pulse{background:#4caf50; animation: pulse-green 1.5s infinite;}
  .tile-countdown.period-lunch.pulse{background:#f0a23a; animation: pulse-orange 1.5s infinite;}
  @keyframes pulse-red { 
    0%, 100% { background-color: #d94a4a; } 
    25% { background-color: #e55a5a; } 
    50% { background-color: #ff6b6b; } 
    75% { background-color: #e55a5a; } 
  }
  @keyframes pulse-green { 
    0%, 100% { background-color: #4caf50; } 
    25% { background-color: #66bb6a; } 
    50% { background-color: #81c784; } 
    75% { background-color: #66bb6a; } 
  }
  @keyframes pulse-orange { 
    0%, 100% { background-color: #f0a23a; } 
    25% { background-color: #fb8c00; } 
    50% { background-color: #ffb74d; } 
    75% { background-color: #fb8c00; } 
  }
  /* Date tile: increase contrast and font sizes for readability */
  .tile-date{background: linear-gradient(180deg,#ffd54f,#f0a23a); align-items:center; justify-content:center; text-align:center; color:#111; box-shadow: inset 0 -2px 6px rgba(0,0,0,0.06);}
  .period-day{font-size:16px; opacity:0.95; margin-bottom:6px; color:#fff}
  .period-label{font-size:28px; font-weight:700}
  .period-school{display:flex; align-items:center; justify-content:center; gap:12px; margin:0; height:90%; width:100%;}
  .period-school-logo{  width:50%; object-fit:contain; background:#fff; padding:6px}
  .period-school-name{font-size:24px; font-weight:800; color:#000}
  .period-time{font-size:20px; opacity:0.95}
  .countdown-lesson{font-size:20px; font-weight:700; margin:6px 0; color:#fff}
  .countdown-next{font-size:16px; font-weight:500; margin:4px 0; color:#ffe; opacity:0.9}
  .countdown-next-time{font-size:14px; opacity:0.8; margin-left:4px}
  .countdown-period-name{font-size:16px; font-weight:500; color:#ffe}
  .countdown-title{font-size:14px}
  .countdown-clock{font-size:42px; font-weight:700}
  .date-day{font-size:34px; font-weight:700; line-height:1; color:#111}
  .date-time{font-size:40px; font-weight:700; opacity:0.95; color:#111}

  .content-grid{display:grid; grid-template-columns: 1fr 2fr; gap:10px; padding:0 10px 10px; height:calc(100vh - 120px);}
  .left-col{display:flex; flex-direction:column; gap:10px; }
  .birthdays-card{flex:1; display:flex; flex-direction:column;}
  .school-card{background:#fff; padding:12px; display:flex; align-items:center; gap:12px}
  .school-logo{height:56px; width:56px; object-fit:contain}
  .school-name{font-weight:700; color:#222}

  .card{background:#fff; padding:12px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); width:100%; box-sizing:border-box;}
  .card-title{font-weight:700; padding:8px 4px; color:#333; font-size:18px;}
  .card-title .birthday-emoji{font-size:36px; margin-right:8px;}
  .duty-card ul, .birthdays-card ul{list-style:none;padding:0;margin:0}
  .duty-card li, .birthdays-card li{padding:8px 6px;border-bottom:1px solid #eee}
  .duty-card li:last-child, .birthdays-card li:last-child{border-bottom:none;}
  .birthday-empty{text-align:center; padding:20px; color:#666;}
  .birthday-empty .empty-icon{font-size:48px; margin-bottom:16px;}
  .birthday-empty p{margin:8px 0; font-size:16px;}
  .birthday-empty p:first-of-type{font-weight:500; color:#333;}
  .birthday-carousel{margin:8px 0;}
  .birthday-item{display:flex; justify-content:space-between; align-items:center; padding:12px 8px; background:#f9f9f9; border-left:4px solid #ff9800; transition: all 0.5s ease-in-out; opacity: 1; position:relative;}
  .birthday-item.changing{animation: birthday-change 0.8s ease-in-out;}
  .birthday-item .firework-overlay{position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none; display:flex; align-items:center; justify-content:center; font-size:36px; animation: firework-burst 0.8s ease-out;}
  .student-name{font-weight:600; color:#333; transition: all 0.3s ease;}
  .student-name.highlight{color:#ff5722; transform:scale(1.05); text-shadow:0 0 8px rgba(255,87,34,0.5);}
  .student-class{font-size:14px; color:#666; font-weight:500; background:#fff; padding:4px 8px; border:1px solid #e0e0e0;}
  .duty-group:last-child{margin-bottom:0;}
  .duty-group-header{font-weight:700; font-size:16px; color:#1976d2; margin-bottom:4px; padding:6px 8px; background:#f5f5f5; border-left:4px solid #1976d2;}
  .duty-list{margin:0; padding:0;}
  .duty-list li:last-child{border-bottom:none;}
  .guard-name{font-weight:600}
  .duty-shift{font-size:12px; color:#666; margin-left:4px}
  .administrator{background:#e8f5e8 !important; border-left:4px solid #4caf50 !important; padding-left:12px !important;}
  .administrator .guard-name{color:#2e7d32; font-weight:700;}
  .vice-principal{background:#fff3cd !important; border-left:4px solid #ffc107 !important; padding-left:12px !important;}
  .vice-principal .guard-name{color:#856404; font-weight:700;}
  .vice-principal-badge{color:#856404; font-weight:600; font-size:14px; margin-left:4px;}
  .administrator-badge{color:#2e7d32; font-weight:600; font-size:14px; margin-left:4px;}
  .duty-info{color:#666;}
  .main-col{display:flex}
  .main-card{height:100%; min-height:320px; display:flex; align-items:center; justify-content:center; overflow:hidden}
  .announce-area{width:100%; padding:24px; text-align:center}
  .announce-item h2{font-size:48px; margin:8px 0}
  .announce-text{font-size:20px; color:#444}

  .kiosk-footer{display:flex; justify-content:flex-end; align-items:center; gap:10px; padding:0 0 10px; font-size:13px;   color:#222; position:fixed; bottom:0; left:0; right:0; width:100vw; z-index:1000;}
  .status-icon{margin-right:8px; font-size:14px;}
  .fs-btn{background:rgba(0,0,0,0.06);border:0;padding:8px 12px;color:#222;}
  .empty{opacity:0.6}
  @media (max-width:1100px){ .top-tiles{grid-template-columns:1fr 1fr 1fr} .content-grid{grid-template-columns:1fr} }

  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: modal-fade-in 0.3s ease-out;
  }

  .modal-content {
    background: #fff;
    padding: 60px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    max-width: 800px;
    width: 95%;
    animation: modal-slide-up 0.4s ease-out;
  }

  .modal-icon {
    font-size: 120px;
    margin-bottom: 30px;
    animation: bell-ring 1s ease-in-out infinite;
  }

  .modal-content h2 {
    color: #d94a4a;
    font-size: 48px;
    font-weight: 700;
    margin: 0 0 20px 0;
  }

  .modal-content p {
    font-size: 32px;
    color: #333;
    margin: 15px 0;
    font-weight: 600;
  }

  .modal-subtitle {
    font-size: 24px !important;
    color: #666 !important;
    font-weight: 400 !important;
  }

  @keyframes modal-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes modal-slide-up {
    from { transform: translateY(50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes bell-ring {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(5deg); }
    75% { transform: rotate(-5deg); }
  }
    `]
})
export class KioskComponent implements OnInit {
  public locale: string = 'tr'; // Varsayılan dil ve yerel ayar Türkçe
  notifications: Array<{title:string,message:string,time:string}> = [];
  schedule: any = null;
  duty: any = null; // Re-enabled for duty schedule
  announcements: any[] = [];
  activeAnnouncements: any[] = [];
  currentAnnouncementIndex = 0;
  private announcementTimerId: any = null;
  birthdays: Array<{name:string,birthday:string}> = [];
  currentBirthdayIndex = 0;
  private birthdayTimerId: any = null;
  lastUpdated = new Date();
  school: any = null;
  now: Date = new Date();
  today: Date = new Date();
  nowText: string = '';
  todayText: string = '';
  weekdayText: string = '';
  // Optional school scope - set this if you have a school id to query
  schoolId?: number = undefined;
  // simulation
  simActive = false;
  simulatedNow?: Date;
  // modal for class transition
  showClassTransitionModal = false;
  classTransitionCountdown = '';
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
  source: { [k: string]: 'live' | 'cache' | 'unknown' } = {
    notifications: 'unknown',
    schedule: 'unknown',
    duty: 'unknown',
    announcements: 'unknown',
    students: 'unknown',
    school: 'unknown'
  };
  // online status and fullscreen button visibility
  isOnline = navigator.onLine;
  showFullscreenButton = true;
  constructor(private api: MockApiService, private route: ActivatedRoute) {}
  ngOnInit(){
    console.log('ngOnInit called');
    // read runtime schoolId if provided
    try{ const sid = (window as any).__SCHOOL_ID__; if (sid) this.schoolId = Number(sid);}catch(e){}
    console.log('schoolId from config:', this.schoolId);

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
    this.route.queryParams.subscribe(params => {
      const simParam = (window as any).__SIM_TIME__ || params['sim'];
      if (simParam) {
        const parsed = this.parseSimTime(String(simParam));
        if (parsed) {
          this.simActive = true;
          this.simulatedNow = parsed;
          this.now = new Date(this.simulatedNow);
          this.today = new Date(this.simulatedNow);
        }
      }
    });

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
        // Format: "20 Ekim Pazartesi 2025" (day Month Weekday year) with Turkish locale and capitalized names
        try {
          const dayNum = this.today.getDate();
          const monthName = this.today.toLocaleString('tr', { month: 'long' });
          const weekdayName = this.today.toLocaleString('tr', { weekday: 'long' });
          const monthCap = monthName.charAt(0).toLocaleUpperCase('tr') + monthName.slice(1);
          const weekdayCap = weekdayName.charAt(0).toLocaleUpperCase('tr') + weekdayName.slice(1);
          this.todayText = `${dayNum} ${monthCap} ${weekdayCap}`;
          this.weekdayText = weekdayCap;
        } catch (e) {
          this.todayText = this.today.toLocaleDateString('tr', { day: '2-digit', month: 'long', year: 'numeric' });
          try { this.weekdayText = this.today.toLocaleString('tr', { weekday: 'long' }); } catch(e){ this.weekdayText = ''; }
        }
      }catch(e){
        this.nowText = '';
        this.todayText = '';
        this.weekdayText = '';
      }
      // recompute derived schedule values (current/next period and countdown) each tick so countdown updates live
      try{ if (this.schedule) this.updateScheduleDerived(this.now); }catch(e){}

      // Update modal countdown if modal is showing
      if (this.showClassTransitionModal && this.schedule?.current && this.schedule.remainingMinutes < 1) {
        const diffMs = this.schedule.current.end.getTime() - this.now.getTime();
        this.classTransitionCountdown = this.formatTimeRemaining(diffMs);
      }
    };
    tick();
    setInterval(tick, 1000);

    // Monitor online/offline status
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);

    // Hide fullscreen button after 30 seconds
    setTimeout(() => {
      this.showFullscreenButton = false;
    }, 30000);
  }

  ngOnDestroy(): void {
    this.stopAnnouncementCarousel();
    this.stopBirthdayCarousel();
  }

  load(){
    console.log('load() called');
    // fetch each dataset and track loading + cached/live source
    this.loadNotifications();
    this.loadSchedule();
    this.loadDuty(); // Re-enabled for duty schedule
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
    console.log('loadSchedule called with schoolId:', this.schoolId);
    this.loading.schedule = true; this.source.schedule = 'unknown';
    try{
      const sched = await this.api.getSchedule(this.schoolId);
      console.log('Schedule loaded:', sched);
      if (sched) { 
        // API returns array directly, wrap it in object with lessons property
        this.schedule = { lessons: Array.isArray(sched) ? sched : [] }; 
        this.source.schedule = 'live'; 
      }
      else this.source.schedule = 'cache';
    }catch(e){ 
      console.error('Schedule load error:', e);
      this.source.schedule = 'cache'; 
    }
    finally{ 
      this.loading.schedule = false; 
      this.lastUpdated = new Date(); 
      console.log('Schedule after load:', this.schedule);
      if (this.schedule) {
        console.log('Calling updateScheduleDerived...');
        this.updateScheduleDerived(this.now); 
      } else {
        console.log('No schedule data, skipping updateScheduleDerived');
      }
    }
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
      const today = this.simActive && this.simulatedNow ? this.simulatedNow : new Date();
      this.birthdays = (students || []).filter(s=>{
        try{ const d=new Date(s.birth_date); return d.getDate()===today.getDate() && d.getMonth()===today.getMonth(); }catch(e){return false}
      });
      this.source.students = 'live';
      // Reset carousel index and start birthday carousel if we have birthdays
      this.currentBirthdayIndex = 0;
      this.startBirthdayCarousel();
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

  getCountdownTileClass(): string {
    if (!this.schedule?.isActive || !this.schedule?.current) return '';
    
    const periodType = this.schedule.current.period_type;
    const remainingMinutes = this.schedule.remainingMinutes || 0;
    const elapsedMinutes = this.schedule.elapsedMinutes || 0;
    
    // Add pulse animation if less than 1 minute remaining OR less than 1 minute elapsed (start of period)
    const shouldPulse = remainingMinutes < 1 || elapsedMinutes < 1;
    
    let baseClass = '';
    switch (periodType) {
      case 'class':
        baseClass = 'period-class';
        break;
      case 'break':
        baseClass = 'period-break';
        break;
      case 'lunch':
        baseClass = 'period-lunch';
        break;
      default:
        return '';
    }
    
    return shouldPulse ? `${baseClass} pulse` : baseClass;
  }

  // Filter duty assignments based on current time and school schedule
  getFilteredDuty(): any[] {
    if (!this.duty || !this.school || !this.schedule?.lessons) return [];

    const now = this.simActive && this.simulatedNow ? this.simulatedNow : new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
    const dayOfWeekNum = now.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayOfWeek = dayNames[dayOfWeekNum];

    // Get school times
    const schoolStartTime = this.parseTimeToMinutes(this.school.start_time);
    const lunchStartTime = this.parseTimeToMinutes(this.school.lunch_start_time);
    const morningStartTime = schoolStartTime - 30; // 30 minutes before school start

    // Find the last lesson end time for today
    const todayLessons = this.schedule.lessons.filter((l: any) => {
      const lessonDate = new Date(l.date || now);
      return lessonDate.toDateString() === now.toDateString();
    });

    let lastLessonEndTime = lunchStartTime; // fallback
    if (todayLessons.length > 0) {
      const endTimes = todayLessons.map((l: any) => {
        if (l.end_time) return this.parseTimeToMinutes(l.end_time);
        if (l.start_time && l.duration_minutes) {
          return this.parseTimeToMinutes(l.start_time) + Number(l.duration_minutes);
        }
        return 0;
      }).filter(t => t > 0);
      if (endTimes.length > 0) {
        lastLessonEndTime = Math.max(...endTimes);
      }
    }

    // Filter duty assignments: current day AND current time slot
    const filtered = this.duty.filter((assignment: any) => {
      // First filter by current day
      if (assignment.day_of_week !== currentDayOfWeek) return false;

      const shift = assignment.shift; // 'morning' or 'afternoon'

      if (shift === 'morning') {
        // Morning shift: 30 minutes before school_start_time to lunch_start_time
        return currentTime >= morningStartTime && currentTime <= lunchStartTime;
      } else if (shift === 'afternoon') {
        // Afternoon shift: lunch_start_time to last lesson end
        return currentTime >= lunchStartTime && currentTime <= lastLessonEndTime;
      }

      return false;
    });

    // Group by location and shift
    const groups: { [key: string]: any[] } = {};
    
    filtered.forEach(assignment => {
      let locationName = 'İdare';
      let shiftName = assignment.shift === 'morning' ? 'Sabah' : 'Öğleden Sonra';
      
      if (assignment.duty_location) {
        locationName = `${assignment.duty_location.name} (${shiftName})`;
      } else {
        // Administrators don't have duty locations
        locationName = `İdare (${shiftName})`;
      }
      
      if (!groups[locationName]) {
        groups[locationName] = [];
      }
      groups[locationName].push(assignment);
    });

    // Convert to array and sort groups by location order
    const result = Object.keys(groups).map(locationName => ({
      location: locationName,
      assignments: groups[locationName].sort((a: any, b: any) => {
        // Within each group, sort by administrator status, then vice principal status
        const aIsAdministrator = !a.duty_location;
        const bIsAdministrator = !b.duty_location;
        const aIsVicePrincipal = a.employee?.employee_type?.is_vice_principal || false;
        const bIsVicePrincipal = b.employee?.employee_type?.is_vice_principal || false;
        
        // Administrators first
        if (aIsAdministrator && !bIsAdministrator) return -1;
        if (!aIsAdministrator && bIsAdministrator) return 1;
        
        // Then vice principals
        if (aIsVicePrincipal && !bIsVicePrincipal) return -1;
        if (!aIsVicePrincipal && bIsVicePrincipal) return 1;
        
        // Then by duty location order if they have locations
        if (a.duty_location && b.duty_location) {
          return (a.duty_location.order || 0) - (b.duty_location.order || 0);
        }
        
        return 0;
      })
    }));

    // Sort groups: put Yönetim groups first, then sort by location order
    return result.sort((a, b) => {
      const aIsManagement = a.location.includes('İdare');
      const bIsManagement = b.location.includes('İdare');
      
      if (aIsManagement && !bIsManagement) return -1;
      if (!aIsManagement && bIsManagement) return 1;
      
      // For non-management groups, try to sort by location order
      // Extract location order from assignments (assuming all assignments in group have same location)
      const aOrder = a.assignments[0]?.duty_location?.order || 999;
      const bOrder = b.assignments[0]?.duty_location?.order || 999;
      
      return aOrder - bOrder;
    });
  }

  // Helper to parse time string (HH:MM) to minutes since midnight
  private parseTimeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
  }

  private updateScheduleDerived(nowDate: Date){
    console.log('updateScheduleDerived called with nowDate:', nowDate);
    console.log('Current date/time info:');
    console.log('- Full date:', nowDate.toISOString());
    console.log('- Date string:', nowDate.toDateString());
    console.log('- Time string:', nowDate.toTimeString());
    console.log('- getDay() (JS):', nowDate.getDay(), '(0=Sun, 1=Mon, ..., 5=Fri, 6=Sat)');
    console.log('- API day_of_week equivalent:', nowDate.getDay() === 0 ? 7 : nowDate.getDay(), '(1=Mon, ..., 7=Sun)');
    
    if (!this.schedule || !Array.isArray(this.schedule.lessons)) {
      console.log('No schedule or lessons array:', this.schedule);
      return;
    }
    
    const lessons = this.schedule.lessons;
    const currentDayOfWeek = nowDate.getDay() === 0 ? 7 : nowDate.getDay();
    console.log('Processing', lessons.length, 'lessons for day_of_week =', currentDayOfWeek);
    
    // Filter lessons for current day
    const todayLessons = lessons.filter(l => {
      if (typeof l.day_of_week !== 'undefined' && l.day_of_week !== null) {
        return Number(l.day_of_week) === currentDayOfWeek;
      }
      return true; // No day_of_week field means include all
    });
    
    console.log('Found', todayLessons.length, 'lessons for today');
    
    const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
    let active: any = null;
    let next: any = null;
    
    // First pass: find active period
    for (const l of todayLessons) {
      // Parse start and end times
      let start: Date | null = null;
      let end: Date | null = null;
      let title = l.title || l.period_name || '';
      
      if (l.start_time) {
        const [hh, mm, ss] = String(l.start_time).split(':').map(x => parseInt(x, 10));
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hh || 0, mm || 0, ss || 0);
      }
      
      if (l.end_time) {
        const [ehh, emm, ess] = String(l.end_time).split(':').map(x => parseInt(x, 10));
        end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), ehh || 0, emm || 0, ess || 0);
      }
      
      // If no end_time, calculate from duration_minutes
      if (!end && l.duration_minutes && start) {
        end = new Date(start.getTime() + Number(l.duration_minutes) * 60000);
      }
      
      // Title fallback
      if (!title) {
        if (l.period_type === 'class') title = l.period_name || 'Ders';
        else if (l.period_type) title = l.period_type.replace(/(^|_)([a-z])/g, (m, p, c) => c.toUpperCase());
        else title = 'Periyot';
      }
      
      // Legacy time range support
      if (!start && !end && l.time) {
        const parts = String(l.time).split('-').map((p: string) => p.trim());
        if (parts.length >= 2) {
          start = this.parseTimeToDate(parts[0], today);
          end = this.parseTimeToDate(parts[1], today);
          if (!title) title = l.title || 'Ders';
        }
      }
      
      // Skip if missing start or end time
      if (!start || !end) {
        console.log('Missing start or end time, skipping lesson:', l.period_name);
        continue;
      }
      
      const timeRange = `${this.formatTime(start)} - ${this.formatTime(end)}`;
      console.log('Checking lesson:', l.period_name, 'time range:', timeRange);
      
      // Check if current time is within this period
      if (nowDate >= start && nowDate <= end) {
        console.log('Found active period:', l.period_name);
        active = { 
          title: title || l.period_name || 'Ders', 
          start, 
          end, 
          timeRange, 
          period_type: l.period_type || (l.duration_minutes ? 'class' : undefined), 
          period_name: l.period_name 
        };
        break; // Found active period, no need to continue first pass
      }
    }
    
    // Second pass: find next period (only if we have lessons and no active period, or we want next even with active)
    for (const l of todayLessons) {
      // Parse start and end times (same logic as first pass)
      let start: Date | null = null;
      let end: Date | null = null;
      let title = l.title || l.period_name || '';
      
      if (l.start_time) {
        const [hh, mm, ss] = String(l.start_time).split(':').map(x => parseInt(x, 10));
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hh || 0, mm || 0, ss || 0);
      }
      
      if (l.end_time) {
        const [ehh, emm, ess] = String(l.end_time).split(':').map(x => parseInt(x, 10));
        end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), ehh || 0, emm || 0, ess || 0);
      }
      
      // If no end_time, calculate from duration_minutes
      if (!end && l.duration_minutes && start) {
        end = new Date(start.getTime() + Number(l.duration_minutes) * 60000);
      }
      
      // Title fallback
      if (!title) {
        if (l.period_type === 'class') title = l.period_name || 'Ders';
        else if (l.period_type) title = l.period_type.replace(/(^|_)([a-z])/g, (m, p, c) => c.toUpperCase());
        else title = 'Periyot';
      }
      
      // Legacy time range support
      if (!start && !end && l.time) {
        const parts = String(l.time).split('-').map((p: string) => p.trim());
        if (parts.length >= 2) {
          start = this.parseTimeToDate(parts[0], today);
          end = this.parseTimeToDate(parts[1], today);
          if (!title) title = l.title || 'Ders';
        }
      }
      
      // Skip if missing start or end time
      if (!start || !end) {
        continue;
      }
      
      // Check if this is the next upcoming period
      if (nowDate < start && (!next || start < next.start)) {
        next = { 
          title: title || l.period_name || 'Ders', 
          start, 
          end, 
          timeRange: `${this.formatTime(start)} - ${this.formatTime(end)}`,
          period_type: l.period_type || (l.duration_minutes ? 'class' : undefined),
          period_name: l.period_name 
        };
      }
    }
    
    // Update schedule based on findings
    if (active) {
      const diffMs = active.end.getTime() - nowDate.getTime();
      const totalMs = active.end.getTime() - active.start.getTime();
      const mm = Math.floor(diffMs / 60000);
      const ss = Math.floor((diffMs % 60000) / 1000);
      const mmStr = String(mm).padStart(2, '0');
      const ssStr = String(ss).padStart(2, '0');
      this.schedule.current = active;
      this.schedule.next = next; // Store next period info
      this.schedule.isActive = true;
      this.schedule.timeLeftText = `${mmStr} : ${ssStr}`;
      this.schedule.remainingMinutes = mm + (ss / 60); // Store remaining time in minutes
      this.schedule.elapsedMinutes = (totalMs - diffMs) / 60000; // Store elapsed time in minutes
      console.log('Active period set:', active.period_name, 'remaining:', this.schedule.timeLeftText, 'minutes:', this.schedule.remainingMinutes, 'elapsed:', this.schedule.elapsedMinutes);

      // Check for class transition modal: if current is break, next is class, and less than 1 minute remaining
      if (active.period_type === 'break' && next?.period_type === 'class' && this.schedule.remainingMinutes < 1) {
        this.showClassTransitionModal = true;
        this.classTransitionCountdown = this.formatTimeRemaining(diffMs);
      } else {
        this.showClassTransitionModal = false;
        this.classTransitionCountdown = '';
      }
    } else if (next) {
      const diffMs = next.start.getTime() - nowDate.getTime();
      this.schedule.current = { 
        title: 'Sonraki: ' + (next.title || ''), 
        start: next.start, 
        end: next.end, 
        timeRange: next.timeRange, 
        period_name: next.period_name || next.title 
      };
      this.schedule.next = null; // No next period when current is next
      this.schedule.isActive = false;
      this.schedule.timeLeftText = this.formatTimeRemaining(diffMs);
      this.schedule.remainingMinutes = null; // No remaining time for upcoming periods
      this.schedule.elapsedMinutes = null; // No elapsed time for upcoming periods
      console.log('Next period set:', next.period_name, 'starts in:', this.schedule.timeLeftText);

      // Hide modal when no active period
      this.showClassTransitionModal = false;
      this.classTransitionCountdown = '';
    } else {
      this.schedule.current = null;
      this.schedule.next = null;
      this.schedule.isActive = false;
      this.schedule.timeLeftText = '-- : --';
      this.schedule.remainingMinutes = null;
      this.schedule.elapsedMinutes = null;
      console.log('No active or upcoming periods found');

      // Hide modal when no periods
      this.showClassTransitionModal = false;
      this.classTransitionCountdown = '';
    }
  }

  private formatTime(d: Date){
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    return `${hh}:${mm}`;
  }

  private formatTimeRemaining(milliseconds: number): string {
    const totalMinutes = Math.floor(milliseconds / 60000);
    
    // Eğer 24 saat (1440 dakika) ve üstü ise gün olarak göster
    if (totalMinutes >= 1440) {
      const days = Math.floor(totalMinutes / 1440);
      return `${days} gün`;
    }
    
    // Normal format: gün saat dakika saniye (sıfır olanları gösterme)
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} gün`);
    if (hours > 0) parts.push(`${hours} saat`);
    if (minutes > 0) parts.push(`${minutes} dakika`);
    if (seconds > 0 && parts.length === 0) parts.push(`${seconds} saniye`); // Sadece saniye varsa göster
    
    return parts.join(' ') || '0 saniye';
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

  private stopBirthdayCarousel(): void {
    if (this.birthdayTimerId) {
      clearInterval(this.birthdayTimerId);
      this.birthdayTimerId = null;
    }
  }

  private startBirthdayCarousel(): void {
    this.stopBirthdayCarousel(); // Clear any existing timer
    if (this.birthdays.length > 1) { // Only start if we have more than 1 birthday
      this.birthdayTimerId = setInterval(() => {
        // Add highlight effect before changing
        const currentElement = document.querySelector('.student-name');
        if (currentElement) {
          currentElement.classList.add('highlight');
          setTimeout(() => {
            currentElement.classList.remove('highlight');
            this.currentBirthdayIndex = (this.currentBirthdayIndex + 1) % this.birthdays.length;
          }, 300);
        } else {
          this.currentBirthdayIndex = (this.currentBirthdayIndex + 1) % this.birthdays.length;
        }
      }, 5000); // Change every 5 seconds
    }
  }
}
