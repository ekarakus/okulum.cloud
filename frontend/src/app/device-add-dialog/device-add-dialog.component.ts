import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FeatureService, Feature } from '../services/feature.service';
import { MatIconModule } from '@angular/material/icon';
import { FilterDeviceTypePipe } from '../pipes/filter-device-type.pipe';
import { FilterLocationPipe } from '../pipes/filter-location.pipe';
import { FilterFeaturePipe } from '../pipes/filter-feature.pipe';

@Component({
  selector: 'app-device-add-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule
    , FilterDeviceTypePipe, FilterLocationPipe, FilterFeaturePipe
  ],
  template: `
  <h2 mat-dialog-title>{{ isEdit ? 'Demirbaş Düzenle' : 'Yeni Demirbaş Ekle' }}</h2>
    <mat-dialog-content>
  <form [formGroup]="form" (ngSubmit)="onSubmit()" (keydown.enter)="onFormEnter($event)">
        <!-- Kimlik No sadece düzenleme modunda görünür -->
        <mat-form-field appearance="outline" style="width:100%; margin-bottom: 1rem;" *ngIf="isEdit">
          <mat-label>Kimlik No</mat-label>
          <input matInput formControlName="identity_no" required />
          <mat-hint>Benzersiz olmalıdır</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%; margin-bottom: 1rem;">
          <mat-label>Ad</mat-label>
          <input matInput formControlName="name" required />
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%; margin-bottom: 1rem;">
          <mat-label>Seri No</mat-label>
          <input matInput formControlName="serial_no" />
        </mat-form-field>


        <mat-form-field appearance="outline" style="width:100%; margin-bottom: 1rem;">
          <mat-label>Kullanıcı</mat-label>
          <input matInput formControlName="user" />
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%; margin-bottom: 1rem;">
          <mat-label>Durum</mat-label>
          <mat-select formControlName="status">
            <mat-option value="active">Aktif</mat-option>
            <mat-option value="inactive">Pasif</mat-option>
            <mat-option value="maintenance">Bakımda</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%; margin-bottom: 1rem;">
          <mat-label>Demirbaş Tipi</mat-label>
          <mat-select formControlName="device_type_id" (opened)="onSelectOpened('deviceType')">
            <mat-option disabled>
              <input matInput data-search="deviceType" placeholder="Ara demirbaş tipi..." [(ngModel)]="deviceTypeFilter" [ngModelOptions]="{standalone: true}" style="width:100%;" (click)="$event.stopPropagation()" />
            </mat-option>
            <mat-option *ngFor="let dt of deviceTypes | filterDeviceType:deviceTypeFilter" [value]="dt.id">{{dt.name}}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:100%; margin-bottom: 1rem;">
          <mat-label>Lokasyon</mat-label>
          <mat-select formControlName="location_id" (opened)="onSelectOpened('location')">
            <mat-option disabled>
              <input matInput data-search="location" placeholder="Ara lokasyon..." [(ngModel)]="locationFilter" [ngModelOptions]="{standalone: true}" style="width:100%;" (click)="$event.stopPropagation()" />
            </mat-option>
            <mat-option *ngFor="let l of locationsList | filterLocation:locationFilter" [value]="l.id">{{l.name}} (Oda: {{l.room_number}})</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Özellik + Değer Ekleme Alanı -->
        <mat-form-field appearance="outline" style="width:100%; margin-bottom: 1rem;">
          <mat-label>Açıklama (Not)</mat-label>
          <textarea matInput formControlName="remark" rows="3"></textarea>
        </mat-form-field>

        <div style="display: flex; gap: 0.5rem; align-items: flex-start; margin-bottom: 0.5rem;">
          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>Özellik</mat-label>
            <mat-select [(ngModel)]="selectedFeatureId" [ngModelOptions]="{standalone: true}" (opened)="onSelectOpened('feature')">
                <mat-option disabled>
                  <input matInput data-search="feature" placeholder="Ara özellik..." [(ngModel)]="featureFilter" [ngModelOptions]="{standalone: true}" style="width:100%;" (click)="$event.stopPropagation()" />
                </mat-option>
                <mat-option *ngFor="let feature of (features | filterFeature:featureFilter)" [value]="feature.id">
                {{feature.name}}
                <span *ngIf="feature.description" style="color: #666; font-size: 0.8em;"> - {{feature.description}}</span>
              </mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>Değer</mat-label>
            <input matInput [(ngModel)]="featureValue" [ngModelOptions]="{standalone: true}" name="featureValue" required />
          </mat-form-field>
          <button mat-raised-button color="primary" type="button" (click)="addFeaturePair()" [disabled]="!selectedFeatureId || !featureValue.trim()">
            Ekle
          </button>
        </div>

        <!-- Eklenen Özellikler Listesi -->
        <div *ngIf="featurePairsArray.controls.length > 0" style="margin-top: 0.5rem;">
          <h4 style="margin: 0 0 0.5rem 0; color:#444;">Özellikler</h4>
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li *ngFor="let fg of featurePairsArray.controls; let i = index" [formGroup]="$any(fg)" style="display:flex; align-items:center; gap:0.5rem; margin-bottom: 0.25rem;">
              <span style="flex:1;">
                {{ getFeatureName(fg.value.feature_id) }}: <strong>{{ fg.value.value }}</strong>
              </span>
              <button mat-icon-button color="primary" type="button" (click)="editFeaturePair(i)">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button mat-icon-button color="warn" type="button" (click)="removeFeaturePair(i)">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </li>
          </ul>
        </div>
        <div style="display:none"><button type="submit"></button></div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>İptal</button>
      <button mat-raised-button color="primary" type="submit" (click)="onSubmit()" [disabled]="!form.valid">
        {{ isEdit ? 'Güncelle' : 'Ekle' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 400px;
    }
    mat-form-field {
      width: 100%;
    }
  `]
})
export class DeviceAddDialogComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  features: Feature[] = [];
  selectedFeatureId: number | null = null;
  featureValue: string = '';
  // Local copies and filters for searchable selects
  deviceTypes: any[] = [];
  locationsList: any[] = [];
  deviceTypeFilter: string = '';
  locationFilter: string = '';
  featureFilter: string = '';

  constructor(
    private fb: FormBuilder,
    private featureService: FeatureService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<DeviceAddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { locations: any[], deviceTypes: any[], device?: any, isEdit?: boolean }
  ) {
    this.isEdit = data.isEdit || false;

    // copy lists locally so we can filter them
    this.deviceTypes = data.deviceTypes || [];
    this.locationsList = data.locations || [];

    // Ekleme modunda identity_no alanını dahil etme
    if (this.isEdit) {
      this.form = this.fb.group({
        identity_no: [data.device?.identity_no || ''],
        name: [data.device?.name || '', Validators.required],
        serial_no: [data.device?.serial_no || ''],
        remark: [data.device?.remark || ''],
        user: [data.device?.user || ''],
        status: [data.device?.status || 'active', Validators.required],
        device_type_id: [data.device?.device_type_id || '', Validators.required],
        location_id: [data.device?.location_id || '', Validators.required],
        featurePairs: this.fb.array([])
      });
    } else {
      this.form = this.fb.group({
        name: ['', Validators.required],
        serial_no: [''],
        remark: [''],
        user: [''],
        status: ['active', Validators.required],
        device_type_id: ['', Validators.required],
        location_id: ['', Validators.required],
        featurePairs: this.fb.array([])
      });
    }
  }

  ngOnInit(): void {
    // Change detection cycle'ından sonra features'ı yükle
    setTimeout(() => {
      this.loadFeatures();
    }, 0);
  }

  onFormEnter(event: Event) {
    try { const target = event.target as HTMLElement; if (target && target.tagName === 'TEXTAREA') return; } catch (e) {}
    event.preventDefault(); this.onSubmit();
  }

  onSelectOpened(kind: 'deviceType' | 'location' | 'feature') {
    // small timeout to let the panel render
    setTimeout(() => {
      try {
        const selector = `input[data-search=\"${kind}\"]`;
        const el = document.querySelector(selector) as HTMLInputElement | null;
        if (el) {
          el.focus();
          // place cursor at end
          const val = el.value || '';
          el.setSelectionRange(val.length, val.length);
        }
      } catch (e) {
        // no-op
      }
    }, 50);
  }

  loadFeatures(): void {
    this.featureService.getFeatures().subscribe({
      next: (features) => {
        // Ensure features are ordered by sort_order asc, fallback to name
        this.features = (features || []).slice().sort((a: any, b: any) => {
          const na = (a.sort_order ?? 0);
          const nb = (b.sort_order ?? 0);
          if (na !== nb) return na - nb;
          return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true });
        });
        // Edit modunda mevcut özellikleri doldur
        if (this.isEdit && this.data.device?.Features?.length) {
          const pairs = this.data.device.Features
            .map((f: any) => ({ feature_id: f.id, value: f.DeviceFeature?.value || '' }))
            .filter((p: any) => p.value !== '');
          pairs.forEach((p: any) => this.featurePairsArray.push(this.createFeaturePairGroup(p.feature_id, p.value)));
        }
        this.cdr.detectChanges(); // Change detection'u manuel tetikle
      },
      error: (error) => {
        console.error('Error loading features:', error);
      }
    });
  }

  getFeatureName(id: number): string {
    const f = this.features.find(f => f.id === id);
  return f ? `${f.sort_order ? f.sort_order + '. ' : ''}${f.name}` : `#${id}`;
  }

  get featurePairsArray(): FormArray {
    return this.form.get('featurePairs') as FormArray;
  }

  createFeaturePairGroup(feature_id: number, value: string): FormGroup {
    return this.fb.group({
      feature_id: [feature_id, Validators.required],
      value: [value, [Validators.required]]
    });
  }

  addFeaturePair() {
    if (!this.selectedFeatureId || !this.featureValue) return;

    // Aynı özelliği tekrar eklemeyi engelle
    const exists = this.featurePairsArray.value.some((p: any) => p.feature_id === this.selectedFeatureId);
    if (exists) {
      // Güncelleme davranışı: mevcut girdinin değerini değiştir
      const idx = this.featurePairsArray.value.findIndex((p: any) => p.feature_id === this.selectedFeatureId);
      (this.featurePairsArray.at(idx) as FormGroup).patchValue({ value: this.featureValue });
    } else {
      this.featurePairsArray.push(this.createFeaturePairGroup(this.selectedFeatureId, this.featureValue));
    }

    // Sıfırla
    this.selectedFeatureId = null;
    this.featureValue = '';
  }

  editFeaturePair(index: number) {
    const fg = this.featurePairsArray.at(index) as FormGroup;
    this.selectedFeatureId = fg.value.feature_id;
    this.featureValue = fg.value.value;
    // İsteğe bağlı: mevcut girdiyi listeden sil ve kullanıcı tekrar eklesin
    this.featurePairsArray.removeAt(index);
  }

  removeFeaturePair(index: number) {
    this.featurePairsArray.removeAt(index);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const selectedFeatures = this.featurePairsArray.value.map((p: any) => ({ feature_id: p.feature_id, value: p.value }));
    const payload = {
      ...raw,
      selectedFeatures
    };
    delete (payload as any).featurePairs;
    this.dialogRef.close(payload);
  }
}
