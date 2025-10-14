import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
// Router not used in this component
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DutySchedulePickerDialogComponent } from './duty-schedule-picker-dialog.component';
import { apiBase } from '../runtime-config';
import { AuthService } from '../services/auth.service';
import { EmployeeTypeService } from '../services/employee-type.service';

@Component({
  selector: 'app-duty-schedule',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatChipsModule, MatCheckboxModule, MatSelectModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatSnackBarModule],
  template: `
    <div class="container">
      <div class="header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()" matTooltip="Geri" class="back-btn">
            <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
          </button>
          <h1>
            <mat-icon fontSet="material-symbols-outlined">badge</mat-icon>
            Nöbet Yönetimi
          </h1>
        </div>
        <div style="display:flex; gap:8px; align-items:center">
          <button mat-stroked-button color="primary" (click)="router.navigate(['/duty-locations'])">
            <mat-icon fontSet="material-symbols-outlined">place</mat-icon>
            Nöbet Yerleri
          </button>
          <button mat-raised-button color="primary" (click)="openPicker()" class="add-btn">
            <mat-icon fontSet="material-symbols-outlined">list_alt</mat-icon>
            Nöbet Tanımları
          </button>
        </div>
      </div>
      <div class="card">
        <div style="padding:0.75rem; display:flex; gap:12px; align-items:center; margin-bottom:12px;">
          <div style="flex:1; display:flex; justify-content:flex-start; gap:8px; align-items:center">
            <label style="font-weight:600; margin-right:8px">Mevcut Planlar:</label>
            <select [(ngModel)]="selectedScheduleId" (change)="onScheduleSelectChange()" style="height:36px; padding:6px; min-width:260px;">
              <option *ngFor="let s of schedulesList" [ngValue]="s.id">{{s.name}} — {{ s.effective_from ? (s.effective_from | date:'yyyy-MM-dd') : '-' }} — {{ s.shift === 'morning' ? 'Sabahçı' : 'Öğlenci' }} — {{ s.is_active ? 'Aktif' : 'Pasif' }}</option>
            </select>
          </div>
          <div style="display:flex; gap:8px; align-items:center">
            <button mat-stroked-button color="primary" (click)="updateAssignments()" [disabled]="!selectedScheduleId">
              <mat-icon fontSet="material-symbols-outlined" class="btn-icon">save</mat-icon>
              Atamaları Kaydet
            </button>
            <button mat-stroked-button color="warn" (click)="clearAssignments()" [disabled]="!selectedScheduleId">
              <mat-icon fontSet="material-symbols-outlined" class="btn-icon">delete_sweep</mat-icon>
              Atamaları Sil
            </button>
          </div>
        </div>

        <div *ngIf="isLoading">Yükleniyor...</div>

        <div *ngIf="!isLoading">
          <div class="matrix-wrapper" [class.assignments-highlight]="assignmentsChanged">
            <table class="matrix-table" style="width:100%; border-collapse:collapse;">
            <thead>
              <tr>
                <th style="padding:8px; text-align:left; width:200px">Gün</th>
                <th *ngFor="let loc of dutyLocations" style="padding:8px; text-align:center">{{ loc.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of dayOptions">
                <td style="padding:4px; font-weight:600; width:200px; vertical-align:top">
                  <div>{{ d.label }}</div>
                    <mat-form-field  style="width:100%; margin-top:5px;">
                    <mat-label>Müdür Yardımcıları</mat-label>
                    <mat-select multiple [panelClass]="'small-option-panel'" [ngModel]="getAssistants(d.value)" (ngModelChange)="setAssistants(d.value, $event)" (selectionChange)="onAssistantsChange(d.value)">
                      <mat-option *ngFor="let t of allAssistants" [value]="t.id">{{ t.name }}</mat-option>
                    </mat-select>
                  </mat-form-field>
                </td>
                <td *ngFor="let loc of dutyLocations" class="matrix-cell">
                  <mat-chip-listbox aria-label="Seçilen öğretmenler" class="chip-list">
                    <mat-chip-option *ngFor="let t of rowsByDay[d.value]?.selected[loc.id]" selected (removed)="removeTeacher(rowsByDay[d.value], loc.id, t.id)">
                      <span class="chip-text" style="font-size: 12px;">{{ t.name }}</span>
                      <button matChipRemove class="chip-remove-btn"><mat-icon fontSet="material-symbols-outlined">close</mat-icon></button>
                    </mat-chip-option>
                  </mat-chip-listbox>

                  <mat-form-field appearance="outline" class="small-field">
                    <mat-label style="padding-bottom: 12px;">Öğretmen ekle</mat-label>
                    <input matInput class="small-input" [matAutocomplete]="auto" [formControl]="rowsByDay[d.value].controls[loc.id]" (keyup.enter)="addTeacherFromInput(rowsByDay[d.value], loc.id)" />
                    <mat-autocomplete #auto="matAutocomplete" panelClass="small-option-panel" (optionSelected)="addTeacherFromOption($event, rowsByDay[d.value], loc.id)">
                      <mat-option *ngFor="let option of filteredOptionsForCell(rowsByDay[d.value].controls[loc.id].value, rowsByDay[d.value], loc.id)" [value]="option">
                        {{ option.name }}
                      </mat-option>
                    </mat-autocomplete>
                  </mat-form-field>
                </td>
              </tr>
            </tbody>
            </table>
          </div>


        </div>
      </div>
    </div>
  `
  ,
  styles: [
    `
    .container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .header h1 { margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.6rem; font-weight: 600; color: #2c3e50; }
    .header h1 mat-icon { font-size: 2rem; width: 2rem; height: 2rem; color: #1976d2; }
    .back-btn { background-color: #f8f9fa; color: #1976d2; border: 2px solid #e3f2fd; transition: all 0.2s ease; }
    .back-btn:hover { background-color: #e3f2fd; transform: scale(1.03); }
    .add-btn { padding: 0.6rem 1rem; border-radius: 8px; font-weight: 500; }
    .card { border-radius: 12px; background: #fff; }
.mdc-floating-label.mat-mdc-floating-label{padding-bottom:10px !important}
    /* matrix responsive styles */
    .matrix-wrapper { overflow-x: auto; width:100%; }
    .matrix-table { table-layout: fixed; min-width: 700px; width:100%; }
    .matrix-table th, .matrix-table td { word-wrap: break-word; overflow: hidden; text-overflow: ellipsis; }
    .matrix-cell { padding:8px; text-align:left; border-top:1px solid #eee; vertical-align:top; min-height:56px; max-width:220px; }
    .chip-list { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:6px; }
    .mat-chip { height:26px; font-size:12px; padding:0 6px; }
    .chip-text { display:inline-block; max-width:130px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; vertical-align:middle; }
    .chip-remove-btn { height:18px; width:18px; min-width:18px; margin-left:4px; }
    .small-field { width:100%; max-width:180px; }
  .small-input { font-size:13px; padding:1px 6px 10px 6px; }
  /* compact input height for small-field */
  :host ::ng-deep .small-field .mat-mdc-form-field-infix { padding-top: 0; padding-bottom: 10px; }
  :host ::ng-deep .small-field .mat-mdc-text-field-wrapper { height: 36px; }
  :host ::ng-deep .small-field .mat-mdc-form-field-flex { height: 36px; }
  /* smaller options in dropdowns within matrix */
  /* primary target: our small-option-panel (applies when panelClass used) */
  :host ::ng-deep .small-option-panel .mat-mdc-option .mdc-list-item__primary-text { font-size: 12px !important; line-height: 1.2 !important; }
  :host ::ng-deep .small-option-panel .mat-mdc-option { min-height: 30px !important; }
  :host ::ng-deep .small-option-panel .mdc-list-item { height: 24px !important; }
  /* fallback selectors for different Material versions / overlay structures */
  :host ::ng-deep .cdk-overlay-pane .mat-autocomplete-panel .mat-option .mat-option-text { font-size: 12px !important; line-height: 1.2 !important; }
  :host ::ng-deep .cdk-overlay-pane .mat-autocomplete-panel .mat-option { min-height: 24px !important; }
  :host ::ng-deep .mat-mdc-autocomplete-panel .mat-mdc-option .mdc-list-item__primary-text { font-size: 12px !important; line-height: 1.2 !important; }
  :host ::ng-deep .mat-mdc-autocomplete-panel .mat-mdc-option { min-height: 30px !important; }
  /* compact assistant select trigger */
  :host ::ng-deep .small-field-compact .mat-mdc-form-field-flex { height: 32px; }
  :host ::ng-deep .small-field-compact .mat-mdc-form-field-infix { padding-top: 0; padding-bottom: 8px; }
  :host ::ng-deep .small-field-compact .mat-mdc-select .mat-mdc-select-trigger { padding-top: 2px; padding-bottom: 2px; }

    @media (max-width: 1024px) {
      .matrix-table { min-width: 900px; }
      .matrix-cell { max-width:180px; }
    }
    @media (max-width: 768px) {
      .matrix-table { min-width: 700px; }
      .matrix-cell { max-width:140px; }
      .container { padding: 1rem; }
      .header h1 { font-size: 1.2rem; }
    }

    @media (max-width: 480px) {
      .matrix-table { min-width: 600px; }
      .matrix-cell { max-width:120px; }
    }
  /* brief highlight when assignments change (green) */
  .assignments-highlight { animation: assignmentsFlash 1500ms ease; }
  @keyframes assignmentsFlash { 0% { box-shadow: 0 0 0 0 rgba(76,175,80,0.0); } 10% { box-shadow: 0 0 18px 6px rgba(76,175,80,0.18); } 100% { box-shadow: none; } }
    `
  ]
})
export class DutyScheduleComponent implements OnInit {
  dutyLocations: any[] = [];
  rows: any[] = [];
  rowsByDay: { [day: number]: any } = {};
  dayOptions = [
    { value: 1, label: 'Pazartesi' },
    { value: 2, label: 'Salı' },
    { value: 3, label: 'Çarşamba' },
    { value: 4, label: 'Perşembe' },
    { value: 5, label: 'Cuma' },
    { value: 6, label: 'Cumartesi' },
    { value: 7, label: 'Pazar' }
  ];
  isLoading = false;
  allTeachers: any[] = []; // fetched personnel
  allAssistants: any[] = []; // only vice-principal personnel for assistants select
  rawEmployees: any[] = []; // raw fetched employees (fallback/source of truth)
  currentSchoolId: number | null = null;
  scheduleName = '';
  shift: 'morning' | 'afternoon' = 'morning';
  effectiveFrom: string = new Date().toISOString().slice(0,10);
  isActive = true;

