import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Subject, takeUntil } from 'rxjs';
import { Text2SqlService } from '../../core/services/text2sql.service';
import { ChatMessage } from '../../core/models/text2sql.model';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzInputModule, NzIconModule, NzTableModule, NzSpinModule
  ],
  template: `
    <div class="chat-widget-wrapper"
      [style.left.px]="posX"
      [style.top.px]="posY">

      <!-- Floating bot button (Draggable) -->
      <button class="chat-fab"
        [class.open]="isOpen"
        [class.dragging]="isDragging"
        (mousedown)="onMouseDown($event)"
        (touchstart)="onTouchStart($event)"
        (click)="onFabClick($event)"
        [attr.aria-label]="isOpen ? 'Close chat' : 'Open chat'">
        <img *ngIf="!isOpen" src="assets/chatbot.png" alt="Chat" class="fab-icon" draggable="false">
        <i *ngIf="isOpen" nz-icon nzType="close"></i>
      </button>

      <!-- Chat panel -->
      <div class="chat-panel"
        [class.open]="isOpen"
        [class.open-up]="openUpward"
        [class.open-down]="!openUpward"
        [class.open-left]="openLeftward"
        [class.open-right]="!openLeftward">

        <div class="chat-header">
          <div class="header-brand">
            <img src="assets/chatbot.png" alt="Chat" class="header-icon">
            <div class="header-text">
              <span class="header-title">EMS Assistant</span>
              <span class="header-status"><span class="status-dot"></span> Online</span>
            </div>
          </div>
          <button class="chat-close-btn" (click)="isOpen = false" aria-label="Close chat">
            <i nz-icon nzType="minus"></i>
          </button>
        </div>

        <div class="chat-messages" #messageContainer>
          <div class="welcome-msg" *ngIf="messages.length === 0">
            <div class="welcome-avatar">
              <img src="assets/chatbot.png" alt="Assistant" class="welcome-icon">
            </div>
            <h3>Hi there! 👋</h3>
            <p>I'm your EMS smart HR assistant. Ask me anything about employees, attendance, leaves, payroll, or holidays!</p>
            <div class="suggestions">
              <button class="suggest-chip" *ngFor="let s of suggestions" (click)="ask(s)">{{ s }}</button>
            </div>
          </div>

          <div *ngFor="let msg of messages" class="message-row"
            [class.user-row]="msg.type === 'user'"
            [class.bot-row]="msg.type === 'bot'"
            [class.error-row]="msg.type === 'error'">

            <div class="msg-avatar" *ngIf="msg.type === 'bot'">
              <img src="assets/chatbot.png" alt="Bot">
            </div>

            <div class="msg-bubble-container">
              <div class="msg-bubble" [class.user-bubble]="msg.type === 'user'" [class.bot-bubble]="msg.type === 'bot'">
                <!-- Rendered rich markdown content -->
                <div class="msg-text" [innerHTML]="sanitizeHtml(msg.content)"></div>

                <!-- Subtle expandable raw records toggle -->
                <div *ngIf="msg.type === 'bot' && msg.data?.rows?.length && msg.data!.rows.length > 1" class="raw-data-section">
                  <button class="raw-toggle-btn" (click)="msg.showRaw = !msg.showRaw">
                    <i nz-icon [nzType]="msg.showRaw ? 'up' : 'table'"></i>
                    {{ msg.showRaw ? 'Hide database records' : 'View ' + msg.data!.rows.length + ' raw records' }}
                  </button>
                  <div *ngIf="msg.showRaw" class="result-table-wrapper">
                    <nz-table [nzData]="msg.data!.rows" [nzFrontPagination]="false"
                      [nzShowPagination]="msg.data!.rows.length > 8"
                      [nzPageSize]="8" nzSize="small">
                      <thead>
                        <tr>
                          <th nz-th *ngFor="let col of msg.data!.columns">{{ col }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let row of msg.data!.rows">
                          <td nz-td *ngFor="let col of msg.data!.columns">{{ row[col] }}</td>
                        </tr>
                      </tbody>
                    </nz-table>
                  </div>
                </div>

                <div class="msg-time">{{ msg.timestamp | date:'shortTime' }}</div>
              </div>
            </div>
          </div>

          <div *ngIf="isLoading" class="message-row bot-row">
            <div class="msg-avatar">
              <img src="assets/chatbot.png" alt="Bot">
            </div>
            <div class="msg-bubble bot-bubble loading-bubble">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
          </div>
        </div>

        <div class="chat-input-container">
          <input nz-input [(ngModel)]="userInput" placeholder="Ask in natural language..."
            (keyup.enter)="sendMessage()" [disabled]="isLoading">
          <button class="send-btn" (click)="sendMessage()"
            [disabled]="!userInput.trim() || isLoading">
            <i nz-icon nzType="send"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .chat-widget-wrapper {
      position: fixed;
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      user-select: none;
    }

    .chat-fab {
      width: 62px;
      height: 62px;
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
      position: relative;
      padding: 0;
      touch-action: none;
      filter: drop-shadow(0 6px 16px rgba(0,0,0,0.18));
    }
    .chat-fab:hover { transform: scale(1.08); filter: drop-shadow(0 8px 22px rgba(0,0,0,0.25)); }
    .chat-fab.dragging {
      cursor: grabbing !important;
      transform: scale(1.15) !important;
      filter: drop-shadow(0 12px 28px rgba(0,0,0,0.35));
    }
    .chat-fab.open { transform: rotate(90deg); }
    .chat-fab.open i { font-size: 28px; color: #555; }
    .fab-icon { width: 54px; height: 54px; object-fit: contain; pointer-events: none; -webkit-user-drag: none; }

    .chat-panel {
      position: absolute;
      width: 440px;
      max-height: 620px;
      height: 560px;
      background: #ffffff;
      border-radius: 18px;
      box-shadow: 0 16px 48px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.34, 1.3, 0.64, 1);
      user-select: auto;
    }

    /* Directional orientation based on screen position */
    .chat-panel.open-up { bottom: 74px; }
    .chat-panel.open-down { top: 74px; }
    .chat-panel.open-left { right: 0; }
    .chat-panel.open-right { left: 0; }

    .chat-panel.open-up.open-left { transform-origin: bottom right; transform: translateY(16px) scale(0.95); }
    .chat-panel.open-up.open-right { transform-origin: bottom left; transform: translateY(16px) scale(0.95); }
    .chat-panel.open-down.open-left { transform-origin: top right; transform: translateY(-16px) scale(0.95); }
    .chat-panel.open-down.open-right { transform-origin: top left; transform: translateY(-16px) scale(0.95); }

    .chat-panel.open {
      opacity: 1;
      transform: translateY(0) scale(1) !important;
      pointer-events: all;
    }

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      background: linear-gradient(135deg, #1e3a8a, #2563eb);
      color: #fff;
    }
    .header-brand { display: flex; align-items: center; gap: 10px; }
    .header-icon { width: 32px; height: 32px; object-fit: contain; }
    .header-text { display: flex; flex-direction: column; }
    .header-title { font-size: 15px; font-weight: 700; letter-spacing: -0.2px; line-height: 1.2; }
    .header-status { font-size: 11px; color: #93c5fd; display: flex; align-items: center; gap: 5px; margin-top: 2px; }
    .status-dot { width: 7px; height: 7px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 8px #4ade80; }
    .chat-close-btn {
      background: rgba(255,255,255,0.15);
      border: none;
      color: #fff;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .chat-close-btn:hover { background: rgba(255,255,255,0.3); }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: #f8fafc;
    }
    .chat-messages::-webkit-scrollbar { width: 5px; }
    .chat-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

    .welcome-msg {
      text-align: center;
      padding: 24px 16px 16px;
      color: #475569;
    }
    .welcome-avatar {
      width: 56px;
      height: 56px;
      margin: 0 auto 12px;
      background: #eff6ff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);
    }
    .welcome-icon { width: 38px; height: 38px; object-fit: contain; }
    .welcome-msg h3 { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
    .welcome-msg p { font-size: 13px; margin: 0 0 16px; line-height: 1.5; color: #64748b; }
    .suggestions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
    .suggest-chip {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #1e40af;
      font-size: 12px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .suggest-chip:hover {
      background: #eff6ff;
      border-color: #93c5fd;
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(37, 99, 235, 0.12);
    }

    .message-row { display: flex; gap: 8px; max-width: 92%; }
    .user-row { align-self: flex-end; flex-direction: row-reverse; }
    .bot-row { align-self: flex-start; }
    .msg-avatar { width: 30px; height: 30px; flex-shrink: 0; margin-top: 2px; }
    .msg-avatar img { width: 100%; height: 100%; object-fit: contain; }

    .msg-bubble-container { display: flex; flex-direction: column; }
    .msg-bubble {
      padding: 12px 15px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.55;
      word-wrap: break-word;
    }
    .user-bubble {
      background: linear-gradient(135deg, #1e40af, #2563eb);
      color: #ffffff;
      border-bottom-right-radius: 4px;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
    }
    .bot-bubble {
      background: #ffffff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
    }
    .error-row .msg-bubble { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

    .msg-time { font-size: 10px; color: #94a3b8; margin-top: 4px; text-align: right; }
    .user-bubble .msg-time { color: rgba(255,255,255,0.7); }

    /* Rich Markdown Elements Inside Message */
    :host ::ng-deep .msg-section-card {
      background: #f8fafc;
      border-left: 3px solid #2563eb;
      padding: 6px 10px;
      border-radius: 0 6px 6px 0;
      margin: 8px 0 6px;
      font-weight: 700;
      font-size: 12px;
      color: #1e3a8a;
    }
    :host ::ng-deep .code-pill {
      background: #f1f5f9;
      color: #0f172a;
      padding: 1px 6px;
      border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
      font-weight: 600;
      border: 1px solid #e2e8f0;
    }
    :host ::ng-deep strong { color: #0f172a; font-weight: 600; }
    :host ::ng-deep .user-bubble strong { color: #ffffff; }

    /* Raw table toggle */
    .raw-data-section { margin-top: 10px; border-top: 1px dashed #e2e8f0; padding-top: 8px; }
    .raw-toggle-btn {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #475569;
      font-size: 11px;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s;
    }
    .raw-toggle-btn:hover { background: #e2e8f0; color: #0f172a; }
    .result-table-wrapper {
      margin-top: 8px;
      max-height: 180px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
    }
    :host ::ng-deep .ant-table-thead > tr > th { padding: 4px 8px; font-size: 10px; font-weight: 700; color: #1e3a8a; background: #f1f5f9; border-bottom: 1px solid #cbd5e1 !important; }
    :host ::ng-deep .ant-table-tbody > tr > td { padding: 4px 8px; font-size: 11px; color: #334155; border-bottom: 1px solid #f1f5f9; }

    /* Loading dots animation */
    .loading-bubble { display: flex; align-items: center; gap: 4px; padding: 12px 18px; }
    .typing-dot {
      width: 6px;
      height: 6px;
      background: #3b82f6;
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out both;
    }
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes typing {
      0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }

    .chat-input-container {
      display: flex;
      gap: 8px;
      padding: 12px 14px;
      border-top: 1px solid #f1f5f9;
      background: #ffffff;
      align-items: center;
    }
    .chat-input-container input {
      flex: 1;
      border-radius: 24px;
      padding: 8px 16px;
      font-size: 13px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
    }
    .chat-input-container input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }
    .send-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: #2563eb;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .send-btn:hover:not(:disabled) { background: #1d4ed8; transform: scale(1.05); }
    .send-btn:disabled { background: #cbd5e1; cursor: not-allowed; }

    @media (max-width: 480px) {
      .chat-panel { width: calc(100vw - 32px); height: 75vh; }
      .chat-panel.open-left { right: -8px; }
      .chat-panel.open-right { left: -8px; }
    }
  `]
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  posX = 0;
  posY = 0;
  isDragging = false;
  private hasMoved = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialPosX = 0;
  private initialPosY = 0;

  isOpen = false;
  isLoading = false;
  userInput = '';
  messages: (ChatMessage & { data?: any; showRaw?: boolean })[] = [];

  suggestions = [
    'Who is absent today?',
    'Who earned comp off COG?',
    'Who took comp off COT?',
    'Total active employees',
    'Leave balance of PARI0001',
    'Upcoming holidays'
  ];

  private destroy$ = new Subject<void>();
  private msgId = 0;

  constructor(
    private text2SqlService: Text2SqlService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.initPosition();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get openUpward(): boolean {
    return this.posY > 350;
  }

  get openLeftward(): boolean {
    return this.posX > 440;
  }

  private initPosition(): void {
    const saved = localStorage.getItem('chatbot_fab_pos');
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        if (typeof pos.x === 'number' && typeof pos.y === 'number') {
          this.posX = pos.x;
          this.posY = pos.y;
        }
      } catch (e) {}
    }
    if (!this.posX && !this.posY) {
      this.posX = Math.max(10, window.innerWidth - 64 - 24);
      this.posY = Math.max(10, window.innerHeight - 64 - 24);
    }
    this.clampPosition();
  }

  private clampPosition(): void {
    const maxW = Math.max(10, window.innerWidth - 68);
    const maxH = Math.max(10, window.innerHeight - 68);
    this.posX = Math.max(10, Math.min(this.posX, maxW));
    this.posY = Math.max(10, Math.min(this.posY, maxH));
  }

  private savePosition(): void {
    localStorage.setItem('chatbot_fab_pos', JSON.stringify({ x: this.posX, y: this.posY }));
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.clampPosition();
  }

  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    this.startDrag(event.clientX, event.clientY);
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.startDrag(event.touches[0].clientX, event.touches[0].clientY);
    }
  }

  private startDrag(clientX: number, clientY: number): void {
    this.isDragging = true;
    this.hasMoved = false;
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.initialPosX = this.posX;
    this.initialPosY = this.posY;

    const onMove = (e: MouseEvent) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        this.hasMoved = true;
      }
      this.posX = this.initialPosX + dx;
      this.posY = this.initialPosY + dy;
      this.clampPosition();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.dragStartX;
      const dy = e.touches[0].clientY - this.dragStartY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        this.hasMoved = true;
      }
      this.posX = this.initialPosX + dx;
      this.posY = this.initialPosY + dy;
      this.clampPosition();
    };

    const onEnd = () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.savePosition();
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  }

  onFabClick(event: MouseEvent): void {
    if (this.hasMoved) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.toggleChat();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  ask(suggestion: string): void {
    this.userInput = suggestion;
    this.sendMessage();
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    this.addMessage('user', text);
    this.userInput = '';
    this.isLoading = true;
    this.scrollToBottom();

    this.text2SqlService.query({ question: text })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.data) {
            const botMsg = response.data.message || response.data.explanation || 'Here is what I found for you!';
            this.addBotMessage(this.formatMarkdown(botMsg), response.data);
          } else {
            this.addMessage('error', response.data?.errorMessage || response.message || 'Sorry, I ran into an issue finding that data.');
          }
          this.scrollToBottom();
        },
        error: (err) => {
          this.isLoading = false;
          const msg = err.error?.message || err.message || 'Network connection issue. Please check your connection.';
          this.addMessage('error', msg);
          this.scrollToBottom();
        }
      });
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  private formatMarkdown(text: string): string {
    if (!text) return '';

    let res = text;

    // Headers
    res = res.replace(/^### (.*$)/gim, '<div class="msg-section-card">$1</div>');
    res = res.replace(/^📌 (.*$)/gim, '<div class="msg-section-card">📌 $1</div>');
    res = res.replace(/^📞 (.*$)/gim, '<div class="msg-section-card">📞 $1</div>');
    res = res.replace(/^🏦 (.*$)/gim, '<div class="msg-section-card">🏦 $1</div>');
    res = res.replace(/^🪪 (.*$)/gim, '<div class="msg-section-card">🪪 $1</div>');
    res = res.replace(/^💵 (.*$)/gim, '<div class="msg-section-card">💵 $1</div>');
    res = res.replace(/^💰 (.*$)/gim, '<div class="msg-section-card">💰 $1</div>');

    // Bold & Italics
    res = res.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    res = res.replace(/\*([^\*]+?)\*/g, '<em>$1</em>');

    // Code pill
    res = res.replace(/`([^`]+?)`/g, '<span class="code-pill">$1</span>');

    // Line breaks
    res = res.replace(/\n\n/g, '<div style="height: 8px;"></div>');
    res = res.replace(/\n/g, '<br>');

    return res;
  }

  private addMessage(type: ChatMessage['type'], content: string): void {
    this.messages.push({
      id: `msg-${++this.msgId}`,
      type,
      content,
      timestamp: new Date()
    });
  }

  private addBotMessage(content: string, data: any): void {
    this.messages.push({
      id: `msg-${++this.msgId}`,
      type: 'bot',
      content,
      timestamp: new Date(),
      data: { ...data },
      showRaw: false
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageContainer) {
        const el = this.messageContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }
}

