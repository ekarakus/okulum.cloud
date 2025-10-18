import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InfoNuggetService } from '../services/info-nugget.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { inject as inj } from '@angular/core';

@Component({
  selector: 'app-info-nugget-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatSlideToggleModule],
  template: `
  <div style="padding:16px">
  <h2>{{ isEdit ? 'Bilgi Kartını Düzenle' : 'Yeni Bilgi Kartı' }}</h2>
    <form [formGroup]="form">
      <mat-form-field appearance="fill" style="width:100%">
        <mat-label>Başlık</mat-label>
        <input matInput formControlName="title" placeholder="Başlık (opsiyonel)">
        <mat-hint>Kısa bir başlık yazın (opsiyonel)</mat-hint>
      </mat-form-field>

      <mat-form-field appearance="fill" style="width:100%">
        <mat-label>İçerik</mat-label>
        <textarea matInput formControlName="text_content" rows="4" placeholder="Mesaj veya açıklama"></textarea>
        <mat-hint>Kartta görünecek metni buraya yazın</mat-hint>
      </mat-form-field>

      <mat-form-field appearance="fill" style="width:240px">
        <mat-label>Kategori (zorunlu)</mat-label>
        <mat-select formControlName="category_id">
          <mat-option [value]="null">-- Seçiniz --</mat-option>
          <mat-option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</mat-option>
        </mat-select>
        <mat-hint>Kartın ait olduğu kategoriyi seçin</mat-hint>
        <div *ngIf="form.get('category_id')?.touched && form.get('category_id')?.hasError('required')" style="color:crimson;font-size:12px;margin-top:6px">Kategori seçmelisiniz.</div>
      </mat-form-field>

      <mat-slide-toggle formControlName="is_active">Aktif</mat-slide-toggle>

      <div style="display:flex;gap:8px;margin-top:8px">
        <mat-form-field appearance="fill" style="width:160px">
          <mat-label>Başlangıç Tarihi</mat-label>
          <input matInput type="date" formControlName="start_date">
          <mat-hint>Yayın başlanacak tarihi seçin (opsiyonel)</mat-hint>
        </mat-form-field>
        <mat-form-field appearance="fill" style="width:160px">
          <mat-label>Bitiş Tarihi</mat-label>
          <input matInput type="date" formControlName="expiration_date">
          <mat-hint>Yayın biteceği tarihi seçin (opsiyonel)</mat-hint>
        </mat-form-field>
      </div>

      <!-- publish times (within-day) placed under the date inputs -->
      <div style="display:flex;gap:8px;margin-top:8px">
        <mat-form-field appearance="fill" style="width:160px">
          <mat-label>Gün içi yayın başlama saati</mat-label>
          <input matInput type="time" formControlName="publish_start_time">
          <mat-hint>Saat formatı HH:MM (ör. 08:30)</mat-hint>
        </mat-form-field>
        <mat-form-field appearance="fill" style="width:160px">
          <mat-label>Gün içi yayın bitiş saati</mat-label>
          <input matInput type="time" formControlName="publish_end_time">
          <mat-hint>Saat formatı HH:MM (ör. 17:30)</mat-hint>
        </mat-form-field>
      </div>

      <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end">
        <button mat-button (click)="close()">İptal</button>
        <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">Kaydet</button>
      </div>
    </form>
  </div>
  `
})
export class InfoNuggetFormComponent implements OnInit {
  dialogRef = inject(MatDialogRef);
  data = inject(MAT_DIALOG_DATA);
  fb = inject(FormBuilder);
  svc = inject(InfoNuggetService);

  form = this.fb.group({
    id: [null],
    category_id: [null, Validators.required],
    is_active: [true],
    title: [''],
    text_content: [''],
    display_duration_ms: [10000],
    priority: [1],
    start_date: [null],
    expiration_date: [null],
    // within-day publish times (HH:MM)
    publish_start_time: [null],
    publish_end_time: [null]
  });

  categories: any[] = [];
  isEdit = false;

  ngOnInit(){
    this.loadCategories();
    if (this.data && this.data.nuggetId) {
      this.isEdit = true;
      this.svc.get(this.data.nuggetId).subscribe((r:any) => this.form.patchValue(r));
    }
  }

  loadCategories(){ this.svc.listCategories().subscribe((r:any) => this.categories = r || []); }

  close(){ this.dialogRef.close({ success: false }); }

  save(){
    if (this.form.invalid) return;
  const raw = this.form.value as any;
  const payload: any = { ...raw };
  if (this.isEdit) payload.id = Number(raw.id);
  else delete payload.id;
  const call = this.isEdit ? this.svc.update(payload.id, payload) : this.svc.create(payload);
    call.subscribe(() => this.dialogRef.close({ success: true }), err => { console.error(err); alert('Kaydetme hatası') });
  }
}
