import { Component, Inject, inject, OnDestroy } from '@angular/core';
import { Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
// using native HTML date inputs instead of MatDatepicker
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
// will load CKEditor Classic from CDN at runtime
import { AnnouncementService } from '../services/announcement.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-announcement-add-edit-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule, HttpClientModule],
  template: `
  <h2 mat-dialog-title>{{data.announcement ? 'Duyuru Düzenle' : 'Yeni Duyuru'}}</h2>
  <mat-dialog-content [formGroup]="form">
    <mat-form-field appearance="fill" style="width:100%">
      <mat-label>Başlık</mat-label>
      <input matInput formControlName="title" />
    </mat-form-field>

    <!-- order & active moved below the date/time controls -->
    <div *ngIf="form.get('title')?.touched && form.get('title')?.hasError('required')" style="color:crimson;font-size:12px;margin-bottom:8px">Başlık boş bırakılamaz.</div>

    <div class="editor-wrapper" style="width:100%">
      <!-- TinyMCE editor element. min-height enforced via style. -->
      <textarea id="tinymce-editor" style="min-height:200px;width:100%;background:white;border:1px solid #ddd;border-radius:4px;padding:8px"></textarea>
    </div>

    <div style="display:flex;gap:12px;align-items:center">
      <mat-form-field appearance="fill" style="width:220px">
        <mat-label>Yayınlanma Tarihi</mat-label>
        <input matInput type="date" (change)="onPublishDateNativeChange($any($event.target).value)" [value]="formatDateOnlyForInput(getPublishDateOnly())" />
      </mat-form-field>

      <mat-form-field appearance="fill" style="width:220px">
        <mat-label>Bitiş Tarihi</mat-label>
        <input matInput type="date" (change)="onEndDateNativeChange($any($event.target).value)" [value]="formatDateOnlyForInput(getEndDateOnly())" />
      </mat-form-field>
    </div>
    <div *ngIf="form.get('publish_date')?.touched && form.get('publish_date')?.hasError('required')" style="color:crimson;font-size:12px;margin-bottom:8px">Yayınlanma tarihi boş bırakılamaz.</div>

    <!-- time inputs directly after the date inputs, side-by-side -->
    <div style="display:flex;gap:12px;align-items:center;margin-top:8px">
      <mat-form-field appearance="fill" style="width:220px">
        <mat-label>Gün içi yayın başlama saati</mat-label>
        <input matInput type="time" formControlName="publish_start_time" />
      </mat-form-field>

      <mat-form-field appearance="fill" style="width:220px">
        <mat-label>Yayın bitirme saati</mat-label>
        <input matInput type="time" formControlName="publish_end_time" />
      </mat-form-field>
    </div>
    <div *ngIf="form.hasError('publishTooEarly')" style="color:crimson;font-size:12px;margin-bottom:8px">Başlama tarihi bugünden önce olamaz.</div>


    <div *ngIf="form.hasError('endNotAfterStart')" style="color:crimson;font-size:12px;margin-bottom:8px">Bitiş tarihi başlangıçtan sonra olmalıdır ve eşit olamaz.</div>

    <div style="display:flex;gap:16px;align-items:center;margin-top:8px">
      <mat-form-field appearance="fill" style="width:160px">
        <mat-label>Sıra</mat-label>
        <input matInput type="number" formControlName="order" />
      </mat-form-field>
      <mat-checkbox formControlName="is_active" style="margin-top:8px">Aktif</mat-checkbox>
    </div>



    <div *ngIf="form.get('contentHtml')?.touched && form.get('contentHtml')?.hasError('required')" style="color:crimson;font-size:12px;margin-bottom:8px">İçerik boş bırakılamaz.</div>
  </mat-dialog-content>
  <mat-dialog-actions>
    <button mat-button (click)="close()">İptal</button>
    <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">Kaydet</button>
  </mat-dialog-actions>
  `
})
export class AnnouncementAddEditDialogComponent {
  http: HttpClient = inject(HttpClient);
  fb = inject(FormBuilder);
  announcementSvc = inject(AnnouncementService);
  dialogRef: MatDialogRef<any> | null = null;
  data: any;
  // TinyMCE editor reference
  private _editorInstance: any = null;

