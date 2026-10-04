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
    <div class="login-container">
      <!-- Full Page Ambient Grid Texture Overlay -->
      <div class="grid-texture"></div>

      <!-- Left Side: Infographic HRMS Showcase -->
      <div class="login-left-section">
        <div class="hero-header-text">
          <h2 class="hero-title">Smart Workforce & HR Operations</h2>
          <p class="hero-subtitle">
            Next-generation enterprise platform for automated payroll processing, real-time attendance, and AI-powered workforce analytics.
          </p>
        </div>

        <!-- INFOGRAPHIC SHOWCASE -->
        <div class="infographic-stage">
          <img src="assets/infographic.png" alt="HRMS Infographic Showcase" class="infographic-img">
        </div>

        <!-- Left Footer -->
        <div class="left-footer">
          <div class="features-mini-list">
            <span><i nz-icon nzType="safety-certificate"></i> Trust</span>
            <span>•</span>
            <span><i nz-icon nzType="customer-service"></i> Support</span>
            <span>•</span>
            <span><i nz-icon nzType="star"></i> Quality</span>
          </div>
          <span class="copyright-txt">&copy; 2026 PRIGENIX EMS. All Rights Reserved.</span>
        </div>
      </div>

      <!-- Right Side: Executive Glassmorphic Login Card -->
      <div class="login-right-section">
        <div class="login-card">
          <div class="card-header">
            <div class="logo-box">
              <img src="assets/logo-white.png" alt="Company Logo" class="card-logo">
            </div>
            <p class="card-subtitle">Sign in to access your HR workspace</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <div class="form-group">
              <label class="form-label">Username / Employee ID</label>
              <nz-input-group nzPrefixIcon="user" class="custom-input-group">
                <input nz-input formControlName="username" placeholder="Enter your username" autocomplete="username">
              </nz-input-group>
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <nz-input-group nzPrefixIcon="lock" [nzSuffix]="pwdSuffix" class="custom-input-group">
                <input nz-input [type]="hidePassword ? 'password' : 'text'"
                       formControlName="password" placeholder="Enter your password" autocomplete="current-password">
              </nz-input-group>
            </div>

            <div *ngIf="errorMessage" class="error-msg">
              <i nz-icon nzType="exclamation-circle" nzTheme="fill"></i>
              <span>{{ errorMessage }}</span>
            </div>

            <button nz-button nzType="primary" nzBlock class="submit-btn"
                    [disabled]="loginForm.invalid || isLoading" [nzLoading]="isLoading">
              Sign In
            </button>
          </form>

          <div class="card-footer">
            <p class="security-note">
              <i nz-icon nzType="safety-certificate" nzTheme="outline"></i>
              256-Bit SSL Encrypted Enterprise Portal
            </p>
            <div class="designed-by-tag">
              <span>Designed by</span>
              <img src="assets/logo_cmpny.png" alt="Branding Logo" class="designed-by-logo">
            </div>
          </div>
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
    /* FULL VIEWPORT UNIFIED BACKGROUND WITH MESH GRADIENT */
    .login-container {
      min-height: 100vh;
      display: flex;
      width: 100vw;
      background: radial-gradient(circle at 15% 20%, rgba(37, 99, 235, 0.35) 0%, transparent 45%),
                  radial-gradient(circle at 85% 80%, rgba(99, 102, 241, 0.3) 0%, transparent 50%),
                  radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%);
      position: relative;
      overflow-x: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    /* MICRO-DOT GRID TEXTURE SPANNING FULL PAGE */
    .grid-texture {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px);
      background-size: 26px 26px;
      pointer-events: none;
      z-index: 1;
    }

    /* LEFT SECTION: INFOGRAPHIC HRMS SHOWCASE */
    .login-left-section {
      flex: 1.35;
      background: transparent;
      color: #ffffff;
      padding: 36px 48px 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      z-index: 2;
    }

    .hero-header-text {
      z-index: 2;
      margin-top: 4px;
      margin-bottom: 0px;
    }

    .hero-title {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.3;
      margin-bottom: 8px;
      letter-spacing: -0.4px;
    }

    .hero-subtitle {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.55;
      margin: 0;
      max-width: 580px;
    }

    /* INFOGRAPHIC STAGE */
    .infographic-stage {
      z-index: 2;
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      flex: 1;
      margin-top: -30px;
    }

    .infographic-img {
      width: 100%;
      max-width: 780px;
      max-height: 560px;
      object-fit: contain;
      filter: drop-shadow(0 20px 45px rgba(0, 0, 0, 0.5));
      transition: transform 0.4s ease;
    }

    .infographic-img:hover {
      transform: scale(1.02) translateY(-4px);
    }

    /* Left Footer */
    .left-footer {
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      color: #64748b;
    }

    .features-mini-list {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #94a3b8;
      font-size: 12px;
    }

    .features-mini-list i {
      color: #38bdf8;
    }

    .copyright-txt {
      font-size: 11px;
      color: #64748b;
    }

    /* RIGHT SECTION: UNIFIED GLASSMORPHIC LOGIN CARD */
    .login-right-section {
      flex: 0.85;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 30px;
      background: transparent;
      z-index: 2;
    }

    .login-card {
      width: 100%;
      max-width: 370px;
      background: rgba(15, 23, 42, 0.82);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      padding: 32px 28px 24px;
      border-radius: 20px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.14);
      animation: fadeInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes fadeInRight {
      from { opacity: 0; transform: translateX(24px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .card-header {
      text-align: center;
      margin-bottom: 20px;
    }

    .logo-box {
      margin: 0 auto 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-logo {
      height: 72px;
      max-width: 250px;
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.5));
    }

    .card-subtitle {
      font-size: 13.5px;
      color: #94a3b8;
      margin: 0;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
    }

    :host ::ng-deep .custom-input-group.ant-input-affix-wrapper {
      border-radius: 12px;
      padding: 4px 14px;
      border: 1px solid rgba(255, 255, 255, 0.18) !important;
      transition: all 0.25s ease;
      background: rgba(15, 23, 42, 0.7) !important;
      height: 46px;
    }

    :host ::ng-deep .custom-input-group.ant-input-affix-wrapper:hover {
      border-color: #38bdf8 !important;
    }

    :host ::ng-deep .custom-input-group.ant-input-affix-wrapper-focused,
    :host ::ng-deep .custom-input-group.ant-input-affix-wrapper:focus {
      border-color: #38bdf8 !important;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.22) !important;
    }

    :host ::ng-deep .custom-input-group .ant-input-prefix {
      margin-right: 10px;
      color: #64748b;
      font-size: 16px;
    }

    :host ::ng-deep .custom-input-group input {
      background: transparent !important;
      font-size: 13.5px;
      color: #ffffff !important;
    }

    :host ::ng-deep .custom-input-group input::placeholder {
      color: #64748b;
    }

    /* WebKit Autofill Overrides to prevent light blue background */
    :host ::ng-deep input:-webkit-autofill,
    :host ::ng-deep input:-webkit-autofill:hover,
    :host ::ng-deep input:-webkit-autofill:focus,
    :host ::ng-deep input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0px 1000px #0f172a inset !important;
      -webkit-text-fill-color: #ffffff !important;
      caret-color: #ffffff !important;
      transition: background-color 5000s ease-in-out 0s;
    }

    .pwd-toggle {
      cursor: pointer;
      color: #64748b;
      font-size: 16px;
      transition: color 0.2s;
    }

    .pwd-toggle:hover {
      color: #38bdf8;
    }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #fca5a5;
      font-size: 13px;
      font-weight: 500;
      padding: 10px 14px;
      background: rgba(239, 68, 68, 0.15);
      border-radius: 10px;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .error-msg i {
      font-size: 16px;
      flex-shrink: 0;
      color: #f87171;
    }

    .submit-btn {
      height: 46px;
      font-size: 14.5px;
      font-weight: 600;
      letter-spacing: 0.3px;
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.45) !important;
      transition: all 0.25s ease;
      margin-top: 4px;
    }

    .submit-btn:not(:disabled):hover {
      background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%) !important;
      box-shadow: 0 6px 22px rgba(37, 99, 235, 0.55) !important;
      transform: translateY(-1px);
    }

    .card-footer {
      margin-top: 24px;
      text-align: center;
    }

    .security-note {
      font-size: 11.5px;
      color: #64748b;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .security-note i {
      color: #38bdf8;
    }

    .designed-by-tag {
      margin-top: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 11px;
      color: #64748b;
    }

    .designed-by-logo {
      height: 18px;
      width: auto;
      object-fit: contain;
      opacity: 0.9;
    }

    /* RESPONSIVE LAYOUT */
    @media (max-width: 1024px) {
      .login-left-section {
        padding: 28px;
      }
    }

    @media (max-width: 860px) {
      .login-left-section {
        display: none;
      }
      .login-right-section {
        flex: 1;
        padding: 24px;
      }
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 32px 22px 28px;
        border-radius: 16px;
      }
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
    if (this.authService.isAuthenticated()) {
      this.navigateToHome();
      return;
    }
    this.authService.pingServer().subscribe({
      next: () => {},
      error: () => {}
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response?.success) {
          this.navigateToHome();
        } else {
          this.errorMessage = response?.message || 'Invalid username or password';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = typeof error === 'string' ? error : (error?.message || 'Invalid username or password');
      }
    });
  }

  private navigateToHome(): void {
    const role = this.authService.getUserRole();
    if (role === 'ADMIN' || role === 'HR') this.router.navigate(['/admin/dashboard']);
    else this.router.navigate(['/employee/dashboard']);
  }
}
