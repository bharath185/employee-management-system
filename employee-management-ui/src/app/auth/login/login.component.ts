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
      <div class="bg-gradient"></div>
      <div class="particles">
        <div class="particle" style="--s:4px;--l:5%;--c:rgba(31,61,110,.3);--d:18s;--dy:0s"></div>
        <div class="particle" style="--s:6px;--l:14%;--c:rgba(74,144,217,.2);--d:22s;--dy:3s"></div>
        <div class="particle" style="--s:3px;--l:22%;--c:#4a90d9;--d:26s;--dy:6s"></div>
        <div class="particle" style="--s:7px;--l:30%;--c:rgba(31,61,110,.15);--d:16s;--dy:1s"></div>
        <div class="particle" style="--s:2px;--l:38%;--c:#1f3d6e;--d:30s;--dy:9s"></div>
        <div class="particle" style="--s:5px;--l:46%;--c:rgba(74,144,217,.4);--d:20s;--dy:4s"></div>
        <div class="particle" style="--s:8px;--l:54%;--c:rgba(31,61,110,.3);--d:24s;--dy:10s"></div>
        <div class="particle" style="--s:3px;--l:62%;--c:rgba(74,144,217,.2);--d:28s;--dy:5s"></div>
        <div class="particle" style="--s:6px;--l:70%;--c:#4a90d9;--d:17s;--dy:7s"></div>
        <div class="particle" style="--s:4px;--l:78%;--c:rgba(31,61,110,.15);--d:32s;--dy:11s"></div>
        <div class="particle" style="--s:5px;--l:10%;--c:#1f3d6e;--d:19s;--dy:2s"></div>
        <div class="particle" style="--s:2px;--l:18%;--c:rgba(74,144,217,.2);--d:25s;--dy:8s"></div>
        <div class="particle" style="--s:7px;--l:26%;--c:rgba(31,61,110,.3);--d:21s;--dy:12s"></div>
        <div class="particle" style="--s:3px;--l:34%;--c:rgba(74,144,217,.4);--d:27s;--dy:4s"></div>
        <div class="particle" style="--s:5px;--l:42%;--c:#4a90d9;--d:35s;--dy:13s"></div>
        <div class="particle" style="--s:4px;--l:50%;--c:rgba(31,61,110,.3);--d:15s;--dy:0s"></div>
        <div class="particle" style="--s:8px;--l:58%;--c:rgba(74,144,217,.2);--d:29s;--dy:14s"></div>
        <div class="particle" style="--s:2px;--l:66%;--c:#1f3d6e;--d:23s;--dy:6s"></div>
        <div class="particle" style="--s:6px;--l:74%;--c:rgba(31,61,110,.15);--d:31s;--dy:15s"></div>
        <div class="particle" style="--s:3px;--l:82%;--c:rgba(74,144,217,.2);--d:18s;--dy:3s"></div>
        <div class="particle" style="--s:7px;--l:8%;--c:#4a90d9;--d:33s;--dy:16s"></div>
        <div class="particle" style="--s:5px;--l:16%;--c:rgba(31,61,110,.3);--d:20s;--dy:5s"></div>
        <div class="particle" style="--s:4px;--l:24%;--c:rgba(74,144,217,.4);--d:26s;--dy:17s"></div>
        <div class="particle" style="--s:2px;--l:32%;--c:#1f3d6e;--d:16s;--dy:0s"></div>
        <div class="particle" style="--s:6px;--l:40%;--c:rgba(31,61,110,.15);--d:34s;--dy:18s"></div>
        <div class="particle" style="--s:8px;--l:48%;--c:rgba(74,144,217,.2);--d:22s;--dy:7s"></div>
        <div class="particle" style="--s:3px;--l:56%;--c:#4a90d9;--d:28s;--dy:19s"></div>
        <div class="particle" style="--s:5px;--l:64%;--c:rgba(31,61,110,.3);--d:19s;--dy:9s"></div>
        <div class="particle" style="--s:4px;--l:72%;--c:#1f3d6e;--d:24s;--dy:11s"></div>
        <div class="particle" style="--s:7px;--l:80%;--c:rgba(74,144,217,.2);--d:30s;--dy:14s"></div>
      </div>
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
      <div class="bottom-credit">Developed by <a href="https://www.prigenix.com" target="_blank">Prigenix</a></div>
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
      justify-content: flex-end;
      padding: 40px 80px;
      position: relative;
      overflow: hidden;
    }
    .bg-gradient {
      position: absolute; inset: 0;
      background: linear-gradient(160deg, #f0f4ff 0%, #e4eaf5 30%, #d5dfef 60%, #c8d5e8 100%);
      z-index: 0;
    }
    .bg-gradient::after {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 0%, rgba(31,61,110,0.04) 0%, transparent 70%);
      animation: gradShift 10s ease-in-out infinite alternate;
    }
    @keyframes gradShift {
      0% { opacity: 0.4; transform: translateX(-3%); }
      100% { opacity: 1; transform: translateX(3%); }
    }
    .particles {
      position: absolute; inset: 0;
      pointer-events: none; overflow: hidden;
      z-index: 1;
    }
    .particle {
      position: absolute;
      bottom: -20px;
      left: var(--l, 50%);
      width: var(--s, 4px);
      height: var(--s, 4px);
      background: var(--c, rgba(31,61,110,.3));
      border-radius: 50%;
      pointer-events: none;
      will-change: transform;
      animation: float var(--d, 20s) var(--dy, 0s) infinite linear;
    }

    @keyframes float {
      0% { transform: translateY(0); opacity: 0; }
      10% { opacity: 0.9; }
      90% { opacity: 0.8; }
      100% { transform: translateY(-110vh); opacity: 0; }
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 8px 40px rgba(31,61,110,0.1), 0 1px 4px rgba(0,0,0,0.04);
      position: relative;
      z-index: 2;
      animation: cardIn 0.5s ease both;
    }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .card-body { padding: 44px 36px 28px; }

    .logo-section { text-align: center; margin-bottom: 20px; }
    .logo { width: 96px; height: auto; }
    h1 { font-size: 22px; font-weight: 700; color: #1f3d6e; text-align: center; margin: 0 0 4px; letter-spacing: -0.3px; }
    .tagline { font-size: 14px; color: #8a94a6; text-align: center; margin: 0 0 28px; }

    .login-form { display: flex; flex-direction: column; gap: 20px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 13px; font-weight: 600; color: #4a5568; }
    :host ::ng-deep .input-wrap.ant-input-affix-wrapper {
      border-radius: 8px; padding: 2px 14px; border: 1.5px solid #e2e6ed;
      transition: all 0.2s ease; background: #f8f9fc; height: 44px;
    }
    :host ::ng-deep .input-wrap.ant-input-affix-wrapper:hover { border-color: #c5d0e0; background: #fff; }
    :host ::ng-deep .input-wrap.ant-input-affix-wrapper-focused,
    :host ::ng-deep .input-wrap.ant-input-affix-wrapper:focus {
      border-color: #1f3d6e; box-shadow: 0 0 0 3px rgba(31,61,110,0.08); background: #fff;
    }
    :host ::ng-deep .input-wrap .ant-input-prefix { margin-right: 8px; color: #a0aec0; font-size: 15px; }
    :host ::ng-deep .input-wrap input { background: transparent; font-size: 13px; color: #2d3748; }
    :host ::ng-deep .input-wrap input::placeholder { color: #a0aec0; }
    .pwd-toggle { cursor: pointer; color: #a0aec0; font-size: 15px; }
    .pwd-toggle:hover { color: #1f3d6e; }

    .error-msg {
      display: flex; align-items: center; gap: 8px;
      color: #dc3545; font-size: 13px; font-weight: 500;
      padding: 10px 14px; background: #fce4ec;
      border-radius: 8px; border: 1px solid rgba(220,53,69,0.12);
    }
    .error-msg i { font-size: 16px; flex-shrink: 0; }

    .login-btn {
      height: 46px; font-size: 14px; font-weight: 600;
      letter-spacing: 0.3px; border-radius: 8px; border: none;
      background: #1f3d6e; box-shadow: 0 4px 12px rgba(31,61,110,0.25);
      transition: all 0.2s ease;
    }
    .login-btn:not(:disabled):hover {
      background: #2a5298; transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(31,61,110,0.3) !important;
    }

    .footer-text { text-align: center; margin-top: 24px; font-size: 11px; color: #b0b8c7; }

    .bottom-credit {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      color: #8a94a6;
      z-index: 2;
    }
    .bottom-credit a {
      color: #1f3d6e;
      font-weight: 600;
      text-decoration: none;
    }
    .bottom-credit a:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      .login-page { justify-content: center; padding: 24px; }
      .particles { opacity: 0.35; }
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
    if (role === 'ADMIN') this.router.navigate(['/admin/dashboard']);
    else this.router.navigate(['/employee/profile']);
  }
}
