import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private _changes = new Subject<void>();
  public onChange$ = this._changes.asObservable();

  notifyChange() { this._changes.next(); }
}