  constructor(private http: HttpClient, private auth: AuthService, private cdr: ChangeDetectorRef, private dialog: MatDialog, private snack: MatSnackBar, public router: Router, private empTypeSvc: EmployeeTypeService) {}

  // NEW: dialog and schedule list
  schedulesList: any[] = [];
  selectedScheduleId: number | null = null;
  assignmentsChanged = false;

  openPicker() {
    if (!this.currentSchoolId) { alert('Okul seçili değil.'); return; }
    // open dialog via MatDialog (dialog will fetch schedules itself)
    try {
      const dialog = (this as any).dialog as MatDialog;
      if (!dialog) throw new Error('dialog not available');
      const ref = dialog.open(DutySchedulePickerDialogComponent, { width: '520px', data: { currentId: this.selectedScheduleId, schoolId: this.currentSchoolId } });
      ref.afterClosed().subscribe((res:any) => {
        // refresh schedule list and optionally load created/selected
        this.loadSchedules();
        if (!res) return;
        this.selectedScheduleId = res.id || null;
        if (this.selectedScheduleId) this.loadScheduleById(this.selectedScheduleId);
      });
    } catch (e) {
      // fallback: prompt
      const id = prompt('Plan id girin (veya boş = yeni):', this.selectedScheduleId ? String(this.selectedScheduleId) : '');
      if (id) { this.selectedScheduleId = Number(id); this.loadScheduleById(this.selectedScheduleId); }
    }
  }

