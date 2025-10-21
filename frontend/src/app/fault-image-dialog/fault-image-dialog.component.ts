import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { apiBase } from '../runtime-config';

@Component({
  selector: 'app-fault-image-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div style="max-width:900px; max-height:80vh; display:flex; flex-direction:column; gap:8px;">
      <div style="display:flex; justify-content:flex-end;"><button mat-stroked-button (click)="close()">Kapat</button></div>
      <div style="flex:1; display:flex; align-items:center; justify-content:center;">
        <img [src]="imgUrl" style="max-width:100%; max-height:70vh; border-radius:6px; border:1px solid #eee;" />
      </div>
    </div>
  `
})
export class FaultImageDialogComponent {
  imgUrl: string;
  constructor(public dialogRef: MatDialogRef<FaultImageDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    const p = data && data.path ? data.path : '';
    this.imgUrl = p && String(p).startsWith('http') ? p : `${apiBase}/${p}`;
  }
  close() { this.dialogRef.close(); }
}
