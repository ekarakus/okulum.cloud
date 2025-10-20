import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  // false = expanded, true = collapsed
  private _collapsed = new BehaviorSubject<boolean>(false);
  collapsed$ = this._collapsed.asObservable();

  // control sidebar visibility (use async pipe in templates to avoid
  // ExpressionChangedAfterItHasBeenCheckedError when toggling from code)
  private _visible = new BehaviorSubject<boolean>(false);
  visible$ = this._visible.asObservable();

  setCollapsed(value: boolean) { this._collapsed.next(value); }
  toggle() { this._collapsed.next(!this._collapsed.value); }
  isCollapsed() { return this._collapsed.value; }

  setVisible(value: boolean) { this._visible.next(value); }
  isVisible() { return this._visible.value; }
}
