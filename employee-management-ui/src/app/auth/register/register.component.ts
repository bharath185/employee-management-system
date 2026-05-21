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
      <div class="register-card-wrapper">
        <nz-card class="register-card" nzBordered="false">
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
        </nz-card>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f2440 0%, var(--color-primary-500) 50%, #3a5a8f 100%);
      padding: 16px;
    }
    .register-card-wrapper {
      width: 100%;
      max-width: 460px;
    }
    .register-card {
      border-radius: var(--radius-lg);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
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
      font-weight: 600;
      color: var(--color-primary-500);
      margin: 0 0 8px;
    }
    .subtitle {
      color: #5f6368;
      font-size: 14px;
      margin: 0;
    }
    .register-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .register-button {
      margin-top: 8px;
    }
    .password-toggle {
      cursor: pointer;
      color: #999;
    }
    .error-message, .success-message {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
    }
    .error-message {
      color: #d32f2f;
      background: #fce4e4;
    }
    .success-message {
      color: #2e7d32;
      background: #e8f5e9;
    }
    .login-link {
      text-align: center;
      font-size: 14px;
      color: #666;
      margin-top: 8px;
    }
    .login-link a {
      color: var(--color-primary-500);
      text-decoration: none;
      font-weight: 500;
    }
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
