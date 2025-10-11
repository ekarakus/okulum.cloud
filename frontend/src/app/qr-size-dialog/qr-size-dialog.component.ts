import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-qr-size-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Kaç adet yan yana yazdırılsın?</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%">
        <input matInput type="number" min="1" max="20" step="1" [(ngModel)]="value" />
      </mat-form-field>
      <div style="margin-top:12px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:80px;height:80px;border:1px solid #ddd;display:flex;align-items:center;justify-content:center">
            <div [style.fontSize.px]="valuePreviewPx">QR</div>
          </div>
          <div style="color:#666">Örnek kare önizleme (yaklaşık)</div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">İptal</button>
      <button mat-flat-button color="primary" (click)="ok()">Tamam</button>
    </mat-dialog-actions>
  `
})
export class QrSizeDialogComponent {
  value = 6; // default columns
  constructor(private dialogRef: MatDialogRef<QrSizeDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any){
    if (data && data.default) this.value = data.default;
  }
  get valuePreviewPx(){
    // preview size: approximate px for a small square indicator
    const cols = Math.max(1, Math.min(20, Math.round(this.value || 1)));
    // show a relative px size for 210mm / cols scaled down
    const mm = Math.max(5, Math.round((210 / cols) * 0.3));
    return Math.max(8, Math.round(mm * 3.78));
  }
  ok(){ this.dialogRef.close(this.value); }
  cancel(){ this.dialogRef.close(null); }
}
