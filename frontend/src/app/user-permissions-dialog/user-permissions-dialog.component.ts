import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PermissionService } from '../permission.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-permissions-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatListModule, MatCheckboxModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Yetkiler - {{ data.userName }} @ {{ data.schoolName }}</h2>
    <mat-dialog-content>
      <div *ngIf="loading">Yükleniyor...</div>
      <div *ngIf="!loading">
        <div class="perm-list">
          <div *ngFor="let p of allPermissions" class="perm-row">
            <mat-checkbox [checked]="assignedIds.indexOf(p.id) !== -1" (change)="onToggle(p.id, $event.checked)">
              {{ p.name }}
            </mat-checkbox>
            <div style="font-size:0.85rem;color:#666;margin-left:28px">{{ p.description }}</div>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">İptal</button>
      <button mat-raised-button color="primary" (click)="onSave()">Kaydet</button>
    </mat-dialog-actions>
  `,
  styles: [
`
    .perm-list { display:flex; flex-direction:column; gap:0.5rem; max-height:50vh; overflow:auto; }
    .perm-row { display:flex; flex-direction:column; }
`
  ]
})
export class UserPermissionsDialogComponent implements OnInit {
  assignedIds: number[] = [];
  allPermissions: any[] = [];
  loading = true;

  constructor(
    public dialogRef: MatDialogRef<UserPermissionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userSchoolsId: number, userName: string, schoolName: string },
    private permissionService: PermissionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.permissionService.getAssignedForUserSchool(this.data.userSchoolsId).subscribe({
      next: (res: any) => {
        console.log('UserPermissionsDialog loaded response:', res);
        this.assignedIds = res.assigned || [];
        this.allPermissions = res.all || [];
        this.loading = false;
        // Ensure view updates (fixes intermittent rendering where data appears only during dialog close)
        try { this.cdr.detectChanges(); } catch (e) { /* ignore */ }
      },
      error: (err) => {
        console.error('Error loading permissions', err);
        this.loading = false;
      }
    });
  }

  onToggle(id: number, checked: boolean) {
    if (checked) {
      if (this.assignedIds.indexOf(id) === -1) this.assignedIds.push(id);
    } else {
      this.assignedIds = this.assignedIds.filter(x => x !== id);
    }
  }

  onCancel() { this.dialogRef.close(null); }

  onSave() {
    this.permissionService.replaceAssignedForUserSchool(this.data.userSchoolsId, this.assignedIds).subscribe({
      next: () => this.dialogRef.close({ saved: true }),
      error: (err) => { console.error('Error saving', err); this.dialogRef.close({ saved: false }); }
    });
  }
}
