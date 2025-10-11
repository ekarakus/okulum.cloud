import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { EmployeeTypeService } from '../services/employee-type.service';

@Component({
  selector: 'app-employee-type-list',
  standalone: true,
  imports: [CommonModule, MatListModule, MatButtonModule, MatIconModule],
  template: `
    <h3>Personel Tipleri</h3>
    <div *ngFor="let t of types" class="type-row">
      <span>{{ t.name }}</span>
      <button mat-icon-button (click)="edit(t)"><mat-icon>edit</mat-icon></button>
      <button mat-icon-button color="warn" (click)="remove(t)"><mat-icon>delete</mat-icon></button>
    </div>
    <button mat-raised-button color="primary" (click)="add()">Yeni Tip Ekle</button>
  `
})
export class EmployeeTypeListComponent implements OnInit {
  types: any[] = [];
  constructor(private svc: EmployeeTypeService, private dialog: MatDialog) {}
  ngOnInit(): void { this.load(); }
  load() { this.svc.list().subscribe({ next: (r) => this.types = r || [] }); }
  add() { const name = prompt('Yeni tip adı'); if (!name) return; this.svc.create({ name }).subscribe({ next: () => this.load() }); }
  edit(t: any) { const name = prompt('Tip adı', t.name); if (!name) return; this.svc.update(t.id, { name }).subscribe({ next: () => this.load() }); }
  remove(t: any) { if (!confirm('Silmek istediğinize emin misiniz?')) return; this.svc.remove(t.id).subscribe({ next: () => this.load() }); }
}