  loadSchedules() {
    if (!this.currentSchoolId) return;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    this.http.get<any[]>(`${apiBase}/api/duty-schedule/list/${this.currentSchoolId}`, headers ? { headers } : undefined).subscribe(l => {
      this.schedulesList = (l || []).slice();
      // sort: active schedules on top, then by effective_from desc
      this.schedulesList.sort((a: any, b: any) => {
        const activeDiff = (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
        if (activeDiff !== 0) return activeDiff;
        const ta = a.effective_from ? Date.parse(a.effective_from) : 0;
        const tb = b.effective_from ? Date.parse(b.effective_from) : 0;
        return tb - ta;
      });
      // restore previously selected schedule for this school if exists
      this.restoreSavedSelection();
    }, err => console.error(err));
  }

  private getSavedScheduleKey() {
    return `duty_schedule_selected_${this.currentSchoolId || 'unknown'}`;
  }

  private restoreSavedSelection() {
    // if there's a saved selection in localStorage use it
    try {
      const key = this.getSavedScheduleKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        const id = Number(raw);
        if (this.schedulesList.some(s => s.id === id)) {
          this.selectedScheduleId = id;
          this.loadScheduleById(id);
          return;
        }
      }
    } catch (e) { /* ignore */ }
    // otherwise auto-select first schedule if available
    if (!this.selectedScheduleId && this.schedulesList && this.schedulesList.length > 0) {
      this.selectedScheduleId = this.schedulesList[0].id;
      if (this.selectedScheduleId) this.loadScheduleById(this.selectedScheduleId);
      this.saveSelectedSchedule();
    }
  }

