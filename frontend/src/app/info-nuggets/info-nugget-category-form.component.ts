import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { InfoNuggetService } from '../services/info-nugget.service';

@Component({
  selector: 'app-info-nugget-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule],
  template: `
    <div style="padding:18px 22px">
      <h2 style="margin:0 0 12px 0">Kategori</h2>
      <form [formGroup]="fg" (ngSubmit)="save()">
        <div class="grid">
        <mat-form-field appearance="fill">
          <mat-label>Kategori Adı (name)</mat-label>
          <input matInput formControlName="name" placeholder="örn: Announcements" >
          <mat-hint>Örnek: demo_kategori veya Duyurular (unique)</mat-hint>
        </mat-form-field>

        <div style="display:flex;align-items:center;gap:12px">
          <mat-form-field appearance="fill" style="flex:1">
            <mat-label>Renk (hex)</mat-label>
            <input matInput formControlName="color_hex" placeholder="#1976d2">
          </mat-form-field>
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
            <input type="color" [value]="fg.get('color_hex')?.value" (input)="fg.get('color_hex')?.setValue($any($event.target).value)" style="width:40px;height:40px;border:0;padding:0;background:transparent;cursor:pointer" />
            <div style="width:18px;height:18px;border-radius:4px;background:{{fg.get('color_hex')?.value || '#1976d2'}};border:1px solid #ccc"></div>
          </div>
        </div>

        <mat-form-field appearance="fill" style="width:100%">
          <mat-label>Icon (Google Fonts Icons)</mat-label>
          <mat-select formControlName="visual_value">
            <mat-option *ngFor="let ic of ICONS" [value]="ic">
              <span style="display:inline-flex;align-items:center;gap:8px">
                <mat-icon fontSet="material-symbols-outlined">{{ic}}</mat-icon>
                <span>{{ic}}</span>
              </span>
            </mat-option>
          </mat-select>
          <mat-hint>Daha fazlası için: <a href="https://fonts.google.com/icons" target="_blank" rel="noopener">fonts.google.com/icons</a></mat-hint>
        </mat-form-field>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
        <button mat-button type="button" (click)="close(false)">İptal</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="fg.invalid">Kaydet</button>
      </div>
    </form>
  `
})
export class InfoNuggetCategoryFormComponent {
  private svc = inject(InfoNuggetService);
  private fb = inject(FormBuilder);
  private dialogData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef);
  fg = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    color_hex: ['#1976d2'],
    visual_value: ['', Validators.required]
  });
  // A small curated list of Material Symbols names (common icons) from Google Fonts
  ICONS: string[] = [
    // expanded set of commonly used Material Symbols (Google Fonts)
    'info','warning','announcement','help','event','star','check_circle','error','home','school','person','people','work','build','settings','calendar_month','access_time','language','email','phone','location_on','delete','edit','visibility','lock','unlock','shopping_cart','favorite','thumb_up','thumb_down','alarm','attach_file','bookmark','camera_alt','chat','cloud_upload','download','opacity','visibility_off','playlist_add','play_arrow','pause','stop'
  ];
  constructor(){
    if (this.dialogData && this.dialogData.id) { this.load(this.dialogData.id); }
  }

  load(id:number){ this.svc.listCategories().subscribe((r:any) => { const c = (r||[]).find((x:any)=>x.id==id); if (c) this.fg.patchValue({
    name: c.name,
    color_hex: c.color_hex || '#1976d2',
    visual_value: c.visual_value || ''
  }); }); }

  save(){
    if (this.fg.invalid) return;
    const raw = this.fg.value as { name:string; color_hex: string; visual_value: string };
    const payload = {
      name: raw.name,
      color_hex: raw.color_hex,
      visual_value: raw.visual_value
    };
    if (this.dialogData && this.dialogData.id) {
      this.svc.updateCategory(this.dialogData.id, payload as any as Partial<import('../models/info-nugget.model').InfoNuggetCategory>).subscribe(()=> this.close(true), e=>{ console.error(e); alert('Kaydetme hatası'); });
    } else {
      this.svc.createCategory(payload as any as Partial<import('../models/info-nugget.model').InfoNuggetCategory>).subscribe(()=> this.close(true), e=>{ console.error(e); alert('Kaydetme hatası'); });
    }
  }

  close(ok:boolean){ this.dialogRef.close({ success: !!ok }); }
}