  form = this.fb.group({
    title: ['', [Validators.required]],
    contentHtml: ['', [Validators.required]],
    order: [0],
    publish_date: ['', [Validators.required]],
    end_date: [''],
    // time-only fields (HH:mm)
    publish_start_time: [''],
    publish_end_time: [''],
    is_active: [true]
  }, { validators: this.dateRangeValidator.bind(this) });

  // Validator: publish_date must be >= today; end_date must be > publish_date
  dateRangeValidator(group: any) {
    const publish = group.get('publish_date')?.value;
    const end = group.get('end_date')?.value;
    const errors: any = {};
    if (publish) {
      const pub = new Date(publish);
      const today = new Date();
      today.setHours(0,0,0,0);
      if (pub < today) errors.publishTooEarly = true;
    }
    if (publish && end) {
      const pub = new Date(publish);
      const e = new Date(end);
      if (e <= pub) errors.endNotAfterStart = true;
    }
    return Object.keys(errors).length ? errors : null;
  }

  // removed external file upload: images are embedded via the editor (Base64)

  constructor(@Inject(MAT_DIALOG_DATA) data: any, dialogRef: MatDialogRef<AnnouncementAddEditDialogComponent>) {
    this.data = data || {};
    this.dialogRef = dialogRef;
    if (this.data.announcement) {
      const a = this.data.announcement;
      this.form.patchValue({
        title: a.title,
        contentHtml: a.content || '',
        order: a.order != null ? a.order : 0,
        // normalize to local 'YYYY-MM-DDTHH:mm' for datetime-local input
        publish_date: a.publish_date ? this.formatDateForInput(new Date(a.publish_date)) : '',
        end_date: a.end_date ? this.formatDateForInput(new Date(a.end_date)) : '',
        publish_start_time: a.publish_start_time || (a.publish_date ? this.getPublishTimeOnly() : ''),
        publish_end_time: a.publish_end_time || (a.end_date ? this.getEndTimeOnly() : ''),
        is_active: !!a.is_active
      });
      // set initial editor HTML if present (DOM will be updated via bindings)
    }
  }

  // format Date -> 'YYYY-MM-DDTHH:MM' suitable for input[type=datetime-local]
  private formatDateForInput(d: Date) {
    if (!d || isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }



  ngAfterViewInit(): void {
    // initialize TinyMCE editor after view is ready
    try { this.initTinyMce(); } catch (e) { console.error('TinyMCE init error', e); }
  }

  // Date/time helper methods
  private pad(n: number) { return n.toString().padStart(2, '0'); }

  private combineDateAndTime(date: Date | null, timeStr: string | null) {
    if (!date && !timeStr) return '';
    const d = date ? new Date(date) : new Date();
    let hours = d.getHours();
    let minutes = d.getMinutes();
    if (timeStr) {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        hours = parseInt(parts[0], 10) || 0;
        minutes = parseInt(parts[1], 10) || 0;
      }
    }
    d.setHours(hours, minutes, 0, 0);
    return `${d.getFullYear()}-${this.pad(d.getMonth()+1)}-${this.pad(d.getDate())}T${this.pad(d.getHours())}:${this.pad(d.getMinutes())}`;
  }

  onPublishDateChange(d: Date | null) {
    const curTime = this.getPublishTimeOnly();
    const combined = this.combineDateAndTime(d, curTime);
    this.form.get('publish_date')?.setValue(combined);
  }

  onPublishTimeChange(t: string | null) {
    const curDate = this.getPublishDateOnly();
    const parsedDate = curDate ? new Date(curDate) : new Date();
    const combined = this.combineDateAndTime(parsedDate, t);
    this.form.get('publish_date')?.setValue(combined);
  }

  onEndDateChange(d: Date | null) {
    const curTime = this.getEndTimeOnly();
    const combined = this.combineDateAndTime(d, curTime);
    this.form.get('end_date')?.setValue(combined);
  }

  onEndTimeChange(t: string | null) {
    const curDate = this.getEndDateOnly();
    const parsedDate = curDate ? new Date(curDate) : new Date();
    const combined = this.combineDateAndTime(parsedDate, t);
    this.form.get('end_date')?.setValue(combined);
  }

