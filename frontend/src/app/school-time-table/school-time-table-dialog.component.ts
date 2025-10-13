import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { apiBase } from '../runtime-config';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-school-time-table-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>{{ data.isNew ? 'Yeni Dönem Ekle' : 'Dönem Düzenle' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="onSave()" (keydown.enter)="onFormEnter($event)">
        <mat-form-field style="width:100%">
          <mat-label>Dönem Adı</mat-label>
          <input matInput formControlName="period_name" />
          <mat-error *ngIf="form.get('period_name')?.hasError('required')">Zorunlu</mat-error>
        </mat-form-field>

        <mat-form-field style="width:100%">
          <mat-label>Tür</mat-label>
          <mat-select formControlName="period_type">
            <mat-option value="class">Ders</mat-option>
            <mat-option value="break">Teneffüs</mat-option>
            <mat-option value="lunch">Öğle Arası</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field style="width:100%">
          <mat-label>Başlangıç (HH:MM)</mat-label>
          <input matInput formControlName="start_time" placeholder="08:00" />
          <div *ngIf="suggestedStart" style="font-size:12px;color:#666;margin-top:6px">Önerilen başlangıç: <strong>{{ suggestedStart }}</strong> <button mat-button color="primary" (click)="applySuggested()" style="height:24px;line-height:20px;padding:0 8px;margin-left:8px">Uygula</button></div>
        </mat-form-field>

        <mat-form-field style="width:100%">
          <mat-label>Süre (dakika)</mat-label>
          <input matInput type="number" formControlName="duration_minutes" />
        </mat-form-field>

        <mat-checkbox formControlName="is_block">Block Ders</mat-checkbox>

        <mat-form-field style="width:100%">
          <mat-label>Gün</mat-label>
          <mat-select formControlName="day_of_week" [multiple]="data.isNew">
            <mat-option *ngFor="let d of days" [value]="d.v">{{ d.name }}</mat-option>
          </mat-select>
        </mat-form-field>

        <div style="display:none"><button type="submit"></button></div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">İptal</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="form.invalid">{{ data.isNew ? 'Ekle' : 'Güncelle' }}</button>
    </mat-dialog-actions>
  `
})
export class SchoolTimeTableDialogComponent implements OnInit {
  form: FormGroup;
  suggestedStart: string | null = null;
  private userEditedStart = false;
  days = [
    { v: 1, name: 'Pazartesi' },
    { v: 2, name: 'Salı' },
    { v: 3, name: 'Çarşamba' },
    { v: 4, name: 'Perşembe' },
    { v: 5, name: 'Cuma' },
    { v: 6, name: 'Cumartesi' },
    { v: 7, name: 'Pazar' }
  ];
  constructor(
    public dialogRef: MatDialogRef<SchoolTimeTableDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
    , private http: HttpClient
    , private auth: AuthService
  ) {
  const school = this.auth.getSelectedSchool();
  const defaultLesson = data.entry?.duration_minutes ?? ((school as any)?.lesson_duration_minutes ?? 40);
    this.form = this.fb.group({
  period_name: [data.entry?.period_name || '', Validators.required],
  period_type: [data.entry?.period_type || 'class', Validators.required],
  start_time: [data.entry?.start_time ? this.formatTime(data.entry.start_time) : '08:00', Validators.required],
      duration_minutes: [defaultLesson, [Validators.required]],
      is_block: [data.entry?.is_block || false],
      block_id: [data.entry?.block_id || null],
      day_of_week: [data.isNew ? (data.entry?.day_of_week ? [data.entry.day_of_week] : []) : (data.entry?.day_of_week || 1), Validators.required]
    });

    // react to selected school change so duration default updates if needed
    this.auth.selectedSchool$.subscribe(s => {
      if (!data.entry) {
        const val = (s as any)?.lesson_duration_minutes ?? 40;
        this.form.get('duration_minutes')?.setValue(val);
      }
    });

    // track if user edits the start_time manually
    this.form.get('start_time')?.valueChanges.subscribe(() => {
      this.userEditedStart = true;
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // only suggest for new entries
    if (!this.data.isNew) return;
    const control = this.form.get('day_of_week');
    if (!control) return;
    // compute suggestion when days change
    control.valueChanges.subscribe((val: any) => {
      this.computeSuggestedStart(val);
    });
    // initial suggestion if days prefilled
    const initial = control.value;
    if (initial && initial.length) this.computeSuggestedStart(initial);
  }

  applySuggested() {
    if (this.suggestedStart) this.form.get('start_time')?.setValue(this.suggestedStart);
  }

  private computeSuggestedStart(value: any) {
    // value can be number or array
    const days = Array.isArray(value) ? value.map((v:any)=>parseInt(v,10)) : [parseInt(value,10)];
    if (!days || days.length === 0) { this.suggestedStart = null; return; }
    // fetch all entries and compute max end_time among selected days
    this.http.get<any[]>(`${apiBase}/api/school-time-table`).subscribe(list => {
      let maxTime = null;
      for (const d of days) {
        const items = list.filter(x => parseInt(x.day_of_week,10) === d && x.end_time);
        for (const it of items) {
          const t = it.end_time || it.start_time;
          if (!maxTime || this.timeCompare(t, maxTime) > 0) maxTime = t;
        }
      }
  if (!maxTime) { this.suggestedStart = null; return; }
  // recommend exact last end_time (HH:MM)
  this.suggestedStart = this.formatTime(maxTime);
      // auto-fill start_time if user did not edit the field
      if (!this.userEditedStart) {
        this.form.get('start_time')?.setValue(this.suggestedStart);
      }
    }, err => { console.error('Failed to compute suggestion', err); this.suggestedStart = null; });
  }

  private timeCompare(a: string, b: string) {
    // compare HH:MM:SS lexicographically
    if (a === b) return 0;
    return a > b ? 1 : -1;
  }

  private formatTime(t?: string) {
    if (!t) return '';
    const parts = (t || '').toString().trim().split(':');
    if (parts.length >= 2) {
      const hh = parts[0].padStart(2, '0');
      const mm = parts[1].padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return t;
  }

  private addMinutesToTime(timeStr: string, minutes: number) {
    const parts = (timeStr || '00:00:00').split(':').map((p:any)=>parseInt(p,10)||0);
    let [h,m,s] = parts;
    m += minutes;
    while (m >= 60) { h += 1; m -= 60; }
    h = h % 24;
    const pad = (n:number) => n.toString().padStart(2,'0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  onCancel() { this.dialogRef.close(); }

  onSave() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onFormEnter(event: Event) {
    try { const target = event.target as HTMLElement; if (target && target.tagName === 'TEXTAREA') return; } catch (e) {}
    event.preventDefault(); this.onSave();
  }
}
