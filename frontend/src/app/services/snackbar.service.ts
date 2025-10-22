import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  constructor(private snack: MatSnackBar) {}
  success(message: string, ms = 3000) { this.snack.open(message, undefined, { duration: ms, panelClass: ['snackbar-success'] }); }
  error(message: string, ms = 5000) { this.snack.open(message, undefined, { duration: ms, panelClass: ['snackbar-error'] }); }
  info(message: string, ms = 3000) { this.snack.open(message, undefined, { duration: ms, panelClass: ['snackbar-info'] }); }
}