  onScheduleSelectChange() {
    if (this.selectedScheduleId) this.loadScheduleById(this.selectedScheduleId);
    this.saveSelectedSchedule();
  }

  private saveSelectedSchedule() {
    try {
      const key = this.getSavedScheduleKey();
      if (this.selectedScheduleId) localStorage.setItem(key, String(this.selectedScheduleId));
      else localStorage.removeItem(key);
    } catch (e) { /* ignore */ }
  }

  loadScheduleById(id: number) {
    if (!id) return;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    this.http.get<any>(`${apiBase}/api/duty-schedule/id/${id}`, headers ? { headers } : undefined).subscribe(sch => {
      if (!sch) return;
      this.scheduleName = sch.name || '';
      this.isActive = !!sch.is_active;
      // clear existing
      for (const r of this.rows) {
        for (const loc of this.dutyLocations) r.selected[loc.id] = [];
        r.assistants = [];
      }
  const assignments = (sch.Assignments || []) as any[];
      // map assistant assignments (duty_location_id == null) into rows' assistants
      for (const a of assignments.filter(x => x.duty_location_id == null)) {
        const dNum = this.dayStrToNum(a.day_of_week);
        const row = this.rowsByDay[dNum] || this.rows.find(r=>r.day===dNum);
        if (!row) continue;
        if (!row.assistants) row.assistants = [];
        if (a.school_employee_id && !row.assistants.includes(a.school_employee_id)) row.assistants.push(a.school_employee_id);
      }
      for (const a of assignments) {
        const dNum = this.dayStrToNum(a.day_of_week);
        const row = this.rowsByDay[dNum] || this.rows.find(r=>r.day===dNum);
        if (!row) continue;
        const locId = a.duty_location_id;
        row.selected[locId] = row.selected[locId] || [];
        const emp = this.normalizeEmployeeFromAssignment(a);
        if (emp && !row.selected[locId].some((t:any)=>t.id===emp.id)) row.selected[locId].push(emp);
      }
  this.cdr.detectChanges();
  // highlight when plan loaded
  this.flashAssignmentsHighlight();
      // restore assistant selections (stored locally per schedule)
      // assistants are loaded from DB; no localStorage fallback
    }, err => console.error(err));
  }

