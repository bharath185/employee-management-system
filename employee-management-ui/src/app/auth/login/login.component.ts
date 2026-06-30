import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    NzCardModule, NzFormModule, NzInputModule, NzButtonModule, NzIconModule
  ],
  template: `
    <div class="login-page">
      <div class="bg-light"></div>
      <div class="login-card">
        <div class="card-body">
          <div class="logo-section">
            <img src="assets/logo.png" alt="Logo" class="logo">
          </div>
          <h1>Welcome Back</h1>
          <p class="tagline">Sign in to your account</p>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <div class="field">
              <label class="field-label">Username</label>
              <nz-input-group nzPrefixIcon="user" class="input-wrap">
                <input nz-input formControlName="username" placeholder="Enter your username" autocomplete="username">
              </nz-input-group>
            </div>
            <div class="field">
              <label class="field-label">Password</label>
              <nz-input-group nzPrefixIcon="lock" [nzSuffix]="pwdSuffix" class="input-wrap">
                <input nz-input [type]="hidePassword ? 'password' : 'text'"
                       formControlName="password" placeholder="Enter your password" autocomplete="current-password">
              </nz-input-group>
            </div>
            <div *ngIf="errorMessage" class="error-msg">
              <i nz-icon nzType="exclamation-circle"></i> {{ errorMessage }}
            </div>
            <button nz-button nzType="primary" nzBlock class="login-btn"
                    [disabled]="loginForm.invalid || isLoading" [nzLoading]="isLoading">
              Sign In
            </button>
          </form>

          <p class="footer-text">Employee Management System &copy; 2026</p>
        </div>
      </div>
    </div>

    <ng-template #pwdSuffix>
      <i nz-icon [nzType]="hidePassword ? 'eye-invisible' : 'eye'"
         (click)="hidePassword = !hidePassword; $event.stopPropagation()"
         class="pwd-toggle"></i>
    </ng-template>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
      gap: 60px;
      position: relative;
      background: #f5f6fa;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      position: relative;
      z-index: 2;
      animation: cardIn 0.5s ease both;
      background: #ffffff;
      border: 1px solid #e8eaed;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .card-body { padding: 44px 36px 28px; }

    .logo-section { text-align: center; margin-bottom: 20px; }
    .logo { width: 96px; height: auto; }
    h1 { font-size: 24px; font-weight: 700; color: #1a1a2e; text-align: center; margin: 0 0 4px; letter-spacing: -0.3px; }
    .tagline { font-size: 14px; color: #6c757d; text-align: center; margin: 0 0 28px; }

    .login-form { display: flex; flex-direction: column; gap: 20px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    :host ::ng-deep .input-wrap.ant-input-affix-wrapper {
      border-radius: 10px; padding: 2px 14px;
      border: 1px solid #d1d5db !important;
      transition: all 0.2s ease;
      background: #ffffff !important;
      height: 44px;
    }
    :host ::ng-deep .input-wrap.ant-input-affix-wrapper:hover { border-color: #2563eb !important; }
    :host ::ng-deep .input-wrap.ant-input-affix-wrapper-focused,
    :host ::ng-deep .input-wrap.ant-input-affix-wrapper:focus {
      border-color: #2563eb !important;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
    }
    :host ::ng-deep .input-wrap .ant-input-prefix { margin-right: 8px; color: #6c757d; font-size: 15px; }
    :host ::ng-deep .input-wrap input { background: transparent !important; font-size: 13px; color: #1a1a2e !important; }
    :host ::ng-deep .input-wrap input::placeholder { color: #9ca3af; }
    .pwd-toggle { cursor: pointer; color: #6c757d; font-size: 15px; }
    .pwd-toggle:hover { color: #2563eb; }

    .error-msg {
      display: flex; align-items: center; gap: 8px;
      color: #ef4444; font-size: 13px; font-weight: 500;
      padding: 10px 14px; background: rgba(239, 68, 68, 0.1);
      border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .error-msg i { font-size: 16px; flex-shrink: 0; color: #ef4444; }

    .login-btn {
      height: 46px; font-size: 14px; font-weight: 600;
      letter-spacing: 0.3px; border-radius: 6px; border: none;
      background: #2563eb !important;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2) !important;
      transition: all 0.2s ease;
    }
    .login-btn:not(:disabled):hover {
      background: #1d4ed8 !important;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3) !important;
    }

    .footer-text { text-align: center; margin-top: 24px; font-size: 11px; color: #adb5bd; }

    @media (max-width: 768px) {
      .login-page { justify-content: center; padding: 24px; gap: 0; }
    }
    @media (max-width: 480px) {
      .card-body { padding: 32px 20px 24px; }
      .logo { width: 80px; }
      h1 { font-size: 20px; }
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) this.navigateToHome();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) this.navigateToHome();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Invalid username or password';
      }
    });
  }

  private navigateToHome(): void {
    const role = this.authService.getUserRole();
    if (role === 'ADMIN' || role === 'HR') this.router.navigate(['/admin/dashboard']);
    else this.router.navigate(['/employee/dashboard']);
  }
}
