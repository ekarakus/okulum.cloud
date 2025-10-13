import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { apiBase } from '../runtime-config';

export interface SchoolDialogData {
  school?: {
    id?: number;
    name: string;
    code: string;
    province_id?: number | null;
    district_id?: number | null;
    school_type?: string | null;
    is_double_shift?: boolean | null;
      start_time?: string | null;
      lunch_start_time?: string | null;
    lesson_duration_minutes?: number | null;
    break_duration_minutes?: number | null;
    logo_path?: string | null;
  };
  mode: 'add' | 'edit';
}

@Component({
  selector: 'app-school-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon fontSet="material-symbols-outlined">{{ data.mode === 'add' ? 'add_business' : 'edit_square' }}</mat-icon>
          {{ data.mode === 'add' ? 'Yeni Okul Ekle' : 'Okul Düzenle' }}
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon fontSet="material-symbols-outlined">close</mat-icon>
        </button>
      </div>

      <div mat-dialog-content class="dialog-content">
  <form [formGroup]="schoolForm" class="school-form" (ngSubmit)="onSave()" (keydown.enter)="onFormEnter($event)">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Okul Adı</mat-label>
            <mat-icon matPrefix fontSet="material-symbols-outlined">school</mat-icon>
            <input matInput
                   formControlName="name"
                   placeholder="Örn: Atatürk İlkokulu"
                   maxlength="100">
            <mat-error *ngIf="schoolForm.get('name')?.hasError('required')">
              Okul adı zorunludur
            </mat-error>
            <mat-error *ngIf="schoolForm.get('name')?.hasError('minlength')">
              Okul adı en az 3 karakter olmalıdır
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Okul Kodu</mat-label>
            <mat-icon matPrefix fontSet="material-symbols-outlined">tag</mat-icon>
            <input matInput
                   formControlName="code"
                   placeholder="Örn: ATK001"
                   maxlength="20"
                   style="text-transform: uppercase;">
            <mat-hint>Okul için benzersiz kod (büyük harflerle)</mat-hint>
            <mat-error *ngIf="schoolForm.get('code')?.hasError('required')">
              Okul kodu zorunludur
            </mat-error>
            <mat-error *ngIf="schoolForm.get('code')?.hasError('minlength')">
              Okul kodu en az 3 karakter olmalıdır
            </mat-error>
            <mat-error *ngIf="schoolForm.get('code')?.hasError('pattern')">
              Okul kodu sadece harf ve rakam içerebilir
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>İl</mat-label>
            <mat-select formControlName="province_id" (selectionChange)="onProvinceChange($event.value)">
              <mat-option *ngFor="let p of provinces" [value]="p.id">{{ p.name }}</mat-option>
            </mat-select>
            <mat-error *ngIf="schoolForm.get('province_id')?.hasError('required')">İl zorunludur</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>İlçe</mat-label>
            <mat-select formControlName="district_id">
              <mat-option *ngFor="let d of districts" [value]="d.id">{{ d.name }}</mat-option>
            </mat-select>
            <mat-error *ngIf="schoolForm.get('district_id')?.hasError('required')">İlçe zorunludur</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Okul Tipi</mat-label>
            <mat-select formControlName="school_type">
              <mat-option value="ana_okulu">Ana Okulu</mat-option>
              <mat-option value="ilk_okul">İlkokul</mat-option>
              <mat-option value="orta_okul">Ortaokul</mat-option>
              <mat-option value="lise">Lise</mat-option>
            </mat-select>
            <mat-error *ngIf="schoolForm.get('school_type')?.hasError('required')">Okul tipi zorunludur</mat-error>
          </mat-form-field>

          <div class="form-field">
            <label style="display:block;margin-bottom:4px">İkili Eğitim</label>
            <mat-checkbox formControlName="is_double_shift">İkili eğitim mi?</mat-checkbox>
          </div>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Sabah İlk Ders Başlama Saati</mat-label>
            <mat-select formControlName="start_time">
              <mat-option *ngFor="let t of morningTimes" [value]="t">{{ t }}</mat-option>
            </mat-select>
            <mat-error *ngIf="schoolForm.get('start_time')?.hasError('required')">Başlangıç saati zorunludur</mat-error>
          </mat-form-field>




              <div class="lunch-container" [class.visible]="schoolForm.get('is_double_shift')?.value" [class.highlight]="lunchHighlight">
                <mat-form-field appearance="outline" class="form-field lunch-field">
                  <mat-label>Öğlen Ders Başlama Saati</mat-label>
                  <mat-select formControlName="lunch_start_time">
                    <mat-option [value]="null">-- Seçiniz --</mat-option>
                    <mat-option *ngFor="let t of lunchTimes" [value]="t">{{ t }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Ders Süresi (dakika)</mat-label>
            <input matInput type="number" formControlName="lesson_duration_minutes" min="1">
            <mat-error *ngIf="schoolForm.get('lesson_duration_minutes')?.hasError('required')">Ders süresi zorunludur</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Mola Süresi (dakika)</mat-label>
            <input matInput type="number" formControlName="break_duration_minutes" min="0">
            <mat-error *ngIf="schoolForm.get('break_duration_minutes')?.hasError('required')">Mola süresi zorunludur</mat-error>
          </mat-form-field>

          <div class="form-field">
            <label for="logo">Okul Logosu</label>
            <input id="logo" type="file" (change)="onFileSelected($event)" accept="image/*">
            <div *ngIf="uploadedFileName">Yüklendi: {{ uploadedFileName }}</div>
          </div>
          <div style="display:none"><button type="submit"></button></div>
        </form>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button mat-button
                mat-dialog-close
                type="button"
                class="cancel-button">
          <mat-icon fontSet="material-symbols-outlined">cancel</mat-icon>
          İptal
        </button>
  <button mat-raised-button
    color="primary"
    type="submit"
    (click)="onSave()"
    [disabled]="schoolForm.invalid || isLoading"
    class="save-button">
          <mat-icon fontSet="material-symbols-outlined">{{ isLoading ? 'pending' : 'save' }}</mat-icon>
          {{ isLoading ? 'Kaydediliyor...' : (data.mode === 'add' ? 'Ekle' : 'Güncelle') }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 100%;
      max-width: 500px;
      display: flex;
      flex-direction: column;
      /* ensure dialog actions stay at bottom */
      height: 100%;
      max-height: 80vh;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1rem 1.5rem 0 1.5rem;
      margin-bottom: 0;
    }

    .dialog-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.2rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .dialog-content {
      padding: 1rem 1.5rem;
      min-height: 200px;
      /* allow fields inside to overflow visually when they animate (floating labels) */
      overflow: auto;
      flex: 1 1 auto; /* let content grow and scroll if needed */
    }

    .school-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field {
      width: 100%;
    }

    .dialog-actions {
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      border-top: 1px solid #e0e0e0;
      background: #f8f9fa;
      /* push actions to the bottom when container is column flex */
      margin-top: auto;
      flex-shrink: 0;
    }

    .cancel-button {
      color: #666;
    }

    .save-button {
      min-width: 120px;
    }

    .save-button[disabled] {
      opacity: 0.6;
    }

    mat-form-field {
      margin-bottom: 1rem;
    }

    mat-hint {
      font-size: 0.75rem;
      color: #666;
    }

    @media (max-width: 768px) {
      .dialog-container {
        max-width: 95vw;
      }

      .dialog-header,
      .dialog-content,
      .dialog-actions {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .dialog-actions {
        flex-direction: column-reverse;
        gap: 0.5rem;
      }

      .cancel-button,
      .save-button {
        width: 100%;
      }
    }
    .lunch-container {
      max-height: 0;
      /* allow visual overflow when revealed so box-shadow and slide aren't clipped */
      overflow: visible;
      opacity: 0;
      transform: translateY(-6px);
      transition: max-height 280ms ease, opacity 280ms ease, transform 280ms ease;
      will-change: opacity, transform;
      position: relative; /* create stacking context for z-index */
      z-index: 1;
    }
    .lunch-container.visible {
      max-height: 200px; /* big enough to show the select */
      opacity: 1;
      transform: translateY(0);
      /* bring above surrounding elements so the reveal is fully visible */
      z-index: 40;
      /* ensure floating label has room and isn't clipped at the top */
      padding-top: 8px;
    }
    /* raise floating label above surrounding elements when inside the lunch container */
    .lunch-container .mat-mdc-form-field-floating-label,
    .lunch-container .mat-form-field-label,
    .lunch-container .mdc-floating-label {
      z-index: 60;
    }
    /* apply highlight to container so shadow isn't clipped by inner overflow */
    .lunch-container.highlight {
      animation: lunch-pulse 850ms ease;
    }
    @keyframes lunch-pulse {
      0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.0); }
      30% { box-shadow: 0 6px 18px 4px rgba(255, 193, 7, 0.22); }
      100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
    }
  `]
})
export class SchoolDialogComponent implements OnInit {
  schoolForm: FormGroup;
  isLoading = false;
  provinces: Array<any> = [];
  districts: Array<any> = [];
  times: string[] = [];
  morningTimes: string[] = [];
  lunchTimes: string[] = [];
  // lunch field shown only when is_double_shift is true
  lunchHighlight = false;
  uploadedFileName: string | null = null;
  uploadedPath: string | null = null;
  selectedFile: File | null = null;
  readonly ISTANBUL_ID = 34;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SchoolDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SchoolDialogData,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.schoolForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      code: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[A-Z0-9]+$/)]],
      province_id: [null, [Validators.required]],
      district_id: [null, [Validators.required]],
      school_type: ['ilk_okul', [Validators.required]],
      is_double_shift: [false],
    start_time: ['08:00', [Validators.required]],
    lunch_start_time: [null],
      lesson_duration_minutes: [40, [Validators.required]],
      break_duration_minutes: [10, [Validators.required]],
      logo_path: [null]
    });
  }

  ngOnInit(): void {
    if (this.data.mode === 'edit' && this.data.school) {
      this.schoolForm.patchValue({
        name: this.data.school.name,
        code: this.data.school.code,
        province_id: this.data.school.province_id ?? null,
        district_id: this.data.school.district_id ?? null,
        school_type: this.data.school.school_type ?? 'ilk_okul',
        is_double_shift: this.data.school.is_double_shift ?? false,
        start_time: this.data.school.start_time ?? '08:00',
  lunch_start_time: this.data.school.lunch_start_time ?? null,
        lesson_duration_minutes: this.data.school.lesson_duration_minutes ?? 40,
        break_duration_minutes: this.data.school.break_duration_minutes ?? 10,
        logo_path: this.data.school.logo_path ?? null
      });
      if (this.data.school.logo_path) {
        const lp = this.data.school.logo_path as string;
        this.uploadedFileName = lp.split('/').pop() || null;
        this.uploadedPath = lp;
      }
    }

    // Load provinces and times
    this.loadProvinces();
  this.initTimes();

    // Code alanını büyük harfe çevir
    this.schoolForm.get('code')?.valueChanges.subscribe(value => {
      if (value && typeof value === 'string') {
        const upperValue = value.toUpperCase();
        if (value !== upperValue) {
          this.schoolForm.get('code')?.setValue(upperValue, { emitEvent: false });
        }
      }
    });

    // When is_double_shift changes, clear lunch_start_time when switched off
    this.schoolForm.get('is_double_shift')?.valueChanges.subscribe(isDouble => {
      if (!isDouble) {
        this.schoolForm.get('lunch_start_time')?.setValue(null);
      } else {
        // briefly highlight the lunch field to draw attention
        this.lunchHighlight = true;
        setTimeout(() => this.lunchHighlight = false, 900);
      }
    });
  }

  onSave(): void {
    if (this.schoolForm.valid) {
      const formValue = this.schoolForm.value;

      const result = {
        ...formValue,
        id: this.data.school?.id,
        // If not double-shift, ensure lunch_start_time is null
        lunch_start_time: this.schoolForm.get('is_double_shift')?.value ? formValue.lunch_start_time : null,
        // logo_path will be set after upload if a new file was selected
        logo_path: this.uploadedPath || formValue.logo_path
      };

      // If a file was selected, upload it first, then close with returned path
      if (this.selectedFile) {
        const fd = new FormData();
        fd.append('file', this.selectedFile);
        this.isLoading = true;
        this.http.post<any>(`${apiBase}/api/school-logo`, fd).subscribe(resp => {
          this.isLoading = false;
          if (resp && resp.path) {
            result.logo_path = resp.path;
          }
          this.dialogRef.close(result);
        }, err => {
          this.isLoading = false;
          console.error('Upload failed during save', err);
          alert('Logo yüklenemedi. Lütfen tekrar deneyin.');
        });
      } else {
        this.dialogRef.close(result);
      }
    } else {
      // Form'daki tüm alanları touch yap ki hatalar görünsün
      this.schoolForm.markAllAsTouched();
    }
  }

  private loadProvinces() {
    this.http.get<any[]>(`${apiBase}/api/provinces`).subscribe(list => {
      this.provinces = list || [];
      // Defer mutations to next microtask to avoid ExpressionChangedAfterItHasBeenCheckedError
      Promise.resolve().then(() => {
        // Default Istanbul in add mode
        if (this.data.mode === 'add') {
          const ist = this.provinces.find(p => p.id === this.ISTANBUL_ID);
          if (ist) {
            this.schoolForm.patchValue({ province_id: ist.id });
            this.onProvinceChange(ist.id);
          } else if (this.provinces.length) {
            this.schoolForm.patchValue({ province_id: this.provinces[0].id });
            this.onProvinceChange(this.provinces[0].id);
          }
        } else if (this.data.mode === 'edit') {
          const pid = this.schoolForm.get('province_id')?.value;
          if (pid) this.onProvinceChange(pid);
        }
        // Ensure view updates do not trigger ExpressionChangedAfterItHasBeenCheckedError
        try { this.cdr.detectChanges(); } catch (e) { /* ignore in non-AOT/dev modes */ }
      });
    }, err => {
      console.error('Failed to load provinces', err);
    });
  }

  onProvinceChange(provinceId: number) {
    if (!provinceId) {
      this.districts = [];
      this.schoolForm.patchValue({ district_id: null });
      return;
    }
    this.http.get<any[]>(`${apiBase}/api/provinces/${provinceId}/districts`).subscribe(list => {
      this.districts = list || [];
      // Auto-select first district when province changes if current district is not present
      const currentDistrict = this.schoolForm.get('district_id')?.value;
      const districtIds = this.districts.map(d => d.id);
      if (this.districts.length) {
        if (currentDistrict == null || !districtIds.includes(currentDistrict)) {
          this.schoolForm.patchValue({ district_id: this.districts[0].id });
        }
      } else {
        this.schoolForm.patchValue({ district_id: null });
      }
      // Fix change detection timing after async update - defer to microtask
      Promise.resolve().then(() => {
        try { this.cdr.detectChanges(); } catch (e) { /* ignore */ }
      });
    }, err => {
      console.error('Failed to load districts', err);
      this.districts = [];
      this.schoolForm.patchValue({ district_id: null });
    });
  }

  initTimes() {
    // Default morning times 06:00 - 10:00 every 15 minutes
    this.morningTimes = this.buildTimeRange('06:00', '10:00', 15);
    // Default lunch times 11:00 - 14:00 every 15 minutes
    this.lunchTimes = this.buildTimeRange('11:00', '14:00', 15);
    // times variable kept for compatibility where needed
    this.times = [...this.morningTimes];
  }

  private buildTimeRange(from: string, to: string, stepMinutes: number) {
    const parse = (t: string) => {
      const [hh, mm] = t.split(':').map(x => parseInt(x,10));
      return hh*60 + mm;
    };
    const start = parse(from);
    const end = parse(to);
    const out: string[] = [];
    for (let m = start; m <= end; m += stepMinutes) {
      const hh = Math.floor(m/60).toString().padStart(2,'0');
      const mm = (m%60).toString().padStart(2,'0');
      out.push(`${hh}:${mm}`);
    }
    return out;
  }
  resetMorningDefaults() {
    this.morningTimes = this.buildTimeRange('06:00','10:00',15);
    this.schoolForm.get('start_time')?.setValue(this.morningTimes[0] || null);
  }

  resetLunchDefaults() {
    this.lunchTimes = this.buildTimeRange('11:00','14:00',15);
    this.schoolForm.get('lunch_start_time')?.setValue(this.lunchTimes[0] || null);
  }

  private isValidTime(t: string) {
    return /^([01]?\d|2[0-3]):[0-5]\d$/.test(t);
  }

  removeLunchField() {
    // legacy method removed
  }

  restoreLunchField() {
    // legacy method removed
  }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    // Store selected file but DO NOT upload now. Upload will occur on Save.
    this.selectedFile = file;
    this.uploadedFileName = file.name;
    // clear any previous uploadedPath until save
    this.uploadedPath = null;
  }

  onFormEnter(event: Event) {
    try { const target = event.target as HTMLElement; if (target && target.tagName === 'TEXTAREA') return; } catch (e) {}
    event.preventDefault(); this.onSave();
  }
}