  updateAssignments() {
    if (!this.selectedScheduleId) { alert('Önce bir plan seçin veya kaydedin.'); return; }
    const assignments: any[] = [];
    for (const d of this.dayOptions) {
      const row = this.rowsByDay[d.value];
      if (!row) continue;
      for (const loc of this.dutyLocations) {
        const arr = row.selected[loc.id] || [];
        for (const t of arr) {
          if (!t || !t.id) continue;
          assignments.push({ day_of_week: this.dayNumToStr(d.value), duty_location_id: loc.id, school_employee_id: t.id });
        }
      }
      // include assistants for this day as assignments with null duty_location_id
      const assts = row.assistants || [];
      for (const aId of assts) {
        if (!aId) continue;
        assignments.push({ day_of_week: this.dayNumToStr(d.value), duty_location_id: null, school_employee_id: aId });
      }
    }
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    const assistantCount = assignments.filter(a => a.duty_location_id == null).length;
    this.http.put(`${apiBase}/api/duty-schedule/${this.selectedScheduleId}/assignments`, { assignments }, headers ? { headers } : undefined).subscribe({ next: () => {
        this.snack.open(`Atamalar güncellendi${assistantCount ? ' — ' + assistantCount + ' müdür yardımcısı ataması kaydedildi' : ''}`, 'Kapat', { duration: 3500 });
        this.flashAssignmentsHighlight();
      }, error: err => { console.error(err); this.snack.open('Güncelleme başarısız', 'Kapat', { duration: 4000 }); } });
    // assistants are persisted in DB (duty_location_id = null); no localStorage saving
  }

  clearAssignments() {
    if (!this.selectedScheduleId) { alert('Önce bir plan seçin.'); return; }
    if (!confirm('Bu planın tüm atamaları silinsin mi?')) return;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    // count assistants to be removed
    const assistantsToRemove = this.rows.reduce((sum, r) => sum + ((r.assistants && r.assistants.length) || 0), 0);
    this.http.put(`${apiBase}/api/duty-schedule/${this.selectedScheduleId}/assignments`, { assignments: [] }, headers ? { headers } : undefined).subscribe({ next: () => {
      // clear UI selections
      for (const r of this.rows) {
        for (const loc of this.dutyLocations) r.selected[loc.id] = [];
        r.assistants = [];
      }
      this.cdr.detectChanges();
      this.snack.open(`Atamalar silindi${assistantsToRemove ? ' — ' + assistantsToRemove + ' müdür yardımcısı ataması silindi' : ''}`, 'Kapat', { duration: 3500 });
      this.flashAssignmentsHighlight();
    }, error: err => { console.error(err); this.snack.open('Atamalar silinemedi', 'Kapat', { duration: 4000 }); } });
  }

  ngOnInit(): void {
    try {
      (this.auth as any).selectedSchool$.subscribe((s: any) => {
        const schoolId = s && s.id ? s.id : null;
        this.currentSchoolId = schoolId;
        // load related data and schedules when a school is selected
        this.loadDutyLocations(schoolId);
        this.loadTeachers(schoolId);
        this.loadSchedules();
        this.loadCurrentSchedule();
      });
    } catch (e) {
      this.loadDutyLocations();
      this.loadTeachers();
    }
  }

  ensureDefaultRows() {
    if (!this.rows) this.rows = [];
    for (let d = 1; d <= 7; d++) {
      if (!this.rows.some(r => r.day === d)) {
        const row: any = { day: d, selected: {}, controls: {}, assistants: [] };
        for (const loc of this.dutyLocations) {
          row.selected[loc.id] = [];
          row.controls[loc.id] = new FormControl('');
        }
        this.rows.push(row);
      }
    }
  }

  // assistants selections are loaded/saved from the DB; do not persist them locally
  onAssistantsChange(day: number) {
    // no-op
  }

  private normalizeEmployeeFromAssignment(a: any) {
    // prefer nested Employee object if available
    if (a.Employee && (a.Employee.name || a.Employee.id)) return { id: a.school_employee_id || a.Employee.id, name: a.Employee.name || '' };
    // fallback: try lookup in allTeachers
    const id = a.school_employee_id;
    if (id) {
      const found = this.allTeachers.find(t => t.id === id);
      if (found) return { id: found.id, name: found.name };
      return { id, name: '' };
    }
    return null;
  }

