import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
  <div class="container">
    <div class="header">
      <h1><mat-icon fontSet="material-symbols-outlined">school</mat-icon> Öğrenciler</h1>
      <div>
        <button mat-raised-button color="primary" (click)="openAdd()">Yeni Öğrenci</button>
      </div>
    </div>

    <mat-card>
      <table style="width:100%">
        <thead>
          <tr>
            <th>#</th><th>Öğrenci No</th><th>Adı</th><th>Soyadı</th><th>Cinsiyet</th><th>Doğum Tarihi</th><th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of students; let i = index">
            <td>{{i+1}}</td>
            <td>{{s.student_no}}</td>
            <td>{{s.first_name}}</td>
            <td>{{s.last_name}}</td>
            <td>{{s.gender}}</td>
            <td>{{ formatDate(s.birth_date) }}</td>
            <td>
              <button mat-button (click)="edit(s)">Düzenle</button>
              <button mat-button color="warn" (click)="remove(s)">Sil</button>
            </td>
          </tr>
        </tbody>
      </table>
    </mat-card>
  </div>
  `
})
export class StudentListComponent implements OnInit {
  http = inject(HttpClient);
  dialog = inject(MatDialog);
  students: any[] = [];

  ngOnInit() {
    this.load();
  }

  load() {
    this.http.get<any[]>('/api/students').subscribe({ next: r => this.students = r || [], error: e => console.error(e) });
  }

  openAdd() {
    import('../student-add-edit-dialog/student-add-edit-dialog.component').then(m => {
      const ref = this.dialog.open(m.StudentAddEditDialogComponent, { data: {} });
      ref.afterClosed().subscribe(() => this.load());
    });
  }

  edit(s: any) {
    import('../student-add-edit-dialog/student-add-edit-dialog.component').then(m => {
      const ref = this.dialog.open(m.StudentAddEditDialogComponent, { data: { student: s } });
      ref.afterClosed().subscribe(() => this.load());
    });
  }

  remove(s: any) {
    if (!confirm('Öğrenciyi silmek istiyor musunuz?')) return;
    this.http.delete('/api/students/' + s.id).subscribe({ next: () => this.load(), error: e => console.error(e) });
  }

  formatDate(v: any) {
    if (!v) return '';
    try { return new Date(v).toLocaleDateString(); } catch(e) { return ''; }
  }
}
