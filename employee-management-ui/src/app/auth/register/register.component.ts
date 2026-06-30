import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule
  ],
  template: `
    <div class="register-container">
      <div class="bg-light"></div>
      <div class="register-card-wrapper">
        <div class="register-card">
          <div class="register-header">
            <img src="assets/logo.png" alt="Company Logo" class="logo">
            <h1>Create Admin Account</h1>
            <p class="subtitle">First-time setup - Register the administrator</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
            <nz-form-item>
              <nz-form-control [nzErrorTip]="'Employee code is required'">
                <nz-input-group nzPrefixIcon="idcard">
                  <input nz-input formControlName="employeeCode" placeholder="Employee Code" />
                </nz-input-group>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-control [nzErrorTip]="'Username is required'">
                <nz-input-group nzPrefixIcon="user">
                  <input nz-input formControlName="username" placeholder="Username" />
                </nz-input-group>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-control [nzErrorTip]="'Password is required'">
                <nz-input-group nzPrefixIcon="lock" [nzSuffix]="passwordSuffix">
                  <input nz-input [type]="hidePassword ? 'password' : 'text'"
                         formControlName="password" placeholder="Password" />
                </nz-input-group>
                <ng-template #passwordSuffix>
                  <i nz-icon [nzType]="hidePassword ? 'eye-invisible' : 'eye'"
                     (click)="hidePassword = !hidePassword" class="password-toggle"></i>
                </ng-template>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-control [nzErrorTip]="'Passwords do not match'">
                <nz-input-group nzPrefixIcon="lock">
                  <input nz-input [type]="hidePassword ? 'password' : 'text'"
                         formControlName="confirmPassword" placeholder="Confirm Password" />
                </nz-input-group>
              </nz-form-control>
            </nz-form-item>

            <div *ngIf="errorMessage" class="error-message">
              <i nz-icon nzType="close-circle"></i>
              <span>{{ errorMessage }}</span>
            </div>

            <div *ngIf="successMessage" class="success-message">
              <i nz-icon nzType="check-circle"></i>
              <span>{{ successMessage }}</span>
            </div>

            <button nz-button nzType="primary" nzBlock nzSize="large"
                    class="register-button" [disabled]="registerForm.invalid || isLoading"
                    type="submit">
              <i nz-icon nzType="loading" *ngIf="isLoading"></i>
              <span *ngIf="!isLoading">Create Account</span>
            </button>

            <div class="login-link">
              Already have an account?
              <a routerLink="/auth/login">Sign in</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      position: relative;
      background: #f5f6fa;
    }
    .register-card-wrapper {
      width: 100%;
      max-width: 460px;
      position: relative;
      z-index: 2;
    }
    .register-card {
      padding: 36px;
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
    .register-header {
      text-align: center;
      margin-bottom: 28px;
    }
    .logo {
      width: 72px;
      height: auto;
      object-fit: contain;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 8px;
      letter-spacing: -0.3px;
    }
    .subtitle {
      color: #6c757d;
      font-size: 14px;
      margin: 0;
    }
    .register-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    :host ::ng-deep .ant-input-group-wrapper.ant-input-affix-wrapper {
      background: #ffffff !important;
      border: 1px solid #d1d5db !important;
      border-radius: 10px !important;
      padding: 0 14px !important;
      height: 44px;
      transition: all 0.2s ease;
    }
    :host ::ng-deep .ant-input-group-wrapper.ant-input-affix-wrapper:hover {
      border-color: #2563eb !important;
    }
    :host ::ng-deep .ant-input-group-wrapper.ant-input-affix-wrapper-focused,
    :host ::ng-deep .ant-input-group-wrapper.ant-input-affix-wrapper:focus {
      border-color: #2563eb !important;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
    }
    :host ::ng-deep .ant-input-group-wrapper .ant-input-prefix {
      color: #6c757d !important;
    }
    :host ::ng-deep .ant-input-group-wrapper input {
      background: transparent !important;
      color: #1a1a2e !important;
    }
    :host ::ng-deep .ant-input-group-wrapper input::placeholder {
      color: #9ca3af !important;
    }
    .register-button {
      margin-top: 8px;
      height: 46px;
      border-radius: 6px;
      border: none !important;
      background: #2563eb !important;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2) !important;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .register-button:not(:disabled):hover {
      background: #1d4ed8 !important;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3) !important;
    }
    .password-toggle {
      cursor: pointer;
      color: #6c757d;
    }
    .password-toggle:hover { color: #2563eb; }
    .error-message, .success-message {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      padding: 10px 12px;
      border-radius: 8px;
    }
    .error-message {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .error-message i { color: #ef4444; }
    .success-message {
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .success-message i { color: #10b981; }
    .login-link {
      text-align: center;
      font-size: 14px;
      color: #6c757d;
      margin-top: 8px;
    }
    .login-link a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }
    .login-link a:hover { color: #1d4ed8; text-decoration: underline; }
    @media (max-width: 480px) {
      .register-card {
        padding: 24px 16px;
      }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      employeeCode: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatchValidator });
  }

  passwordsMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirm = g.get('confirmPassword')?.value;
    if (password && confirm && password !== confirm) {
      g.get('confirmPassword')?.setErrors({ passwordsMismatch: true });
    } else {
      const errors = g.get('confirmPassword')?.errors;
      if (errors && errors['passwordsMismatch']) {
        const { passwordsMismatch, ...rest } = errors;
        g.get('confirmPassword')?.setErrors(Object.keys(rest).length ? rest : null);
      }
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      employeeCode: this.registerForm.value.employeeCode,
      username: this.registerForm.value.username,
      password: this.registerForm.value.password
    };

    this.http.post(`${environment.apiUrl}/auth/register`, payload).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Account created successfully! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/auth/login']), 2000);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