  getPublishDateOnly() {
    const v = this.form.get('publish_date')?.value;
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  getPublishTimeOnly() {
    // prefer explicit publish_start_time form control if set
    const ctl = this.form.get('publish_start_time')?.value;
    if (ctl && ctl.toString().trim()) return ctl.toString();
    const v = this.form.get('publish_date')?.value;
    if (!v) return '08:00';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '08:00';
    return `${this.pad(d.getHours())}:${this.pad(d.getMinutes())}`;
  }

  getEndDateOnly() {
    const v = this.form.get('end_date')?.value;
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  getEndTimeOnly() {
    // prefer explicit publish_end_time form control if set
    const ctl = this.form.get('publish_end_time')?.value;
    if (ctl && ctl.toString().trim()) return ctl.toString();
    const v = this.form.get('end_date')?.value;
    if (!v) return '08:00';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '08:00';
    return `${this.pad(d.getHours())}:${this.pad(d.getMinutes())}`;
  }

  // Native date input handlers (value is 'YYYY-MM-DD')
  onPublishDateNativeChange(value: string) {
    if (!value) {
      this.form.get('publish_date')?.setValue('');
      return;
    }
    // combine with existing time part
    const time = this.getPublishTimeOnly();
    const parts = value.split('-');
    if (parts.length !== 3) { this.form.get('publish_date')?.setValue(''); return; }
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const combined = this.combineDateAndTime(d, time);
    this.form.get('publish_date')?.setValue(combined);
  }

  onEndDateNativeChange(value: string) {
    if (!value) { this.form.get('end_date')?.setValue(''); return; }
    const time = this.getEndTimeOnly();
    const parts = value.split('-');
    if (parts.length !== 3) { this.form.get('end_date')?.setValue(''); return; }
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const combined = this.combineDateAndTime(d, time);
    this.form.get('end_date')?.setValue(combined);
  }

  formatDateOnlyForInput(d: Date | null) {
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = this.pad(d.getMonth() + 1);
    const dd = this.pad(d.getDate());
    return `${yyyy}-${mm}-${dd}`;
  }

  close() { this.dialogRef?.close(); }

  save() {
    const v = this.form.value;
    // v.publish_date and v.end_date are in 'YYYY-MM-DDTHH:mm' (local) format.
    // Convert to full ISO strings before sending, keeping local time.
    const publishIso = v.publish_date ? new Date(v.publish_date).toISOString() : null;
    const endIso = v.end_date ? new Date(v.end_date).toISOString() : null;
    const payload = {
      title: v.title,
      content: v.contentHtml,
      order: v.order != null ? Number(v.order) : 0,
      publish_date: publishIso,
      end_date: endIso,
      // time-only fields (HH:mm)
      publish_start_time: (v.publish_start_time && v.publish_start_time.toString().trim()) ? v.publish_start_time : this.getPublishTimeOnly(),
      publish_end_time: (v.publish_end_time && v.publish_end_time.toString().trim()) ? v.publish_end_time : this.getEndTimeOnly(),
      is_active: !!v.is_active
    };

    const finish = () => { this.dialogRef?.close(true); };

    if (this.data.announcement) {
      this.http.put('/api/announcements/' + this.data.announcement.id, payload).subscribe({ next: () => { try { this.announcementSvc.notifyChange(); } catch(e) { /* ignore */ } this.dialogRef?.close(true); }, error: err => { console.error(err); } });
    } else {
      this.http.post('/api/announcements', payload).subscribe({ next: (res: any) => { try { this.announcementSvc.notifyChange(); } catch(e) { /* ignore */ } this.dialogRef?.close(true); }, error: err => { console.error(err); } });
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


    private async initTinyMce() {
      // load TinyMCE from CDN if not already present
      // TinyMCE API key (provided by user)
      const TINYMCE_API_KEY = '5vfxbix45mj2ue4003xuom5ss1e1l35dx4vg1tpn5mut2ozt';
      const loadScript = () => new Promise<void>((resolve, reject) => {
        if ((window as any).tinymce) return resolve();
        const s = document.createElement('script');
        s.src = `https://cdn.tiny.cloud/1/${TINYMCE_API_KEY}/tinymce/6/tinymce.min.js`;
        s.referrerPolicy = 'origin';
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
      });

      await loadScript();

      const tinymce = (window as any).tinymce;
      if (!tinymce) throw new Error('TinyMCE failed to load');

      // initialize editor
      tinymce.init({
        apiKey: TINYMCE_API_KEY,
        selector: '#tinymce-editor',
        height: 300,
        menubar: false,
        plugins: [
          'advlist','autolink','lists','link','image','charmap','preview','anchor','searchreplace','visualblocks','code','fullscreen','insertdatetime','media','table','help','wordcount','codesample','formatpainter'
        ],
        toolbar: 'undo redo | styleselect | fontselect fontsizeselect | bold italic underline strikethrough | forecolor backcolor | link image media | alignleft aligncenter alignright alignjustify | bullist numlist checklist | outdent indent | blockquote codesample code',
        images_upload_handler: (blobInfo: any) => {
          // Return a Promise that resolves to the shape TinyMCE expects.
          // Many TinyMCE configs accept a resolved object like { location: url }.
          return new Promise(async (resolve, reject) => {
            try {
              const file = blobInfo.blob();
              const form = new FormData();
              form.append('upload', file, blobInfo.filename());
              const res = await fetch('/api/announcements/images', { method: 'POST', body: form });
              if (!res.ok) {
                const text = await res.text().catch(() => '');
                const msg = `Upload failed: ${res.status} ${res.statusText} ${text}`;
                console.error('Image upload error', msg);
                return reject(new Error(msg));
              }
              const data = await res.json().catch(() => null);
              let url = data && data.url ? data.url : null;
              // If server returned a relative path (starts with /uploads), prefix with configured API base
              try {
                const apiBase = (environment && environment.apiUrl) ? environment.apiUrl : (window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : ''));
                if (url && url.startsWith('/')) {
                  url = (apiBase.replace(/\/$/, '')) + url;
                }
              } catch(e) { /* ignore */ }
              if (!url) {
                const msg = 'Upload succeeded but server returned no url';
                console.error('Image upload error', msg, { data });
                return reject(new Error(msg));
              }
              // Resolve with a plain URL string. Some TinyMCE configurations
              // expect the Promise to resolve to a string (the image src).
              // If TinyMCE wraps the resolved value under data.src.value,
              // that value must be a string.
              console.debug('Image upload successful, returning url to TinyMCE', url);
              return resolve(url as any);
            } catch (err) {
              console.error('Image upload exception', err);
              return reject(err);
            }
          });
        },
        setup: (editor: any) => {
          this._editorInstance = editor;
          // prefer the form value, but fall back to the passed-in announcement content
          const formVal = this.form.get('contentHtml')?.value;
          const dataVal = this.data && this.data.announcement ? (this.data.announcement.content || this.data.announcement.contentHtml || '') : '';
          const initial = (formVal && formVal.length) ? formVal : (dataVal || '');

          // Use the editor 'init' event which is fired when the editor is fully initialized.
          editor.on('init', () => {
            try {
              // set content from form or data
              editor.setContent(initial || '');
              // write back to form so form state is consistent
              const cur = editor.getContent();
              this.form.get('contentHtml')?.setValue(cur, { emitEvent: false });
              // debug if content is unexpectedly empty
              if (!cur || cur.trim().length === 0) {
                console.debug('TinyMCE init: content empty after setContent', { initial });
              }
            } catch (e) {
              console.warn('TinyMCE init setContent error', e);
            }
          });

          // keep form in sync when editor content changes
          editor.on('Change KeyUp Undo Redo', () => {
            try {
              const data = editor.getContent();
              this.form.get('contentHtml')?.setValue(data, { emitEvent: false });
            } catch (e) {
              // ignore
            }
          });
        }
      });
    }

    ngOnDestroy(): void {
      try {
        const tinymce = (window as any).tinymce;
        if (this._editorInstance && tinymce) {
          const id = this._editorInstance.id || 'tinymce-editor';
          const ed = tinymce.get(id);
          if (ed) ed.remove();
        }
      } catch (e) {
        // ignore
      }
    }

  }
        // simple availability heuristic: check plugin names for keywords
