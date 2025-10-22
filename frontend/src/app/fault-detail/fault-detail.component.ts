import { Component, OnInit, Inject, Optional, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { apiBase } from '../runtime-config';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { SnackbarService } from '../services/snackbar.service';

@Component({
  selector: 'app-fault-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatSelectModule, MatDialogModule],
  template: `
    <div class="container">
      <button mat-icon-button (click)="closeDialog()"><mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon></button>
      <mat-card *ngIf="fault">
        <h2>{{fault.id}} - Destek Talebi</h2>
        <p><strong>Durum:</strong> {{fault.status}}</p>
  <p><strong>Oluşturan:</strong> {{fault.Creator?.name || fault.Creator?.username || fault.created_by_user_id}}</p>
  <p *ngIf="fault.requested_by_employee_name"><strong>Talep Eden Personel:</strong> {{fault.requested_by_employee_name}}</p>
        <p><strong>Detay:</strong></p>
        <p>{{fault.issue_details}}</p>
        <div *ngIf="fault.image"><a [href]="'/' + fault.image" target="_blank">Görseli Aç</a></div>
        <div style="margin-top:1rem; display:flex; gap:1rem; align-items:center;">
          <mat-form-field appearance="outline">
            <mat-select [(value)]="newStatus">
              <mat-option value="pending">Bekliyor</mat-option>
              <mat-option value="in_progress">İşlemde</mat-option>
              <mat-option value="closed">Kapandı</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="changeStatus()">Durum Güncelle</button>
        </div>
      </mat-card>
      <div *ngIf="isLoading">Yükleniyor...</div>
    </div>
  `,
  styles: [`.container{padding:1.5rem; max-width:900px; margin:0 auto}`]
})
export class FaultDetailComponent implements OnInit {
  fault: any = null;
  isLoading = false;
  newStatus: string | null = null;

  constructor(
    private http: HttpClient,
    @Optional() private route: ActivatedRoute | null,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: any,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    @Optional() private dialogRef?: MatDialogRef<FaultDetailComponent>,
    private snack?: SnackbarService
  ) {}

  ngOnInit(){ this.load(); }

  private getToken(): string | null { return isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null; }

  async load(){
    // support opening via route param or dialog data { id }
  const idFromRoute = this.route && this.route.snapshot ? Number(this.route.snapshot.paramMap.get('id')) : null;
  const id = this.data && this.data.id ? Number(this.data.id) : idFromRoute;
    if (!id) return;
    this.isLoading = true;
    const token = this.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    try {
      const res: any = await this.http.get(`${apiBase}/api/faults/${id}`, { headers } as any).toPromise();
      // Avoid ExpressionChangedAfterItHasBeenCheckedError in dialog by assigning in next macrotask
      setTimeout(() => {
        try {
          this.fault = res.fault;
          // map legacy 'open' to 'pending' for UI consistency
          this.newStatus = (this.fault?.status === 'open') ? 'pending' : (this.fault?.status || null);
          this.isLoading = false;
          this.cdr.detectChanges();
        } catch (err) { console.error('apply fault data', err); }
      }, 0);
    } catch (e) { console.error('load fault detail', e); this.isLoading = false; try { this.cdr.detectChanges(); } catch(err){} }
  }

  async changeStatus(){
    if (!this.fault || !this.newStatus) return;
    const token = this.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    try {
      const res: any = await this.http.patch(`${apiBase}/api/faults/${this.fault.id}/status`, { status: this.newStatus }, { headers } as any).toPromise();
  this.fault = res.fault;
  try { this.snack?.success('Durum güncellendi'); } catch(e) {}
      // if opened as dialog, notify parent
  try { if (this.dialogRef) this.dialogRef.close('updated'); } catch(e) {}
  try { this.cdr.detectChanges(); } catch(e) {}
    } catch (e) { console.error('update status', e); alert('Güncelleme başarısız'); }
  }

  goBack(){ this.router.navigate(['/faults']); }

  // when inside a dialog, close it instead of navigating
  closeDialog(){ try { if (this.dialogRef) this.dialogRef.close(); } catch(e) { this.goBack(); } }
}