  private flashAssignmentsHighlight() {
    this.assignmentsChanged = true;
  try { setTimeout(() => { this.assignmentsChanged = false; this.cdr.detectChanges(); }, 1600); } catch (e) { this.assignmentsChanged = false; }
    this.cdr.detectChanges();
  }

  addTeacherFromOption(event: any, row: any, locId: any) {
    const obj = event && event.option && event.option.value ? event.option.value : null;
    if (!obj) return;
    if (!row.selected[locId].some((t:any)=>t.id === obj.id)) row.selected[locId].push(obj);
    row.controls[locId].setValue('');
  }

  addTeacherFromInput(row: any, locId: any) {
    const txt = (row.controls[locId].value || '').toString().trim();
    if (!txt) return;
    const found = this.allTeachers.find(t => (t.name||'').toString().toLowerCase() === txt.toLowerCase());
    if (found) {
      if (!row.selected[locId].some((t:any)=>t.id === found.id)) row.selected[locId].push(found);
      row.controls[locId].setValue('');
      return;
    }
    const pseudo = { id: `pseudo-${Date.now()}`, name: txt };
    row.selected[locId].push(pseudo);
    row.controls[locId].setValue('');
  }

  goBack() { history.back(); }

  loadDutyLocations(schoolId?: number | null) {
    this.isLoading = true;
    let url = `${apiBase}/api/duty_locations`;
    if (schoolId) url += `?school_id=${schoolId}`;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    this.http.get<any[]>(url, headers ? { headers } : undefined).subscribe(d => {
      this.dutyLocations = d || [];
      this.ensureDefaultRows();
      this.prepareRowsControls();
      this.isLoading = false;
    }, err => { console.error(err); this.isLoading = false; });
  }

  loadTeachers(schoolId?: number | null) {
    if (!schoolId) {
      this.allTeachers = [];
      this.allAssistants = [];
      return;
    }
    const url = `${apiBase}/api/school-employees/school/${schoolId}`;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    this.http.get<any[]>(url, headers ? { headers } : undefined).subscribe(l => {
      const fetched = l || [];
      // keep raw list for fallback/autocomplete completeness
      this.rawEmployees = fetched.slice();
      // compute assistants from raw fetched list (do NOT derive from filtered teachers)
      const hasEmployeeTypeInfoRaw = (fetched || []).some(emp => emp.EmployeeType != null);
      if (hasEmployeeTypeInfoRaw) {
        // some records include nested EmployeeType; derive vice-principal type ids from those
        const viceTypeIdsFromNested = Array.from(new Set((fetched || []).filter(e => e.EmployeeType && e.EmployeeType.is_vice_principal).map(e => e.employee_type_id)));
        if (viceTypeIdsFromNested.length > 0) {
          // include employees that either have nested EmployeeType.is_vice_principal OR whose employee_type_id matches known vice-principal type ids
          this.allAssistants = (fetched || []).filter(emp => (emp.EmployeeType && !!emp.EmployeeType.is_vice_principal) || (emp.employee_type_id && viceTypeIdsFromNested.includes(emp.employee_type_id)));
        } else {
          // no nested vice-principal flags found; fall back to listing those with nested flag anyway
          this.allAssistants = (fetched || []).filter(emp => emp.EmployeeType && !!emp.EmployeeType.is_vice_principal);
        }
        this.cdr.detectChanges();
      } else {
        // no nested EmployeeType — fetch types and match by employee_type_id
        this.empTypeSvc.list().subscribe(types => {
          const viceType = (types || []).find((t:any) => t.is_vice_principal);
          if (viceType) this.allAssistants = (fetched || []).filter(emp => emp.employee_type_id === viceType.id);
          else this.allAssistants = [];
          this.cdr.detectChanges();
        }, () => { this.cdr.detectChanges(); });
      }

      // now compute teachers list from fetched
      const hasEmployeeTypeInfo = (fetched || []).some(emp => emp.EmployeeType != null);
      if (hasEmployeeTypeInfo) {
        // derive teacher type ids from nested EmployeeType data when present
        const teacherTypeIdsFromNested = Array.from(new Set((fetched || []).filter(e => e.EmployeeType && e.EmployeeType.is_teacher).map(e => e.employee_type_id)));
        if (teacherTypeIdsFromNested.length > 0) {
          this.allTeachers = (fetched || []).filter(emp => (emp.EmployeeType && !!emp.EmployeeType.is_teacher) || (emp.employee_type_id && teacherTypeIdsFromNested.includes(emp.employee_type_id)));
        } else {
          // if nested info exists but no teacher flags, try to pick by EmployeeType truthy
          this.allTeachers = (fetched || []).filter(emp => emp.EmployeeType && !!emp.EmployeeType.is_teacher);
        }
        this.cdr.detectChanges();
      } else {
        // fallback: fetch employee types to determine which ids are teacher types
        this.empTypeSvc.list().subscribe(types => {
          const teacherTypeIds = (types || []).filter((t:any) => t.is_teacher).map((t:any) => t.id);
          if (teacherTypeIds.length > 0) {
            this.allTeachers = (fetched || []).filter(emp => teacherTypeIds.includes(emp.employee_type_id));
          } else {
            // if no teacher types found, fall back to showing all fetched employees
            this.allTeachers = fetched || [];
          }
          this.cdr.detectChanges();
        }, () => {
          // on error fetching employee types, show fetched list instead of empty
          this.allTeachers = fetched || [];
          this.cdr.detectChanges();
        });
      }
    }, err => console.error(err));
  }

