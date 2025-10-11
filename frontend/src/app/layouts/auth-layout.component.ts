import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <div class="auth-layout">
      <!-- Decorative Background Elements -->
      <div class="bg-pattern">
        <div class="floating-icon icon-1">
          <span class="material-symbols-outlined">school</span>
        </div>
        <div class="floating-icon icon-2">
          <span class="material-symbols-outlined">computer</span>
        </div>
        <div class="floating-icon icon-3">
          <span class="material-symbols-outlined">settings</span>
        </div>
        <div class="floating-icon icon-4">
          <span class="material-symbols-outlined">memory</span>
        </div>
        <div class="floating-icon icon-5">
          <span class="material-symbols-outlined">developer_board</span>
        </div>
        <div class="floating-icon icon-6">
          <span class="material-symbols-outlined">keyboard</span>
        </div>
      </div>

      <!-- Main Content -->
      <div class="auth-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 75%, #f5576c 100%);
      background-size: 400% 400%;
      animation: gradientAnimation 15s ease infinite;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      font-family: 'Roboto', sans-serif;
      position: relative;
      overflow: hidden;
    }

    @keyframes gradientAnimation {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .bg-pattern {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    .floating-icon {
      position: absolute;
      color: rgba(255, 255, 255, 0.15);
      font-size: 3rem;
      animation: float 6s ease-in-out infinite;
    }

    .floating-icon mat-icon {
      font-size: inherit;
      width: auto;
      height: auto;
    }

    .icon-1 {
      top: 10%;
      left: 15%;
      animation-delay: 0s;
    }

    .icon-2 {
      top: 20%;
      right: 10%;
      animation-delay: 1s;
      font-size: 2.5rem;
    }

    .icon-3 {
      bottom: 30%;
      left: 8%;
      animation-delay: 2s;
      font-size: 2rem;
    }

    .icon-4 {
      bottom: 15%;
      right: 20%;
      animation-delay: 3s;
      font-size: 2.8rem;
    }

    .icon-5 {
      top: 50%;
      left: 5%;
      animation-delay: 4s;
      font-size: 1.8rem;
    }

    .icon-6 {
      top: 70%;
      right: 5%;
      animation-delay: 5s;
      font-size: 2.2rem;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px) rotate(0deg);
        opacity: 0.1;
      }
      50% {
        transform: translateY(-20px) rotate(5deg);
        opacity: 0.2;
      }
    }

    .auth-content {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 450px;
    }

    @media (max-width: 768px) {
      .auth-layout {
        padding: 0.5rem;
      }

      .floating-icon {
        font-size: 2rem;
      }

      .icon-2 { font-size: 1.8rem; }
      .icon-3 { font-size: 1.5rem; }
      .icon-4 { font-size: 2rem; }
      .icon-5 { font-size: 1.3rem; }
      .icon-6 { font-size: 1.6rem; }
    }

    @media (max-width: 480px) {
      .floating-icon {
        display: none;
      }
    }

    .material-symbols-outlined {
      font-variation-settings:
        'FILL' 0,
        'wght' 400,
        'GRAD' 0,
        'opsz' 24;
    }
  `]
})
export class AuthLayoutComponent {}
