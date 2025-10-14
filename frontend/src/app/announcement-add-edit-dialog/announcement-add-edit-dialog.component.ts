import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-announcement-add-edit-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule],
  template: `
  <h2 mat-dialog-title>{{data.announcement ? 'Duyuru Düzenle' : 'Yeni Duyuru'}}</h2>
  <mat-dialog-content [formGroup]="form">
    <mat-form-field appearance="fill" style="width:100%">
      <mat-label>Başlık</mat-label>
      <input matInput formControlName="title" />
    </mat-form-field>

    <div class="editor-wrapper" style="width:100%">
      <div class="editor-toolbar">
        <button mat-icon-button type="button" (click)="exec('bold')" title="Kalın"><span class="material-symbols-outlined">format_bold</span></button>
        <button mat-icon-button type="button" (click)="exec('italic')" title="İtalik"><span class="material-symbols-outlined">format_italic</span></button>
        <button mat-icon-button type="button" (click)="exec('underline')" title="Altı Çizili"><span class="material-symbols-outlined">format_underlined</span></button>
        <button mat-icon-button type="button" (click)="exec('insertUnorderedList')" title="Liste"><span class="material-symbols-outlined">format_list_bulleted</span></button>
        <button mat-icon-button type="button" (click)="exec('insertOrderedList')" title="Numaralı Liste"><span class="material-symbols-outlined">format_list_numbered</span></button>
        <button mat-icon-button type="button" (click)="addLink()" title="Link Ekle"><span class="material-symbols-outlined">link</span></button>
        <button mat-icon-button type="button" (click)="removeLink()" title="Link Kaldır"><span class="material-symbols-outlined">link_off</span></button>
      </div>
      <div class="editor-area" contenteditable="true" role="textbox" aria-multiline="true" [innerHTML]="form.get('contentHtml')?.value" (input)="onEditorInput($event)" style="min-height:160px;border:1px solid #ddd;padding:8px;border-radius:4px;overflow:auto;background:white"></div>
    </div>

    <mat-form-field appearance="fill">
      <mat-label>Yayınlanma Tarihi</mat-label>
      <input matInput type="datetime-local" formControlName="publish_date" />
    </mat-form-field>

    <mat-form-field appearance="fill">
      <mat-label>Bitiş Tarihi</mat-label>
      <input matInput type="datetime-local" formControlName="end_date" />
    </mat-form-field>

    <mat-checkbox formControlName="is_active">Aktif</mat-checkbox>
  </mat-dialog-content>
  <mat-dialog-actions>
    <button mat-button (click)="close()">İptal</button>
    <button mat-raised-button color="primary" (click)="save()">Kaydet</button>
  </mat-dialog-actions>
  `
})
export class AnnouncementAddEditDialogComponent {
  http = inject(HttpClient);
  fb = inject(FormBuilder);
  dialogRef: MatDialogRef<any> | null = null;
  data: any;

  form = this.fb.group({
    title: [''],
    contentHtml: [''],
    publish_date: [''],
    end_date: [''],
    is_active: [true]
  });

  constructor(@Inject(MAT_DIALOG_DATA) data: any, dialogRef: MatDialogRef<AnnouncementAddEditDialogComponent>) {
    this.data = data || {};
    this.dialogRef = dialogRef;
    if (this.data.announcement) {
      const a = this.data.announcement;
      this.form.patchValue({
        title: a.title,
        contentHtml: a.content || '',
        publish_date: a.publish_date ? new Date(a.publish_date).toISOString().slice(0,16) : '',
        end_date: a.end_date ? new Date(a.end_date).toISOString().slice(0,16) : '',
        is_active: !!a.is_active
      });
      // set initial editor HTML if present (DOM will be updated via bindings)
    }
  }

  ngAfterViewInit(): void {
    // ensure editor reflects initial content (if any)
    try {
      const html = this.form.get('contentHtml')?.value || '';
      const el = document.querySelector('.editor-area') as HTMLElement | null;
      if (el) el.innerHTML = html;
    } catch (e) {}
  }

  close() { this.dialogRef?.close(); }

  save() {
    const v = this.form.value;
    const payload = {
      title: v.title,
      content: v.contentHtml,
      publish_date: v.publish_date || null,
      end_date: v.end_date || null,
      is_active: !!v.is_active
    };

    if (this.data.announcement) {
      this.http.put('/api/announcements/' + this.data.announcement.id, payload).subscribe(() => this.dialogRef?.close(true));
    } else {
      this.http.post('/api/announcements', payload).subscribe(() => this.dialogRef?.close(true));
    }
  }

  exec(command: string, value: string | null = null) {
    (document as any).execCommand(command, false, value as any);
  }

  addLink() {
    const url = prompt('Link URL girin (ör: https://...)');
    if (url) this.exec('createLink', url);
  }

  removeLink() {
    this.exec('unlink');
  }

  onEditorInput(event: Event) {
    const html = (event.target as HTMLElement).innerHTML;
    this.form.get('contentHtml')?.setValue(html, { emitEvent: false });
  }
}
