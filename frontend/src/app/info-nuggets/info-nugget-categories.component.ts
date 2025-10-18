import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoNuggetService } from '../services/info-nugget.service';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { InfoNuggetCategoryFormComponent } from './info-nugget-category-form.component';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-info-nugget-categories',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()" class="back-btn" aria-label="Geri">
            <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
          </button>
          <h1>
            <mat-icon fontSet="material-symbols-outlined">category</mat-icon>
            Kategori Yönetimi
          </h1>
        </div>
        <div style="display:flex; gap:8px; align-items:center">
          <button mat-raised-button color="primary" (click)="openCreate()" class="add-btn">
            <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
            Yeni Kategori
          </button>
        </div>
      </div>

      <mat-card class="table-card">
        <div class="table-header">
          <h2>
            <mat-icon fontSet="material-symbols-outlined">format_list_bulleted</mat-icon>
            Kategori Listesi
          </h2>
        </div>

        <div class="table-container">
          <table style="width:100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; width:64px">#</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd">Ad</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd">Renk</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="categories.length === 0">
                <td colspan="4" style="padding: 20px; text-align: center; color: #666;">Henüz kategori yok.</td>
              </tr>
              <tr *ngFor="let c of categories; let i = index" style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; text-align: center;">{{i+1}}</td>
                <td style="padding: 8px;">
                  <span style="display:inline-flex;align-items:center;gap:8px">
                    <mat-icon fontSet="material-symbols-outlined">{{c.visual_value}}</mat-icon>
                    <span>{{c.name}}</span>
                  </span>
                </td>
                <td style="padding: 8px;"><span style="display:inline-block;width:18px;height:18px;border-radius:4px;background:{{c.color_hex||'#999'}};margin-right:8px"></span>{{c.color_hex}}</td>
                <td style="padding: 8px;">
                  <button mat-button (click)="openEdit(c)" style="margin-right:8px"><mat-icon fontSet="material-symbols-outlined">edit</mat-icon> Düzenle</button>
                  <button mat-button color="warn" (click)="remove(c)"><mat-icon fontSet="material-symbols-outlined">delete</mat-icon> Sil</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- pagination-controls removed: list updates dynamically after create/edit/delete -->
      </mat-card>
    </div>
  `
  ,
  styles: [
    `
    .container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .header h1 { margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.6rem; font-weight: 600; color: #2c3e50; }
    .header h1 mat-icon { font-size: 1.6rem; color: #1976d2; }

    .table-card { border-radius: 12px; overflow: hidden; }
    .table-header { padding: 1rem; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; }
    .table-header h2 { margin: 0; font-size: 1.1rem; font-weight: 600; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem; }
    .table-container { overflow-x: auto; }

    .back-btn { background-color: #f8f9fa; color: #1976d2; border: 2px solid #e3f2fd; transition: all 0.3s ease; }
    .back-btn:hover { background-color: #e3f2fd; transform: scale(1.05); }

    .add-btn { padding: 0.6rem 1rem; border-radius: 8px; font-weight: 500; background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); border: none; box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15); transition: all 0.2s ease; }
    .add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(25, 118, 210, 0.25); }

    .pagination-controls { display: flex; justify-content: center; align-items: center; padding: 1rem 0; gap: 1rem; }
    @media (max-width: 768px) { .container { padding: 1rem; } .header { flex-direction: column; gap: 1rem; align-items: stretch; } }
    `
  ]
})
export class InfoNuggetCategoriesComponent implements OnInit {
  private svc = inject(InfoNuggetService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  categories: any[] = [];

  constructor(){ }

  ngOnInit(): void { this.load(); }

  goBack(){ this.router.navigate(['/info-nuggets']); }
  reload(){ this.load(); }

  load(){ this.svc.listCategories().subscribe((r:any) => { this.categories = r || []; try{ this.cdr.detectChanges(); }catch(e){} }); }

  openCreate(){
    const ref = this.dialog.open(InfoNuggetCategoryFormComponent, { data: null, width: '480px' });
    ref.afterClosed().subscribe((res:any) => { if (res && res.success) this.load(); });
  }

  openEdit(c:any){
    const ref = this.dialog.open(InfoNuggetCategoryFormComponent, { data: { id: c.id }, width: '480px' });
    ref.afterClosed().subscribe((res:any) => { if (res && res.success) this.load(); });
  }

  remove(c:any){ if (!confirm('Silmek istediğinize emin misiniz?')) return; this.svc.deleteCategory(c.id).subscribe({ next: () => this.load(), error: (e:any)=>{ console.error(e); alert('Silme hatası'); } });
  }
}