  prepareRowsControls() {
    for (const row of this.rows) {
      for (const loc of this.dutyLocations) {
        if (!row.controls[loc.id]) {
          row.selected[loc.id] = [];
          row.controls[loc.id] = new FormControl('');
          row.controls[loc.id].valueChanges.subscribe((val:any) => {
            if (!val) return; const obj = typeof val === 'object' ? val : this.allTeachers.find(t=>t.id===val) || null; if (!obj) return; if (!row.selected[loc.id].some((t:any)=>t.id===obj.id)) row.selected[loc.id].push(obj); row.controls[loc.id].setValue('');
          });
        }
      }
    }
    this.rowsByDay = {} as any;
    for (const r of this.rows) this.rowsByDay[r.day] = r;
  }

  onShiftChange() { this.loadCurrentSchedule(); }

  private dayNumToStr(day: number): string {
    const map: any = { 1:'monday', 2:'tuesday', 3:'wednesday', 4:'thursday', 5:'friday', 6:'saturday', 7:'sunday' };
    return map[day];
  }
  private dayStrToNum(s: string): number {
    const map: any = { monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6, sunday:7 };
    return map[s] || 1;
  }

  loadCurrentSchedule() {
    if (!this.currentSchoolId) return;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    const url = `${apiBase}/api/duty-schedule/${this.currentSchoolId}?shift=${this.shift}`;
    this.http.get<any>(url, headers ? { headers } : undefined).subscribe(sch => {
      if (!sch) {
        for (const r of this.rows) for (const loc of this.dutyLocations) r.selected[loc.id] = [];
        this.scheduleName = '';
        this.isActive = true;
        return;
      }
      this.scheduleName = sch.name || '';
      this.isActive = !!sch.is_active;
      for (const r of this.rows) for (const loc of this.dutyLocations) r.selected[loc.id] = [];
      for (const r of this.rows) r.assistants = [];
      const assignments = (sch.Assignments || []) as any[];
      for (const a of assignments.filter(x => x.duty_location_id == null)) {
        const dNum = this.dayStrToNum(a.day_of_week);
        const row = this.rowsByDay[dNum] || this.rows.find(r=>r.day===dNum);
        if (!row) continue;
        if (!row.assistants) row.assistants = [];
        if (a.school_employee_id && !row.assistants.includes(a.school_employee_id)) row.assistants.push(a.school_employee_id);
      }
      for (const a of assignments) {
        const dNum = this.dayStrToNum(a.day_of_week);
        const row = this.rowsByDay[dNum] || this.rows.find(r=>r.day===dNum);
        if (!row) continue;
        const locId = a.duty_location_id;
        row.selected[locId] = row.selected[locId] || [];
        const emp = a.Employee || { id: a.school_employee_id, name: (a.Employee && a.Employee.name) || '' };
        if (!row.selected[locId].some((t:any)=>t.id===emp.id)) row.selected[locId].push(emp);
      }
  this.cdr.detectChanges();
  // highlight when current schedule loaded
  this.flashAssignmentsHighlight();
    }, err => console.error(err));
  }

