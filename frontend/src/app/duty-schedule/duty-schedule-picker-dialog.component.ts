import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { apiBase } from '../runtime-config';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-duty-schedule-picker-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatSnackBarModule, MatIconModule],
  template: `
    <div style="padding:16px; max-width:520px; box-sizing:border-box">
      <h2 style="margin:0 0 12px 0">Plan Seç / Yeni Oluştur</h2>

      <div style="margin-bottom:12px">
        <mat-form-field style="width:100%">
          <mat-label>Mevcut Planlar</mat-label>
          <mat-select [(ngModel)]="selectedId" (selectionChange)="onSelectionChange($event.value)">
            <mat-option [value]="null">-- Yeni Plan Oluştur --</mat-option>
            <mat-option *ngFor="let s of schedules" [value]="s.id">{{s.name}} — {{ s.effective_from ? (s.effective_from | date:'yyyy-MM-dd') : '-' }} — {{ s.shift === 'morning' ? 'Sabahçı' : 'Öğlenci' }} — {{ s.is_active ? 'Aktif' : 'Pasif' }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div style="border-top:1px solid #eee; padding-top:12px; margin-top:8px">
        <h3 style="margin-top:0">Plan Bilgileri</h3>
        <div style="display:flex; gap:12px; flex-wrap:wrap">
          <mat-form-field style="flex:1; min-width:160px">
            <mat-label>Plan Adı</mat-label>
            <input matInput [(ngModel)]="newName" />
          </mat-form-field>

          <mat-form-field style="width:160px">
            <mat-label>Vardiya</mat-label>
            <mat-select [(ngModel)]="newShift">
              <mat-option value="morning">Sabah</mat-option>
              <mat-option value="afternoon">Öğleden Sonra</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field style="width:160px">
            <mat-label>Başlangıç</mat-label>
            <input matInput type="date" [(ngModel)]="newEffective" />
          </mat-form-field>

          <div style="display:flex; align-items:center; gap:8px; padding-left:6px">
            <label style="display:flex; align-items:center; gap:6px"><input type="checkbox" [(ngModel)]="newActive" /> Aktif</label>
          </div>
        </div>

        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px">
          <button mat-stroked-button
                  (click)="createNew()"
                  *ngIf="selectedId == null"
                  [disabled]="!newName || !newShift || !newEffective">
            <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
            Oluştur ve Seç
          </button>
          <button mat-stroked-button color="primary"
                  (click)="updateExisting()"
                  *ngIf="selectedId != null"
                  [disabled]="!newName || !newShift || !newEffective">
            <mat-icon fontSet="material-symbols-outlined">save</mat-icon>
            Güncelle
          </button>
        </div>
      </div>

      <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:14px; align-items:center">
        <button *ngIf="selectedId" mat-button color="warn" (click)="deleteSelected()">
          <mat-icon fontSet="material-symbols-outlined">delete</mat-icon>
          Sil
        </button>
        <button mat-button (click)="close()">
          <mat-icon fontSet="material-symbols-outlined">close</mat-icon>
          İptal
        </button>
        <button mat-raised-button color="primary" (click)="apply()">
          <mat-icon fontSet="material-symbols-outlined">check</mat-icon>
          Seç
        </button>
      </div>
    </div>
  `
})
export class DutySchedulePickerDialogComponent implements OnInit {
  selectedId: any = null;
  newName = '';
  newShift: 'morning' | 'afternoon' = 'morning';
  newEffective = new Date().toISOString().slice(0,10);
  newActive = true;
  schedules: any[] = [];
  constructor(public dialogRef: MatDialogRef<DutySchedulePickerDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private http: HttpClient, private auth: AuthService, private snack: MatSnackBar, private cdr: ChangeDetectorRef) {
    this.selectedId = data && data.currentId ? data.currentId : null;
  }
  ngOnInit(): void {
    this.fetchSchedules();
  }
  close() { this.dialogRef.close(); }
  apply() { this.dialogRef.close({ id: this.selectedId }); }

