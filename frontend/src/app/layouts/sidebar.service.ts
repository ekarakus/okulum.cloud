import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  // false = expanded, true = collapsed
  // Read persisted preference from localStorage when available. If no
  // preference exists, default to collapsed=true (per product request).
  private static STORAGE_KEY = 'sidebarCollapsed';
  private _collapsed = new BehaviorSubject<boolean>(false);
  constructor() {
    try {
      const raw = localStorage.getItem(SidebarService.STORAGE_KEY);
      if (raw === null) {
        // default to collapsed on first run
        this._collapsed.next(true);
        localStorage.setItem(SidebarService.STORAGE_KEY, 'true');
      } else {
        this._collapsed.next(raw === 'true');
      }
    } catch (e) {
      // fail silently and leave default false
      this._collapsed.next(true);
    }
  }
  collapsed$ = this._collapsed.asObservable();

  // control sidebar visibility (use async pipe in templates to avoid
  // ExpressionChangedAfterItHasBeenCheckedError when toggling from code)
  private _visible = new BehaviorSubject<boolean>(false);
  visible$ = this._visible.asObservable();

  setCollapsed(value: boolean) {
    try { localStorage.setItem(SidebarService.STORAGE_KEY, value ? 'true' : 'false'); } catch(e) {}
    this._collapsed.next(value);
  }
  toggle() {
    const next = !this._collapsed.value;
    try { localStorage.setItem(SidebarService.STORAGE_KEY, next ? 'true' : 'false'); } catch(e) {}
    this._collapsed.next(next);
  }
  isCollapsed() { return this._collapsed.value; }

  setVisible(value: boolean) { this._visible.next(value); }
  isVisible() { return this._visible.value; }
}
