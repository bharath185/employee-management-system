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
          <svg class="ill-svg" viewBox="0 0 560 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="orb1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#4a90d9" stop-opacity="0.12"/>
                <stop offset="100%" stop-color="#4a90d9" stop-opacity="0"/>
              </radialGradient>
              <radialGradient id="orb2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#1f3d6e" stop-opacity="0.08"/>
                <stop offset="100%" stop-color="#1f3d6e" stop-opacity="0"/>
              </radialGradient>
              <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="100%" stop-color="#f8faff"/>
              </linearGradient>
              <linearGradient id="barUp" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#4a90d9"/>
                <stop offset="100%" stop-color="#7bb3e8"/>
              </linearGradient>
              <filter id="cardShadow">
                <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#1f3d6e" flood-opacity="0.08"/>
              </filter>
            </defs>

            <!-- Background gradient orbs -->
            <circle cx="280" cy="220" r="230" fill="url(#orb1)" class="orb-float" style="animation-delay:0s"/>
            <circle cx="140" cy="100" r="170" fill="url(#orb2)" class="orb-float" style="animation-delay:2.5s;animation-direction:reverse"/>
            <circle cx="420" cy="340" r="150" fill="url(#orb1)" class="orb-float" style="animation-delay:5s;animation-duration:7s"/>
            <circle cx="350" cy="80" r="100" fill="url(#orb2)" class="orb-float" style="animation-delay:1.5s;animation-duration:6s"/>

            <!-- Connection network -->
            <g class="connections" opacity="0.15">
              <line x1="170" y1="140" x2="370" y2="120" stroke="#4a90d9" stroke-width="1.5" stroke-dasharray="4 3"/>
              <line x1="370" y1="120" x2="280" y2="260" stroke="#4a90d9" stroke-width="1.5" stroke-dasharray="4 3"/>
              <line x1="170" y1="140" x2="280" y2="260" stroke="#4a90d9" stroke-width="1.5" stroke-dasharray="4 3"/>
              <line x1="80" y1="260" x2="170" y2="140" stroke="#4a90d9" stroke-width="1" stroke-dasharray="3 3"/>
              <line x1="80" y1="260" x2="280" y2="260" stroke="#4a90d9" stroke-width="1" stroke-dasharray="3 3"/>
              <line x1="370" y1="120" x2="470" y2="200" stroke="#4a90d9" stroke-width="1" stroke-dasharray="3 3"/>
              <line x1="280" y1="260" x2="470" y2="200" stroke="#4a90d9" stroke-width="1" stroke-dasharray="3 3"/>
            </g>

            <!-- Moving dots -->
            <circle r="2.5" fill="#1f3d6e" opacity="0.5" class="dot-move" style="offset-path:path('M170,140 L370,120');animation-delay:0s"/>
            <circle r="2.5" fill="#4a90d9" opacity="0.5" class="dot-move" style="offset-path:path('M370,120 L280,260');animation-delay:1.5s"/>
            <circle r="2.5" fill="#1f3d6e" opacity="0.5" class="dot-move" style="offset-path:path('M170,140 L280,260');animation-delay:3s"/>
            <circle r="2" fill="#4a90d9" opacity="0.4" class="dot-move" style="offset-path:path('M80,260 L280,260');animation-delay:2s;animation-duration:3s"/>
            <circle r="2" fill="#1f3d6e" opacity="0.4" class="dot-move" style="offset-path:path('M370,120 L470,200');animation-delay:4s;animation-duration:3s"/>

            <!-- Card 1: People / Team -->
            <g class="feature-card card-1" filter="url(#cardShadow)" style="cursor:pointer">
              <rect x="90" y="100" width="180" height="85" rx="14" fill="url(#cardBg)" stroke="#e8edf5" stroke-width="1"/>
              <!-- Avatar group -->
              <circle cx="120" cy="126" r="10" fill="#1f3d6e" opacity="0.1"/>
              <circle cx="120" cy="126" r="10" fill="none" stroke="#fff" stroke-width="1.5"/>
              <circle cx="120" cy="126" r="6" fill="#4a90d9"/>
              <circle cx="120" cy="126" r="3" fill="#fff" opacity="0.4"/>
              <circle cx="140" cy="130" r="8" fill="#1f3d6e" opacity="0.08"/>
              <circle cx="140" cy="130" r="8" fill="none" stroke="#fff" stroke-width="1.5"/>
              <circle cx="140" cy="130" r="5" fill="#1f3d6e"/>
              <circle cx="140" cy="130" r="2.5" fill="#fff" opacity="0.4"/>
              <!-- + badge -->
              <circle cx="156" cy="126" r="10" fill="#4a90d9" opacity="0.12"/>
              <text x="156" y="129" text-anchor="middle" font-size="9" font-weight="700" fill="#4a90d9" font-family="system-ui">+2</text>
              <!-- Text -->
              <text x="123" y="152" font-size="11" font-weight="700" fill="#1f3d6e" font-family="system-ui">Team Members</text>
              <text x="123" y="168" font-size="9" fill="#8a94a6" font-family="system-ui">28 employees · 4 departments</text>
            </g>

            <!-- Card 2: Analytics -->
            <g class="feature-card card-2" filter="url(#cardShadow)" style="cursor:pointer">
              <rect x="310" y="80" width="170" height="90" rx="14" fill="url(#cardBg)" stroke="#e8edf5" stroke-width="1"/>
              <!-- Mini bar chart -->
              <g class="mini-chart">
                <rect x="332" y="127" width="10" height="22" rx="2" fill="#1f3d6e" opacity="0.6">
                  <animate attributeName="height" values="22;28;22" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="y" values="127;121;127" dur="2s" repeatCount="indefinite"/>
                </rect>
                <rect x="348" y="119" width="10" height="30" rx="2" fill="#4a90d9" opacity="0.8">
                  <animate attributeName="height" values="30;36;30" dur="2.5s" repeatCount="indefinite"/>
                  <animate attributeName="y" values="119;113;119" dur="2.5s" repeatCount="indefinite"/>
                </rect>
                <rect x="364" y="123" width="10" height="26" rx="2" fill="#1f3d6e" opacity="0.5">
                  <animate attributeName="height" values="26;20;26" dur="1.8s" repeatCount="indefinite"/>
                  <animate attributeName="y" values="123;129;123" dur="1.8s" repeatCount="indefinite"/>
                </rect>
                <rect x="380" y="115" width="10" height="34" rx="2" fill="#4a90d9" opacity="0.9">
                  <animate attributeName="height" values="34;40;34" dur="3s" repeatCount="indefinite"/>
                  <animate attributeName="y" values="115;109;115" dur="3s" repeatCount="indefinite"/>
                </rect>
                <rect x="396" y="120" width="10" height="29" rx="2" fill="#1f3d6e" opacity="0.4">
                  <animate attributeName="height" values="29;24;29" dur="2.2s" repeatCount="indefinite"/>
                  <animate attributeName="y" values="120;125;120" dur="2.2s" repeatCount="indefinite"/>
                </rect>
                <rect x="412" y="128" width="10" height="21" rx="2" fill="#4a90d9" opacity="0.5">
                  <animate attributeName="height" values="21;27;21" dur="1.5s" repeatCount="indefinite"/>
                  <animate attributeName="y" values="128;122;128" dur="1.5s" repeatCount="indefinite"/>
                </rect>
                <rect x="428" y="118" width="10" height="31" rx="2" fill="#1f3d6e" opacity="0.6">
                  <animate attributeName="height" values="31;25;31" dur="2.8s" repeatCount="indefinite"/>
                  <animate attributeName="y" values="118;124;118" dur="2.8s" repeatCount="indefinite"/>
                </rect>
              </g>
              <!-- Growth arrow -->
              <path d="M462,128 L458,120 L454,128" fill="none" stroke="#059669" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <text x="448" y="115" font-size="9" font-weight="600" fill="#059669" font-family="system-ui">+12.5%</text>
              <text x="330" y="155" font-size="11" font-weight="700" fill="#1f3d6e" font-family="system-ui">Revenue Analytics</text>
              <text x="330" y="170" font-size="9" fill="#8a94a6" font-family="system-ui">This quarter vs last quarter</text>
            </g>

            <!-- Card 3: Attendance / Calendar -->
            <g class="feature-card card-3" filter="url(#cardShadow)" style="cursor:pointer">
              <rect x="190" y="230" width="190" height="90" rx="14" fill="url(#cardBg)" stroke="#e8edf5" stroke-width="1"/>
              <!-- Mini calendar -->
              <rect x="210" y="247" width="30" height="30" rx="4" fill="#1f3d6e" opacity="0.06"/>
              <rect x="210" y="247" width="30" height="8" rx="2" fill="#1f3d6e" opacity="0.15"/>
              <text x="225" y="259" text-anchor="middle" font-size="6" fill="#8a94a6" font-family="system-ui">MAY</text>
              <text x="225" y="272" text-anchor="middle" font-size="12" font-weight="800" fill="#1f3d6e" font-family="system-ui">24</text>
              <!-- Donut chart -->
              <circle cx="290" cy="262" r="14" fill="none" stroke="#e8edf5" stroke-width="4"/>
              <circle cx="290" cy="262" r="14" fill="none" stroke="#4a90d9" stroke-width="4" stroke-dasharray="62 26" stroke-linecap="round" transform="rotate(-90 290 262)"/>
              <circle cx="290" cy="262" r="14" fill="none" stroke="#1f3d6e" stroke-width="4" stroke-dasharray="20 68" stroke-linecap="round" transform="rotate(110 290 262)"/>
              <text x="290" y="265" text-anchor="middle" font-size="7" font-weight="700" fill="#1f3d6e" font-family="system-ui">92%</text>
              <!-- Text -->
              <text x="210" y="296" font-size="11" font-weight="700" fill="#1f3d6e" font-family="system-ui">Attendance Overview</text>
              <text x="210" y="311" font-size="9" fill="#8a94a6" font-family="system-ui"><tspan fill="#059669" font-weight="600">Present</tspan> 184 · <tspan fill="#dc3545" font-weight="600">Absent</tspan> 8</text>
            </g>

            <!-- Card 4: AI Assistant (small) -->
            <g class="feature-card card-4" filter="url(#cardShadow)" style="cursor:pointer">
              <rect x="50" y="250" width="120" height="55" rx="12" fill="url(#cardBg)" stroke="#e8edf5" stroke-width="1"/>
              <!-- Robot head icon -->
              <rect x="68" y="260" width="16" height="14" rx="3" fill="#4a90d9" opacity="0.15"/>
              <rect x="68" y="260" width="16" height="14" rx="3" fill="none" stroke="#4a90d9" stroke-width="1.5"/>
              <!-- Antenna -->
              <line x1="76" y1="257" x2="76" y2="253" stroke="#4a90d9" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="76" cy="252" r="2" fill="#4a90d9" class="pulse-slow"/>
              <!-- Eyes -->
              <circle cx="72" cy="265" r="1.5" fill="#4a90d9"/>
              <circle cx="80" cy="265" r="1.5" fill="#4a90d9"/>
              <!-- Smile -->
              <path d="M72,271 Q76,274 80,271" fill="none" stroke="#4a90d9" stroke-width="1" stroke-linecap="round"/>
              <!-- Sparkle dots -->
              <circle cx="64" cy="258" r="1.5" fill="#4a90d9" opacity="0.4" class="pulse-slow" style="animation-delay:0.5s"/>
              <circle cx="88" cy="256" r="1" fill="#4a90d9" opacity="0.3" class="pulse-slow" style="animation-delay:1s"/>
              <text x="96" y="275" font-size="10" font-weight="700" fill="#1f3d6e" font-family="system-ui">AI Assistant</text>
              <text x="96" y="289" font-size="8" fill="#8a94a6" font-family="system-ui">Online ·帮你</text>
            </g>

            <!-- Card 5: Documents (small) -->
            <g class="feature-card card-5" filter="url(#cardShadow)" style="cursor:pointer">
              <rect x="400" y="240" width="110" height="55" rx="12" fill="url(#cardBg)" stroke="#e8edf5" stroke-width="1"/>
              <!-- Doc icon -->
              <rect x="417" y="253" width="12" height="16" rx="2" fill="none" stroke="#1f3d6e" stroke-width="1.5"/>
              <line x1="420" y1="259" x2="426" y2="259" stroke="#4a90d9" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="420" y1="263" x2="425" y2="263" stroke="#4a90d9" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="420" y1="267" x2="423" y2="267" stroke="#4a90d9" stroke-width="1.5" stroke-linecap="round"/>
              <!-- Progress bar -->
              <rect x="417" y="273" width="22" height="3" rx="1.5" fill="#e8edf5"/>
              <rect x="417" y="273" width="16" height="3" rx="1.5" fill="#4a90d9" class="progress-fill"/>
              <text x="446" y="267" font-size="10" font-weight="700" fill="#1f3d6e" font-family="system-ui">Docs</text>
              <text x="446" y="281" font-size="8" fill="#8a94a6" font-family="system-ui">73% done</text>
            </g>

          </svg>
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
      left: 25vw;
      top: 50%;
      transform: translate(-50%, calc(-50% - 15px));
      width: 680px;
      max-width: 46vw;
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
    .card-2 { animation-delay: 0.8s; }
    .card-3 { animation-delay: 1.6s; }
    .card-4 { animation-delay: 0.4s; }
    .card-5 { animation-delay: 2.4s; }

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

    /* Pulse slow for activity dots */
    .pulse-slow {
      animation: pulseSlow 2s ease-in-out infinite alternate;
    }
    @keyframes pulseSlow {
      from { opacity: 0.12; r: 2.5; }
      to { opacity: 0.25; r: 3.5; }
    }

    /* Progress bar fill animation */
    .progress-fill {
      animation: progressFill 2s ease-in-out infinite alternate;
    }
    @keyframes progressFill {
      from { width: 12px; }
      to { width: 20px; }
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
      filter: drop-shadow(0 4px 20px rgba(31,61,110,0.08));
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
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
      .left-illustration { left: 22vw; width: 480px; max-width: 40vw; }
    }
    @media (max-width: 1024px) {
      .left-illustration { left: 20vw; width: 400px; max-width: 36vw; }
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