  fetchSchedules() {
    const schoolId = this.data && this.data.schoolId ? this.data.schoolId : null;
    if (!schoolId) return;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    this.http.get<any[]>(`${apiBase}/api/duty-schedule/list/${schoolId}`, headers ? { headers } : undefined).subscribe({ next: (res:any[]) => {
      this.schedules = (res || []).slice();
      this.schedules.sort((a:any,b:any) => {
        const activeDiff = (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
        if (activeDiff !== 0) return activeDiff;
        const ta = a.effective_from ? Date.parse(a.effective_from) : 0;
        const tb = b.effective_from ? Date.parse(b.effective_from) : 0;
        return tb - ta;
      });
      // if a schedule was pre-selected (e.g. dialog opened with currentId), load it now
      if (this.selectedId) {
        // ensure the selection model is set and load details
        // small timeout to allow the template/mat-select to initialize, then load
        setTimeout(() => { this.loadSchedule(this.selectedId); }, 0);
      }
    }, error: err => { console.error(err); } });
  }

  loadSchedule(id: any) {
    if (!id) return;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    this.http.get<any>(`${apiBase}/api/duty-schedule/id/${id}`, headers ? { headers } : undefined).subscribe({ next: (sch:any) => {
      if (!sch) return;
      this.selectedId = sch.id;
      this.newName = sch.name || '';
      this.newShift = sch.shift || 'morning';
      this.newEffective = sch.effective_from ? sch.effective_from.slice(0,10) : new Date().toISOString().slice(0,10);
      this.newActive = !!sch.is_active;
      // run change detection so bound inputs update immediately without user focus
      try { this.cdr.detectChanges(); } catch (e) { /* ignore */ }
    }, error: err => { console.error(err); this.snack.open('Plan yüklenemedi', 'Kapat', { duration: 3000 }); } });
  }

  createNew() {
    const schoolId = this.data && this.data.schoolId ? this.data.schoolId : null;
    if (!schoolId) { this.snack.open('Okul bilgisi yok', 'Kapat', { duration: 3000 }); return; }
    if (!this.newName || !this.newShift || !this.newEffective) { this.snack.open('Lütfen tüm alanları doldurun', 'Kapat', { duration: 3000 }); return; }
    const payload = { school_id: schoolId, name: this.newName, shift: this.newShift, effective_from: this.newEffective, is_active: this.newActive, assignments: [] };
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    this.http.post(`${apiBase}/api/duty-schedule`, payload, headers ? { headers } : undefined).subscribe({ next: (res:any) => {
      this.snack.open('Plan oluşturuldu', 'Kapat', { duration: 3000 });
      this.dialogRef.close({ id: res.id });
    }, error: err => { console.error(err); this.snack.open('Plan oluşturulamadı', 'Kapat', { duration: 4000 }); } });
  }

  onSelectionChange(val: any) {
    // if user selected 'new plan' (null), reset form fields
    if (val == null) {
      this.selectedId = null;
      this.newName = '';
      this.newShift = 'morning';
      this.newEffective = new Date().toISOString().slice(0,10);
      this.newActive = true;
      try { this.cdr.detectChanges(); } catch (e) { }
      return;
    }
    // otherwise load the selected schedule
    this.loadSchedule(val);
  }

  updateExisting() {
    if (!this.selectedId) { this.snack.open('Önce bir plan seçin', 'Kapat', { duration: 3000 }); return; }
    const payload = { name: this.newName, shift: this.newShift, effective_from: this.newEffective, is_active: this.newActive };
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    this.http.put(`${apiBase}/api/duty-schedule/${this.selectedId}`, payload, headers ? { headers } : undefined).subscribe({ next: (res:any) => {
      this.snack.open('Plan güncellendi', 'Kapat', { duration: 3000 });
      this.dialogRef.close({ id: this.selectedId });
    }, error: err => { console.error(err); this.snack.open('Güncelleme başarısız', 'Kapat', { duration: 4000 }); } });
  }

  deleteSelected() {
    if (!this.selectedId) return;
    const confirmed = confirm('Seçili plan ve atamaları silinsin mi? Bu işlem geri alınamaz.');
    if (!confirmed) return;
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    // First clear assignments by replacing with empty array
    this.http.put(`${apiBase}/api/duty-schedule/${this.selectedId}/assignments`, { assignments: [] }, headers ? { headers } : undefined).subscribe({ next: () => {
      // Then delete the duty_schedule record
      this.http.delete(`${apiBase}/api/duty-schedule/${this.selectedId}`, headers ? { headers } : undefined).subscribe({ next: () => {
        this.snack.open('Plan ve atamaları silindi', 'Kapat', { duration: 3000 });
        // Inform parent to clear selection and refresh
        this.dialogRef.close({ id: null });
      }, error: err => { console.error(err); this.snack.open('Plan silinemedi', 'Kapat', { duration: 4000 }); } });
    }, error: err => { console.error(err); this.snack.open('Atamalar silinemedi', 'Kapat', { duration: 4000 }); } });
  }
}