  saveSchedule() {
    if (!this.currentSchoolId) { alert('Okul seçili değil.'); return; }
    if (!this.scheduleName || !this.shift || !this.effectiveFrom) { alert('Plan adı, vardiya ve başlangıç tarihini doldurun.'); return; }
    const assignments: any[] = [];
    for (const d of this.dayOptions) {
      const row = this.rowsByDay[d.value];
      if (!row) continue;
      for (const loc of this.dutyLocations) {
        const arr = row.selected[loc.id] || [];
        for (const t of arr) {
          if (!t || !t.id) continue;
          assignments.push({ day_of_week: this.dayNumToStr(d.value), duty_location_id: loc.id, school_employee_id: t.id });
        }
      }
      // include assistants as assistant-only assignments (duty_location_id = null)
      const assts = row.assistants || [];
      for (const aId of assts) {
        if (!aId) continue;
        assignments.push({ day_of_week: this.dayNumToStr(d.value), duty_location_id: null, school_employee_id: aId });
      }
    }
    const payload = { school_id: this.currentSchoolId, name: this.scheduleName, shift: this.shift, effective_from: this.effectiveFrom, is_active: this.isActive, assignments };
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    const assistantCount = assignments.filter(a => a.duty_location_id == null).length;
    this.http.post(`${apiBase}/api/duty-schedule`, payload, headers ? { headers } : undefined).subscribe({
      next: () => { this.snack.open(`Plan kaydedildi${assistantCount ? ' — ' + assistantCount + ' müdür yardımcısı ataması kaydedildi' : ''}`, 'Kapat', { duration: 3500 }); this.loadCurrentSchedule(); this.flashAssignmentsHighlight(); },
      error: err => { console.error(err); this.snack.open('Plan kaydedilemedi', 'Kapat', { duration: 4000 }); }
    });
  }


  filteredOptionsForCell(query: string, row: any, locId: any) {
    const selectedIds = (row && row.selected && row.selected[locId]) ? row.selected[locId].map((t:any)=>t.id) : [];
    // build a deduped candidate list: prefer entries from allTeachers, but include rawEmployees as fallback
    const map = new Map<any, any>();
    for (const t of (this.allTeachers || [])) if (t && t.id) map.set(t.id, t);
    for (const t of (this.rawEmployees || [])) if (t && t.id && !map.has(t.id)) map.set(t.id, t);
    const candidates = Array.from(map.values());
    const sortByName = (arr:any[]) => arr.sort((a:any,b:any)=> (a.name||'').localeCompare(b.name||''));
    // Limit results to avoid rendering huge number of mat-option elements which can freeze the UI
    const MAX_OPTIONS = 50;
    if (!query) return sortByName(candidates.filter((t:any)=>!selectedIds.includes(t.id))).slice(0, MAX_OPTIONS);
    const q = query.toString().toLowerCase();
    return sortByName(candidates.filter((t:any) => !selectedIds.includes(t.id) && (t.name || '').toString().toLowerCase().includes(q))).slice(0, MAX_OPTIONS);
  }

  removeTeacher(row:any, locId:any, teacherId:any) {
    if (!row || !row.selected || !row.selected[locId]) return;
    row.selected[locId] = row.selected[locId].filter((t:any)=>t.id !== teacherId);
  }

  // Getter method to safely access assistants
  getAssistants(dayValue: number): any[] {
    return this.rowsByDay[dayValue]?.assistants || [];
  }

  // Setter method to update assistants
  setAssistants(dayValue: number, value: any[]): void {
    if (!this.rowsByDay[dayValue]) {
      this.rowsByDay[dayValue] = { assistants: [] };
    }
    this.rowsByDay[dayValue].assistants = value;
  }
}
