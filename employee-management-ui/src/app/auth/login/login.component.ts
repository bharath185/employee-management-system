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
          <svg class="ill-svg" viewBox="0 0 520 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Gradient defs -->
            <defs>
              <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stop-color="#1f3d6e"/>
                <stop offset="100%" stop-color="#4a90d9"/>
              </linearGradient>
              <linearGradient id="barGrad2" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stop-color="#4a90d9"/>
                <stop offset="100%" stop-color="#7bb3e8"/>
              </linearGradient>
            </defs>

            <!-- Background -->
            <rect width="520" height="400" rx="20" fill="none"/>

            <!-- Grid lines -->
            <g stroke="#d0dbe8" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.4">
              <line x1="40" y1="340" x2="480" y2="340"/>
              <line x1="40" y1="295" x2="480" y2="295"/>
              <line x1="40" y1="250" x2="480" y2="250"/>
              <line x1="40" y1="205" x2="480" y2="205"/>
              <line x1="40" y1="160" x2="480" y2="160"/>
              <line x1="40" y1="115" x2="480" y2="115"/>
            </g>

            <!-- Y-axis label -->
            <text x="22" y="345" font-size="9" fill="#8a94a6" font-family="system-ui">0</text>
            <text x="22" y="250" font-size="9" fill="#8a94a6" font-family="system-ui">50</text>
            <text x="15" y="165" font-size="9" fill="#8a94a6" font-family="system-ui">100</text>

            <!-- Animated bars -->
            <g class="chart-bars">
              <rect class="bar bar1" x="70" y="290" width="30" height="50" rx="4" fill="url(#barGrad)" opacity="0.7"/>
              <rect class="bar bar2" x="120" y="270" width="30" height="70" rx="4" fill="url(#barGrad2)" opacity="0.7"/>
              <rect class="bar bar3" x="170" y="240" width="30" height="100" rx="4" fill="url(#barGrad)" opacity="0.7"/>
              <rect class="bar bar4" x="220" y="220" width="30" height="120" rx="4" fill="url(#barGrad2)" opacity="0.7"/>
              <rect class="bar bar5" x="270" y="200" width="30" height="140" rx="4" fill="url(#barGrad)" opacity="0.7"/>
              <rect class="bar bar6" x="320" y="190" width="30" height="150" rx="4" fill="url(#barGrad2)" opacity="0.7"/>
              <rect class="bar bar7" x="370" y="170" width="30" height="170" rx="4" fill="url(#barGrad)" opacity="0.7"/>
            </g>

            <!-- Growth line -->
            <polyline points="60,340 85,310 130,290 180,260 230,240 285,230 340,220 395,205 440,190"
                      fill="none" stroke="#1f3d6e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
                      class="growth-line" style="stroke-dasharray:500;stroke-dashoffset:500;animation:drawLine 2s 0.5s ease forwards"/>

            <!-- Area under growth line -->
            <path d="M60,340 L85,310 L130,290 L180,260 L230,240 L285,230 L340,220 L395,205 L440,190 L440,340 Z"
                  fill="url(#barGrad)" opacity="0.08" class="area-fill"/>

            <!-- Growth dots on line -->
            <circle cx="85" cy="310" r="4" fill="#1f3d6e" class="pulse-dot" style="animation-delay: 0.1s"/>
            <circle cx="180" cy="260" r="4" fill="#4a90d9" class="pulse-dot" style="animation-delay: 0.3s"/>
            <circle cx="285" cy="230" r="4" fill="#1f3d6e" class="pulse-dot" style="animation-delay: 0.5s"/>
            <circle cx="395" cy="205" r="4" fill="#4a90d9" class="pulse-dot" style="animation-delay: 0.7s"/>
            <circle cx="440" cy="190" r="5" fill="#1f3d6e" class="pulse-dot" style="animation-delay: 0.9s"/>

            <!-- Network nodes -->
            <g class="network">
              <line x1="80" y1="130" x2="150" y2="100" stroke="#4a90d9" stroke-width="1" opacity="0.25" class="net-line"/>
              <line x1="150" y1="100" x2="250" y2="80" stroke="#4a90d9" stroke-width="1" opacity="0.25" class="net-line"/>
              <line x1="80" y1="130" x2="200" y2="150" stroke="#4a90d9" stroke-width="1" opacity="0.25" class="net-line"/>
              <line x1="200" y1="150" x2="250" y2="80" stroke="#4a90d9" stroke-width="1" opacity="0.25" class="net-line"/>
              <line x1="250" y1="80" x2="350" y2="110" stroke="#4a90d9" stroke-width="1" opacity="0.25" class="net-line"/>
              <line x1="200" y1="150" x2="350" y2="110" stroke="#4a90d9" stroke-width="1" opacity="0.25" class="net-line"/>
              <line x1="350" y1="110" x2="420" y2="80" stroke="#4a90d9" stroke-width="1" opacity="0.25" class="net-line"/>
              <line x1="80" y1="130" x2="420" y2="80" stroke="#4a90d9" stroke-width="1" opacity="0.15" class="net-line"/>

              <circle cx="80" cy="130" r="8" fill="#fff" stroke="#1f3d6e" stroke-width="2" class="net-node" style="animation-delay:0s"/>
              <circle cx="150" cy="100" r="6" fill="#fff" stroke="#4a90d9" stroke-width="1.5" class="net-node" style="animation-delay:0.15s"/>
              <circle cx="250" cy="80" r="9" fill="#fff" stroke="#1f3d6e" stroke-width="2" class="net-node" style="animation-delay:0.3s"/>
              <circle cx="200" cy="150" r="5" fill="#fff" stroke="#4a90d9" stroke-width="1.5" class="net-node" style="animation-delay:0.45s"/>
              <circle cx="350" cy="110" r="7" fill="#fff" stroke="#1f3d6e" stroke-width="2" class="net-node" style="animation-delay:0.6s"/>
              <circle cx="420" cy="80" r="6" fill="#fff" stroke="#4a90d9" stroke-width="1.5" class="net-node" style="animation-delay:0.75s"/>
            </g>

            <!-- Office building -->
            <g class="building" transform="translate(445,200)">
              <rect x="0" y="20" width="50" height="140" rx="3" fill="#1a3a5c" opacity="0.15"/>
              <rect x="0" y="20" width="50" height="140" rx="3" fill="none" stroke="#1a3a5c" stroke-width="1" opacity="0.2"/>
              <rect x="6" y="28" width="10" height="10" rx="1" fill="#4a90d9" opacity="0.6" class="window-lit"/>
              <rect x="22" y="28" width="10" height="10" rx="1" fill="#4a90d9" opacity="0.6" class="window-lit" style="animation-delay:0.2s"/>
              <rect x="38" y="28" width="10" height="10" rx="1" fill="#4a90d9" opacity="0.6" class="window-lit" style="animation-delay:0.5s"/>
              <rect x="6" y="44" width="10" height="10" rx="1" fill="#4a90d9" opacity="0.3" class="window-lit" style="animation-delay:0.8s"/>
              <rect x="22" y="44" width="10" height="10" rx="1" fill="#4a90d9" opacity="0.6" class="window-lit" style="animation-delay:1.1s"/>
              <rect x="38" y="44" width="10" height="10" rx="1" fill="#4a90d9" opacity="0.3" class="window-lit" style="animation-delay:1.4s"/>
              <rect x="6" y="60" width="10" height="10" rx="1" fill="#4a90d9" opacity="0.6" class="window-lit" style="animation-delay:0.4s"/>
              <rect x="22" y="60" width="10" height="10" rx="1" fill="#4a90d9" opacity="0.3" class="window-lit" style="animation-delay:0.7s"/>
              <rect x="38" y="60" width="10" height="10" rx="1" fill="#4a90d9" opacity="0.6" class="window-lit" style="animation-delay:1.0s"/>
              <rect x="6" y="76" width="10" height="10" rx="1" fill="#4a90d9" opacity="0.3" class="window-lit" style="animation-delay:0.3s"/>
              <rect x="22" y="76" width="10" height="10" rx="1" fill="#4a90d9" opacity="0.6" class="window-lit" style="animation-delay:0.6s"/>
              <rect x="38" y="76" width="10" height="10" rx="1" fill="#4a90d9" opacity="0.3" class="window-lit" style="animation-delay:0.9s"/>
              <rect x="6" y="92" width="10" height="10" rx="1" fill="#4a90d9" opacity="0.6" class="window-lit" style="animation-delay:1.2s"/>
              <rect x="22" y="92" width="10" height="10" rx="1" fill="#4a90d9" opacity="0.3" class="window-lit" style="animation-delay:0.1s"/>
              <rect x="38" y="92" width="10" height="10" rx="1" fill="#4a90d9" opacity="0.6" class="window-lit" style="animation-delay:0.5s"/>
              <!-- Door -->
              <rect x="18" y="130" width="14" height="30" rx="2" fill="#0f2740" opacity="0.3"/>
            </g>

            <!-- Floating label -->
            <g class="stats-label" transform="translate(60,80)">
              <rect x="0" y="0" width="100" height="28" rx="14" fill="#fff" stroke="#1f3d6e" stroke-width="1" opacity="0.9"/>
              <text x="50" y="18" text-anchor="middle" font-size="11" font-weight="700" fill="#1f3d6e" font-family="system-ui">120 Employees</text>
            </g>
            <g class="stats-label2" transform="translate(310,145)">
              <rect x="0" y="0" width="88" height="24" rx="12" fill="#fff" stroke="#4a90d9" stroke-width="1" opacity="0.9"/>
              <text x="44" y="16" text-anchor="middle" font-size="10" font-weight="600" fill="#4a90d9" font-family="system-ui">95% Present</text>
            </g>

            <!-- X-axis labels -->
            <text x="85" y="360" text-anchor="middle" font-size="8" fill="#8a94a6" font-family="system-ui">Jan</text>
            <text x="165" y="360" text-anchor="middle" font-size="8" fill="#8a94a6" font-family="system-ui">Mar</text>
            <text x="245" y="360" text-anchor="middle" font-size="8" fill="#8a94a6" font-family="system-ui">May</text>
            <text x="325" y="360" text-anchor="middle" font-size="8" fill="#8a94a6" font-family="system-ui">Jul</text>
            <text x="405" y="360" text-anchor="middle" font-size="8" fill="#8a94a6" font-family="system-ui">Sep</text>
          </svg>

          <!-- Bottom text -->
          <div class="ill-bottom">
            <span class="ill-title">Employee Management System</span>
            <span class="ill-sub">Streamline your workforce — manage employees, documents, and reports in one place</span>
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
      left: 60px;
      top: 50%;
      transform: translateY(-50%);
      width: 520px;
      max-width: 45vw;
      z-index: 2;
      animation: fadeInUp 0.6s 0.2s ease both;
      pointer-events: none;
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

    @media (max-width: 1024px) {
      .left-illustration { left: 30px; width: 400px; max-width: 40vw; }
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
