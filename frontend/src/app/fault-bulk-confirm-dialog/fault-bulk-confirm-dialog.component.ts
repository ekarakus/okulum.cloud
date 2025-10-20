import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

export interface FaultBulkConfirmData {
  ids: number[];
  action: 'delete' | 'update';
  message?: string;
}

@Component({
  selector: 'app-fault-bulk-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatListModule, MatDividerModule],
  template: `
    <h2 style="margin:0; display:flex; align-items:center; gap:0.5rem;"><mat-icon fontSet="material-symbols-outlined">warning</mat-icon>Onay</h2>
    <div style="padding:1rem 0; max-height:320px; overflow:auto;">
      <p *ngIf="data.message">{{data.message}}</p>
      <mat-divider></mat-divider>
      <h3 style="margin-top:0.5rem; margin-bottom:0.5rem; font-size:0.95rem;">Etkilenecek kayıtlar (ID)</h3>
      <mat-list>
        <mat-list-item *ngFor="let id of data.ids">{{id}}</mat-list-item>
      </mat-list>
    </div>
    <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
      <button mat-stroked-button (click)="cancel()">Vazgeç</button>
      <button mat-flat-button color="warn" (click)="confirm()">Onayla</button>
    </div>
  `
})
export class FaultBulkConfirmDialogComponent {
  constructor(private dialogRef: MatDialogRef<FaultBulkConfirmDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: FaultBulkConfirmData) {}

  confirm() { this.dialogRef.close('confirm'); }
  cancel() { this.dialogRef.close('cancel'); }
}
