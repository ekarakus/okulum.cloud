import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { apiBase } from '../runtime-config';
import { AuthService } from '../services/auth.service';

interface DutyCell { teachers: any[] }

@Component({
  selector: 'app-duty-roster',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatChipsModule, MatCheckboxModule, MatDividerModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <div class="header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <div style="display:flex; align-items:center; gap:12px;">
          <button mat-icon-button (click)="goBack()"><mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon></button>
          <h1 style="margin:0; font-size:1.25rem; font-weight:600;">Nöbetçi Tablosu</h1>
        </div>
        <div>
          <button mat-raised-button color="primary" (click)="addRow()"><mat-icon fontSet="material-symbols-outlined">add</mat-icon> Yeni Satır Ekle</button>
          <button mat-stroked-button color="accent" (click)="save()" style="margin-left:8px">Kaydet</button>
        </div>
      </div>

      <mat-card>
        <div style="padding:0.75rem;">
          <div style="margin-bottom:8px; color:#666; font-size:13px">Nöbet yerleri yatay başlıklarda, her hücreye bir veya birden fazla öğretmen ekleyin.</div>

          <div *ngIf="isLoading">Yükleniyor...</div>

          <div *ngIf="!isLoading">
            <div *ngIf="!dutyLocations || dutyLocations.length === 0" style="padding:1rem; text-align:center; color:#666">
              <p>Bu okul için henüz Nöbet Yeri tanımlanmamış.</p>
              <button mat-raised-button color="primary" (click)="router.navigate(['/duty-locations'])">Nöbet Yerleri Oluştur</button>
            </div>
            <div *ngIf="dutyLocations && dutyLocations.length">
              <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px">
                <strong style="width:200px;">Nöbet Yerleri:</strong>
                <span *ngFor="let loc of dutyLocations" style="background:#f3f4f6; padding:6px 10px; border-radius:8px">{{ loc.name }}</span>
              </div>
              <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="padding:8px; text-align:left; width:200px">Gün</th>
                  <th *ngFor="let loc of dutyLocations" style="padding:8px; text-align:center">{{ loc.name }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of rows; let ri = index" style="border-bottom:1px solid #eee;">
                  <td style="padding:8px; vertical-align:top;">
                    <div style="display:flex; gap:8px; align-items:center">
                      <select [(ngModel)]="row.day" style="flex:1; padding:6px">
                        <option *ngFor="let d of dayOptions" [value]="d.value">{{ d.label }}</option>
                      </select>
                      <button mat-icon-button color="warn" (click)="removeRow(ri)" title="Satırı sil">
                        <mat-icon fontSet="material-symbols-outlined">delete</mat-icon>
                      </button>
                    </div>
                  </td>
                  <td *ngFor="let loc of dutyLocations" style="padding:8px; vertical-align:top; text-align:left">
                    <mat-form-field style="width:100%">
                      <input type="text" matInput [formControl]="row.controls[loc.id]" [matAutocomplete]="auto" placeholder="Öğretmen ekle" (keydown.enter)="$event.preventDefault(); addTeacherFromInput(row, loc.id)">
                      <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayTeacher" (optionSelected)="addTeacherFromOption($event, row, loc.id)">
                        <mat-option *ngFor="let opt of filteredOptionsForCell(row.controls[loc.id].value, row, loc.id)" [value]="opt">{{ opt.name }}</mat-option>
                      </mat-autocomplete>
                    </mat-form-field>

                    <div *ngIf="row.selected[loc.id] && row.selected[loc.id].length" style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
                      <span *ngFor="let t of row.selected[loc.id]" style="display:inline-flex; align-items:center; gap:6px; background:#eee; padding:6px 8px; border-radius:16px; font-size:13px">
                        <span>{{ t.name }}</span>
                        <button (click)="removeTeacher(row, loc.id, t.id)" title="Sil" style="border:none; background:transparent; cursor:pointer; padding:0; line-height:1">✕</button>
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </mat-card>
    </div>
  `
})
export class DutyRosterComponent implements OnInit {
  dutyLocations: any[] = [];
  rows: any[] = [];
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

  constructor(private http: HttpClient, private auth: AuthService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    // watch selected school and reload duty locations when it changes
    try {
      (this.auth as any).selectedSchool$.subscribe((s: any) => {
        const schoolId = s && s.id ? s.id : null;
        this.loadDutyLocations(schoolId);
        this.loadTeachers(schoolId);
      });
    } catch (e) {
      // fallback: load without school filter
      this.loadDutyLocations();
      this.loadTeachers();
    }
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
    // try to match by name (case-insensitive)
    const found = this.allTeachers.find(t => (t.name||'').toString().toLowerCase() === txt.toLowerCase());
    if (found) {
      if (!row.selected[locId].some((t:any)=>t.id === found.id)) row.selected[locId].push(found);
      row.controls[locId].setValue('');
      return;
    }
    // fallback: create a pseudo entry (no id) so user can still add by typing
    const pseudo = { id: `pseudo-${Date.now()}`, name: txt };
    row.selected[locId].push(pseudo);
    row.controls[locId].setValue('');
  }

  goBack() { history.back(); }

  loadDutyLocations(schoolId?: number | null) {
    this.isLoading = true;
    let url = `${apiBase}/api/duty_locations`;
    if (schoolId) url += `?school_id=${schoolId}`;
    this.http.get<any[]>(url).subscribe(d => {
      this.dutyLocations = d || [];
      this.isLoading = false;
      this.prepareRowsControls();
      // ensure at least one row exists after we know locations
      if (!this.rows || this.rows.length === 0) this.addRow();
    }, err => { console.error(err); this.isLoading = false; });
  }

  loadTeachers(schoolId?: number | null) {
    // simple fetch; allow optional school filter
    let url = `${apiBase}/api/school-employees`;
    if (schoolId) url += `?school_id=${schoolId}`;
    this.http.get<any[]>(url).subscribe(l => { this.allTeachers = l || []; this.cdr.detectChanges(); }, err => console.error(err));
  }

  addRow() {
    const row: any = { day: 1, selected: {}, controls: {} };
    for (const loc of this.dutyLocations) {
      row.selected[loc.id] = [];
      row.controls[loc.id] = new FormControl('');
      // when user selects an option replace selected
      row.controls[loc.id].valueChanges.subscribe((val:any) => {
        if (!val) return;
        // value may be object from option
        const obj = typeof val === 'object' ? val : this.allTeachers.find(t=>t.id===val) || null;
        if (!obj) return;
        // add if not present
        if (!row.selected[loc.id].some((t:any)=>t.id===obj.id)) row.selected[loc.id].push(obj);
        // clear input
        row.controls[loc.id].setValue('');
      });
    }
    this.rows.push(row);
    this.prepareRowsControls();
  }

  prepareRowsControls() {
    // ensure existing rows have controls for new locations
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
  }

  filteredOptions(query: string) {
    // deprecated signature kept for compatibility
    return this.filteredOptionsForCell(query, null, null);
  }

  displayTeacher(t:any) { return t ? t.name : ''; }

  save() {
    // prepare payload structure: array of { day, locations: [{ location_id, teacher_ids: [] }] }
    const payload: any[] = this.rows.map(r => ({ day: r.day, locations: this.dutyLocations.map(loc => ({ location_id: loc.id, teacher_ids: (r.selected[loc.id] || []).map((t:any) => t.id) })) }));
    console.log('Save payload', payload);
    // for now, just log - backend table and API will be created later
    alert('Arayüz kaydedildi (henüz backend yok). Konsolu kontrol edin.');
  }

  getSelectedNames(row:any, locId:any) {
    const arr = row && row.selected && row.selected[locId] ? row.selected[locId] : [];
    return arr.map((t:any) => t.name).join(', ');
  }

  filteredOptionsForCell(query: string, row: any, locId: any) {
    const selectedIds = (row && row.selected && row.selected[locId]) ? row.selected[locId].map((t:any)=>t.id) : [];
    if (!query) return this.allTeachers.filter(t=>!selectedIds.includes(t.id)).slice(0, 8);
    const q = query.toString().toLowerCase();
    return this.allTeachers.filter(t => !selectedIds.includes(t.id) && (t.name || '').toString().toLowerCase().includes(q)).slice(0, 12);
  }

  removeTeacher(row:any, locId:any, teacherId:any) {
    if (!row || !row.selected || !row.selected[locId]) return;
    row.selected[locId] = row.selected[locId].filter((t:any)=>t.id !== teacherId);
  }

  removeRow(index:number) {
    this.rows.splice(index,1);
  }
}
