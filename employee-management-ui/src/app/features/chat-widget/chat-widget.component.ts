import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
          <img src="assets/chatbot.png" alt="Chat" class="header-icon">
          <span>Ask about your data</span>
          <button class="chat-back-btn" (click)="isOpen = false" aria-label="Back to menu">
            <i nz-icon nzType="arrow-left"></i> Back
          </button>
        </div>

        <div class="chat-messages" #messageContainer>
          <div class="welcome-msg" *ngIf="messages.length === 0">
            <img src="assets/chatbot.png" alt="Chat" class="welcome-icon">
            <p>Ask questions about your employee data in plain English!</p>
            <div class="suggestions">
              <button nz-button nzSize="small" nzType="default"
                *ngFor="let s of suggestions" (click)="ask(s)">{{ s }}</button>
            </div>
          </div>

          <div *ngFor="let msg of messages" class="message"
            [class.user-msg]="msg.type === 'user'"
            [class.bot-msg]="msg.type === 'bot'"
            [class.error-msg]="msg.type === 'error'"
            [class.sql-msg]="msg.type === 'sql'">

            <div class="msg-bubble">
              <div class="msg-text" [innerHTML]="msg.content"></div>

              <!-- Results table (secondary, shown alongside conversational message) -->
              <div *ngIf="msg.type === 'bot' && msg.data?.rows?.length" class="result-section">
                <div class="result-table-wrapper">
                  <nz-table [nzData]="msg.data!.rows" [nzFrontPagination]="false"
                    [nzShowPagination]="msg.data!.rows.length > 10"
                    [nzPageSize]="10" nzSize="small">
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

              <div class="msg-time">{{ msg.timestamp | date:'HH:mm' }}</div>
            </div>
          </div>

          <div *ngIf="isLoading" class="message bot-msg">
            <div class="msg-bubble loading-bubble">
              <nz-spin nzSimple [nzSize]="'small'"></nz-spin>
              <span>Thinking...</span>
            </div>
          </div>
        </div>

        <div class="chat-input">
          <input nz-input [(ngModel)]="userInput" placeholder="Ask a question..."
            (keyup.enter)="sendMessage()" [disabled]="isLoading">
          <button nz-button nzType="primary" nzSize="small" (click)="sendMessage()"
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      user-select: none;
    }

    .chat-fab {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      position: relative;
      padding: 0;
      touch-action: none;
    }
    .chat-fab:hover { transform: scale(1.08); }
    .chat-fab.dragging {
      cursor: grabbing !important;
      transform: scale(1.15) !important;
      filter: drop-shadow(0 8px 24px rgba(0,0,0,0.3));
    }
    .chat-fab.open { transform: rotate(90deg); }
    .chat-fab.open i { font-size: 32px; color: #666; }
    .fab-icon { width: 52px; height: 52px; object-fit: contain; pointer-events: none; -webkit-user-drag: none; }
    .header-icon { width: 24px; height: 24px; object-fit: contain; }

    .chat-panel {
      position: absolute;
      width: 420px;
      max-height: 580px;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
      user-select: auto;
    }

    /* Position panel relative to FAB */
    .chat-panel.open-up { bottom: 70px; }
    .chat-panel.open-down { top: 70px; }
    .chat-panel.open-left { right: 0; }
    .chat-panel.open-right { left: 0; }

    .chat-panel.open-up.open-left { transform-origin: bottom right; transform: translateY(16px) scale(0.96); }
    .chat-panel.open-up.open-right { transform-origin: bottom left; transform: translateY(16px) scale(0.96); }
    .chat-panel.open-down.open-left { transform-origin: top right; transform: translateY(-16px) scale(0.96); }
    .chat-panel.open-down.open-right { transform-origin: top left; transform: translateY(-16px) scale(0.96); }

    .chat-panel.open {
      opacity: 1;
      transform: translateY(0) scale(1) !important;
      pointer-events: all;
    }

    .chat-header { display: flex; align-items: center; gap: 8px; padding: 14px 16px; background: linear-gradient(135deg, #1f3d6e, #2a5298); color: #fff; font-size: 14px; font-weight: 600; }
    .chat-header i { font-size: 18px; }
    .chat-header span { flex: 1; }
    .chat-back-btn { background: rgba(255,255,255,0.15); border: none; color: #fff; padding: 3px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 12px; white-space: nowrap; }
    .chat-back-btn:hover { background: rgba(255,255,255,0.3); }

    .chat-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; min-height: 200px; max-height: 380px; background: #f8f9fb; }
    .chat-messages::-webkit-scrollbar { width: 4px; }
    .chat-messages::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

    .welcome-msg { text-align: center; padding: 20px 16px; color: #666; }
    .welcome-icon { width: 52px; height: 52px; object-fit: contain; margin-bottom: 8px; }
    .welcome-msg p { font-size: 13px; margin: 0 0 12px; line-height: 1.5; }
    .suggestions { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
    .suggestions button { font-size: 11px; padding: 2px 10px; height: auto; line-height: 1.6; border-radius: 12px; }

    .message { display: flex; max-width: 85%; }
    .user-msg { align-self: flex-end; }
    .bot-msg { align-self: flex-start; }
    .error-msg { align-self: flex-start; }
    .sql-msg { align-self: flex-start; }

    .msg-bubble { padding: 10px 14px; border-radius: 14px; font-size: 13px; line-height: 1.5; word-wrap: break-word; }
    .user-msg .msg-bubble { background: linear-gradient(135deg, #1f3d6e, #2a5298); color: #fff; border-bottom-right-radius: 4px; }
    .bot-msg .msg-bubble { background: #fff; color: #333; border: 1px solid #e8ebf0; border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .error-msg .msg-bubble { background: #fff0f0; color: #c62828; border: 1px solid #ffcdd2; border-bottom-left-radius: 4px; }
    .sql-msg .msg-bubble { background: #f5f5f5; color: #333; font-family: 'Cascadia Code', monospace; font-size: 11px; }

    .msg-time { font-size: 10px; color: #999; margin-top: 4px; }
    .user-msg .msg-time { text-align: right; }

    .result-section { margin-top: 8px; }
    .result-count { font-size: 11px; color: #666; margin-bottom: 6px; padding: 4px 8px; background: #f0f4ff; border-radius: 4px; }
    .result-table-wrapper { max-height: 200px; overflow-y: auto; border: 1px solid #e8ebf0; border-radius: 6px; }
    :host ::ng-deep .ant-table-thead > tr > th { padding: 4px 8px; font-size: 10px; font-weight: 700; color: #1f3d6e; background: #f0f4ff; border-bottom: 1px solid #d0d8e8 !important; }
    :host ::ng-deep .ant-table-tbody > tr > td { padding: 4px 8px; font-size: 11px; color: #333; border-bottom: 1px solid #f0f2f5; }
    :host ::ng-deep .ant-table-thead > tr > th.ant-table-cell,
    :host ::ng-deep .ant-table-tbody > tr > td.ant-table-cell { white-space: nowrap; max-width: 120px; overflow: hidden; text-overflow: ellipsis; }

    .loading-bubble { display: flex; align-items: center; gap: 8px; }

    .chat-input { display: flex; gap: 8px; padding: 10px 12px; border-top: 1px solid #e8ebf0; background: #fff; }
    .chat-input input { flex: 1; border-radius: 20px; padding-left: 14px; font-size: 13px; }
    .chat-input button { border-radius: 50%; width: 34px; height: 34px; padding: 0; display: flex; align-items: center; justify-content: center; }

    @media (max-width: 480px) {
      .chat-panel { width: calc(100vw - 32px); max-height: 70vh; }
      .chat-panel.open-left { right: -8px; }
      .chat-panel.open-right { left: -8px; }
    }
  `]
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  // Draggable position coordinates
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
  messages: (ChatMessage & { data?: any })[] = [];

  suggestions = [
    'Hi!',
    'Total employees?',
    'How many are active?',
    'Show recent employees',
    'Gender distribution',
    'Designation wise count'
  ];

  private destroy$ = new Subject<void>();
  private msgId = 0;

  constructor(private text2SqlService: Text2SqlService) {}

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

  // --- Drag and Drop Handlers ---
  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return; // only left click
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
            const botMsg = response.data.message || response.data.explanation || 'Here you go!';
            if (response.data.rows && response.data.rows.length > 0) {
              this.addBotMessage(this.formatMessage(botMsg), response.data);
            } else {
              this.addMessage('bot', botMsg);
            }
          } else {
            this.addMessage('error', response.data?.errorMessage || response.message || 'Sorry, I could not process that question.');
          }
          this.scrollToBottom();
        },
        error: (err) => {
          this.isLoading = false;
          const msg = err.error?.message || err.message || 'Network error. Please try again.';
          this.addMessage('error', msg);
          this.scrollToBottom();
        }
      });
  }

  private formatMessage(text: string): string {
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
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
      data: { ...data }
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

