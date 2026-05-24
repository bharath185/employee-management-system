import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
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
    <div class="login-page" #pageRef>
      <div class="bg-gradient"></div>
      <div class="particles">
        <div class="particle" style="--s:4px;--l:5%;--c:rgba(31,61,110,.3);--d:18s;--dy:0s"></div>
        <div class="particle" style="--s:6px;--l:14%;--c:rgba(74,144,217,.2);--d:22s;--dy:3s"></div>
        <div class="particle" style="--s:3px;--l:22%;--c:#4a90d9;--d:26s;--dy:6s"></div>
        <div class="particle" style="--s:7px;--l:30%;--c:rgba(31,61,110,.15);--d:16s;--dy:1s"></div>
        <div class="particle" style="--s:5px;--l:40%;--c:#1f3d6e;--d:30s;--dy:9s"></div>
        <div class="particle" style="--s:8px;--l:54%;--c:rgba(31,61,110,.3);--d:24s;--dy:10s"></div>
        <div class="particle" style="--s:3px;--l:62%;--c:rgba(74,144,217,.2);--d:28s;--dy:5s"></div>
        <div class="particle" style="--s:6px;--l:70%;--c:#4a90d9;--d:17s;--dy:7s"></div>
        <div class="particle" style="--s:4px;--l:78%;--c:rgba(31,61,110,.15);--d:32s;--dy:11s"></div>
      </div>

      <div class="left-illustration" #illustrationRef>
        <div class="ill-content" [style.transform]="'translate(' + mx + 'px, ' + my + 'px)'">
          <svg class="ill-svg" viewBox="0 0 540 420" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="orb1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#4a90d9" stop-opacity="0.15"/>
                <stop offset="100%" stop-color="#4a90d9" stop-opacity="0"/>
              </radialGradient>
              <radialGradient id="orb2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#1f3d6e" stop-opacity="0.1"/>
                <stop offset="100%" stop-color="#1f3d6e" stop-opacity="0"/>
              </radialGradient>
              <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="100%" stop-color="#f8faff"/>
              </linearGradient>
              <filter id="cardShadow">
                <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#1f3d6e" flood-opacity="0.08"/>
              </filter>
              <filter id="cardShadowHover">
                <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#1f3d6e" flood-opacity="0.15"/>
              </filter>
            </defs>

            <!-- Background gradient orbs -->
            <circle cx="270" cy="210" r="220" fill="url(#orb1)" class="orb-float" style="animation-delay:0s"/>
            <circle cx="150" cy="100" r="160" fill="url(#orb2)" class="orb-float" style="animation-delay:2s;animation-direction:reverse"/>
            <circle cx="400" cy="320" r="140" fill="url(#orb1)" class="orb-float" style="animation-delay:4s;animation-duration:6s"/>

            <!-- Connection lines between cards -->
            <g class="connections" opacity="0.2">
              <line x1="185" y1="125" x2="355" y2="110" stroke="#4a90d9" stroke-width="1.5" stroke-dasharray="4 3"/>
              <line x1="355" y1="110" x2="270" y2="250" stroke="#4a90d9" stroke-width="1.5" stroke-dasharray="4 3"/>
              <line x1="185" y1="125" x2="270" y2="250" stroke="#4a90d9" stroke-width="1.5" stroke-dasharray="4 3"/>
            </g>

            <!-- Floating particle dots along connections -->
            <circle r="2.5" fill="#1f3d6e" opacity="0.4" class="dot-move" style="offset-path:path('M185,125 L355,110');animation-delay:0s"/>
            <circle r="2.5" fill="#4a90d9" opacity="0.4" class="dot-move" style="offset-path:path('M355,110 L270,250');animation-delay:1.5s"/>
            <circle r="2.5" fill="#1f3d6e" opacity="0.4" class="dot-move" style="offset-path:path('M185,125 L270,250');animation-delay:3s"/>

            <!-- Card 1: People / Team -->
            <g class="feature-card card-1" filter="url(#cardShadow)" style="cursor:pointer">
              <rect x="100" y="85" width="170" height="80" rx="14" fill="url(#cardBg)" stroke="#e8edf5" stroke-width="1"/>
              <!-- People icon -->
              <circle cx="130" cy="110" r="7" fill="#1f3d6e" opacity="0.3"/>
              <circle cx="155" cy="110" r="7" fill="#4a90d9" opacity="0.3"/>
              <circle cx="130" cy="110" r="5" fill="#1f3d6e"/>
              <circle cx="155" cy="110" r="5" fill="#4a90d9"/>
              <line x1="128" y1="133" x2="157" y2="133" stroke="#1f3d6e" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
              <text x="180" y="108" font-size="11" font-weight="700" fill="#1f3d6e" font-family="system-ui">Team</text>
              <text x="180" y="124" font-size="11" font-weight="700" fill="#1f3d6e" font-family="system-ui">Management</text>
              <text x="180" y="142" font-size="9" fill="#8a94a6" font-family="system-ui">128 active</text>
            </g>

            <!-- Card 2: Analytics -->
            <g class="feature-card card-2" filter="url(#cardShadow)" style="cursor:pointer">
              <rect x="280" y="70" width="160" height="80" rx="14" fill="url(#cardBg)" stroke="#e8edf5" stroke-width="1"/>
              <!-- Chart icon -->
              <rect x="300" y="100" width="6" height="18" rx="2" fill="#1f3d6e"/>
              <rect x="312" y="92" width="6" height="26" rx="2" fill="#4a90d9"/>
              <rect x="324" y="96" width="6" height="22" rx="2" fill="#1f3d6e"/>
              <rect x="336" y="86" width="6" height="32" rx="2" fill="#4a90d9"/>
              <text x="356" y="103" font-size="11" font-weight="700" fill="#1f3d6e" font-family="system-ui">Reports &</text>
              <text x="356" y="118" font-size="11" font-weight="700" fill="#1f3d6e" font-family="system-ui">Analytics</text>
              <text x="356" y="137" font-size="9" fill="#8a94a6" font-family="system-ui">+23% growth</text>
            </g>

            <!-- Card 3: Security / Documents -->
            <g class="feature-card card-3" filter="url(#cardShadow)" style="cursor:pointer">
              <rect x="190" y="210" width="180" height="80" rx="14" fill="url(#cardBg)" stroke="#e8edf5" stroke-width="1"/>
              <!-- Shield icon -->
              <path d="M220,238 L220,252 C220,252 230,258 240,252 L240,238 Z" fill="#1f3d6e" opacity="0.15"/>
              <path d="M220,238 L220,250 C220,250 230,256 240,250 L240,238 Z" fill="#4a90d9" opacity="0.4"/>
              <path d="M224,244 L228,248 L236,240" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
              <text x="256" y="243" font-size="11" font-weight="700" fill="#1f3d6e" font-family="system-ui">Documents &</text>
              <text x="256" y="258" font-size="11" font-weight="700" fill="#1f3d6e" font-family="system-ui">Compliance</text>
              <text x="256" y="276" font-size="9" fill="#8a94a6" font-family="system-ui">100% secure</text>
            </g>

            <!-- Decorative dots row -->
            <g class="deco-dots" opacity="0.15">
              <circle cx="200" cy="370" r="3" fill="#1f3d6e"/>
              <circle cx="220" cy="370" r="3" fill="#4a90d9"/>
              <circle cx="240" cy="370" r="3" fill="#1f3d6e"/>
              <circle cx="260" cy="370" r="3" fill="#4a90d9"/>
              <circle cx="280" cy="370" r="3" fill="#1f3d6e"/>
              <circle cx="300" cy="370" r="3" fill="#4a90d9"/>
              <circle cx="320" cy="370" r="3" fill="#1f3d6e"/>
            </g>

            <!-- Bottom accent bar -->
            <rect x="200" y="385" width="140" height="3" rx="1.5" fill="#1f3d6e" opacity="0.1"/>
          </svg>

          <!-- Bottom text -->
          <div class="ill-bottom">
            <span class="ill-title">Employee Management System</span>
            <span class="ill-sub">Streamline your workforce — manage employees, documents, and reports in one place</span>
          </div>
        </div>
      </div>
        </div>
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

    /* Left illustration */
    .left-illustration {
      position: absolute;
      left: 6vw;
      top: 50%;
      transform: translateY(-50%);
      width: 540px;
      max-width: 42vw;
      z-index: 2;
      animation: fadeInUp 0.6s 0.2s ease both;
      pointer-events: none;
    }
    .ill-content {
      transition: transform 0.15s ease-out;
      will-change: transform;
      pointer-events: auto;
    }
    .ill-svg {
      width: 100%;
      height: auto;
      display: block;
    }

    /* Floating gradient orbs */
    .orb-float {
      animation: orbFloat 8s ease-in-out infinite alternate;
    }
    @keyframes orbFloat {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(15px, -15px) scale(1.05); }
      100% { transform: translate(-10px, 10px) scale(0.95); }
    }

    /* Feature cards */
    .feature-card {
      transition: all 0.3s ease;
      animation: cardFloat 4s ease-in-out infinite;
    }
    .card-1 { animation-delay: 0s; }
    .card-2 { animation-delay: 1s; }
    .card-3 { animation-delay: 2s; }

    @keyframes cardFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }

    .feature-card:hover {
      filter: drop-shadow(0 8px 24px rgba(31,61,110,0.18)) !important;
    }
    .feature-card:hover rect:first-child {
      stroke: #4a90d9 !important;
      stroke-width: 1.5 !important;
    }

    /* Moving dots along connection paths */
    .dot-move {
      animation: dotTravel 4s linear infinite;
      offset-distance: 0%;
    }
    @keyframes dotTravel {
      0% { offset-distance: 0%; opacity: 0; }
      10% { opacity: 0.6; }
      90% { opacity: 0.6; }
      100% { offset-distance: 100%; opacity: 0; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .ill-content {
      transition: transform 0.15s ease-out;
      will-change: transform;
    }
    .ill-svg {
      width: 100%;
      height: auto;
      display: block;
      filter: drop-shadow(0 4px 20px rgba(31,61,110,0.08));
    }

    /* Chart bar animation */
    .chart-bars .bar {
      transform-origin: bottom;
      animation: barGrow 0.6s ease both;
    }
    .bar1 { animation-delay: 0.1s; }
    .bar2 { animation-delay: 0.2s; }
    .bar3 { animation-delay: 0.3s; }
    .bar4 { animation-delay: 0.4s; }
    .bar5 { animation-delay: 0.5s; }
    .bar6 { animation-delay: 0.6s; }
    .bar7 { animation-delay: 0.7s; }

    @keyframes barGrow {
      from { transform: scaleY(0); }
      to { transform: scaleY(1); }
    }

    /* Growth line drawing */
    @keyframes drawLine {
      to { stroke-dashoffset: 0; }
    }

    .area-fill {
      animation: areaFade 1s 1s ease both;
    }
    @keyframes areaFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Pulse dots */
    .pulse-dot {
      animation: pulse 2s ease infinite;
    }
    @keyframes pulse {
      0%, 100% { r: 4; opacity: 1; }
      50% { r: 7; opacity: 0.5; }
    }
    .pulse-dot:last-child {
      animation: pulse 2s ease infinite, glow 1.5s ease infinite;
    }
    @keyframes glow {
      0%, 100% { filter: drop-shadow(0 0 0 rgba(31,61,110,0)); }
      50% { filter: drop-shadow(0 0 6px rgba(31,61,110,0.4)); }
    }

    /* Network nodes */
    .net-node {
      cursor: pointer;
      transition: all 0.3s ease;
      animation: nodePulse 3s ease infinite;
    }
    @keyframes nodePulse {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }
    .net-node:hover {
      fill: #4a90d9;
      stroke: #1f3d6e;
      stroke-width: 2.5;
      filter: drop-shadow(0 0 8px rgba(74,144,217,0.5));
      transform-origin: center;
    }

    .net-line {
      transition: opacity 0.3s ease;
    }
    .net-node:hover ~ .net-line,
    .net-node:hover + .net-line {
      opacity: 0.6 !important;
    }

    /* Building window animation */
    .window-lit {
      animation: windowBlink 3s ease infinite;
    }
    @keyframes windowBlink {
      0%, 100% { opacity: 0.6; }
      30% { opacity: 0.3; }
      60% { opacity: 0.7; }
    }

    /* Stats labels animation */
    .stats-label {
      animation: floatLabel 4s ease-in-out infinite;
    }
    .stats-label2 {
      animation: floatLabel 4s ease-in-out 1s infinite;
    }
    @keyframes floatLabel {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }

    .ill-bottom {
      margin-top: 20px;
      text-align: center;
    }
    .ill-title {
      display: block;
      font-size: 18px;
      font-weight: 700;
      color: #1f3d6e;
      letter-spacing: -0.3px;
    }
    .ill-sub {
      display: block;
      font-size: 13px;
      color: #8a94a6;
      margin-top: 6px;
      line-height: 1.5;
    }

    /* Login card */
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

    @media (max-width: 1200px) {
      .left-illustration { left: 3vw; width: 420px; max-width: 38vw; }
    }
    @media (max-width: 1024px) {
      .left-illustration { width: 360px; max-width: 35vw; }
    }
    @media (max-width: 768px) {
      .login-page { justify-content: center; padding: 24px; }
      .left-illustration { display: none; }
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

  mx = 0;
  my = 0;

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

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    this.mx = x * 8;
    this.my = y * 8;
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
