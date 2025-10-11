import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, School } from '../services/auth.service';

@Component({
  selector: 'app-school-selection',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatListModule, MatIconModule],
  template: `
    <div style="max-width: 600px; margin: 2rem auto; padding: 1rem;">
      <mat-card style="padding: 2rem;">
        <div style="text-align: center; margin-bottom: 2rem;">
          <span class="material-symbols-outlined" style="font-size: 48px; color: #667eea; margin-bottom: 1rem; display: block;">school</span>
          <h2 style="margin: 0; color: #2c3e50;">Okul Seçin</h2>
          <p style="margin: 0.5rem 0; color: #666;">
            Çalışmak istediğiniz okulu seçiniz
          </p>
        </div>

        <mat-list>
          <mat-list-item
            *ngFor="let school of schools"
            (click)="selectSchool(school)"
            style="cursor: pointer; border: 1px solid #e0e0e0; margin-bottom: 1rem; border-radius: 8px; padding: 1rem;">
            <mat-icon matListItemIcon>school</mat-icon>
            <div matListItemTitle style="font-weight: 500; font-size: 1.1rem;">{{ school.name }}</div>
            <div matListItemLine style="color: #666;">Kod: {{ school.code }}</div>
            <div matListItemLine *ngIf="school.assignment?.is_primary" style="color: #4caf50; font-size: 0.9rem;">
              <span style="background: #4caf50; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8rem;">
                Ana Okul
              </span>
            </div>
            <button mat-icon-button matListItemMeta>
              <mat-icon>arrow_forward_ios</mat-icon>
            </button>
          </mat-list-item>
        </mat-list>

        <div style="text-align: center; margin-top: 2rem;">
          <button mat-button color="warn" (click)="logout()">
            <mat-icon>logout</mat-icon>
            Çıkış Yap
          </button>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    mat-list-item:hover {
      background-color: #f5f5f5;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
    }

    @media (max-width: 768px) {
      .container {
        max-width: 95% !important;
        margin: 1rem auto !important;
        padding: 0.5rem !important;
      }

      mat-card {
        padding: 1.5rem !important;
      }

      .material-symbols-outlined {
        font-size: 40px !important;
      }

      h2 {
        font-size: 1.5rem !important;
      }
    }
  `]
})
export class SchoolSelectionComponent implements OnInit {
  schools: School[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.schools = this.authService.getCurrentUser()?.schools || [];

    // Eğer kullanıcının sadece bir okulu varsa otomatik seç
    if (this.schools.length === 1) {
      this.selectSchool(this.schools[0]);
    }
  }

  selectSchool(school: School): void {
    this.authService.setSelectedSchool(school);
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
