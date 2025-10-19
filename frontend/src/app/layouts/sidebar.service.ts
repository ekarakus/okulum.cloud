import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  // false = expanded, true = collapsed
  private _collapsed = new BehaviorSubject<boolean>(false);
  collapsed$ = this._collapsed.asObservable();

  setCollapsed(value: boolean) { this._collapsed.next(value); }
  toggle() { this._collapsed.next(!this._collapsed.value); }
  isCollapsed() { return this._collapsed.value; }
}
