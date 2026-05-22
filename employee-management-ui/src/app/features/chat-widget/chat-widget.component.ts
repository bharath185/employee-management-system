import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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
    <!-- Floating bot button -->
    <button class="chat-fab" (click)="toggleChat()"
      [class.open]="isOpen"
      [attr.aria-label]="isOpen ? 'Close chat' : 'Open chat'">
      <i nz-icon [nzType]="isOpen ? 'close' : 'robot'" nzTheme="fill"></i>
    </button>

    <!-- Chat panel -->
    <div class="chat-panel" [class.open]="isOpen">
      <div class="chat-header">
        <i nz-icon nzType="robot" nzTheme="fill"></i>
        <span>Ask about your data</span>
        <button class="chat-close-btn" (click)="isOpen = false" aria-label="Close">
          <i nz-icon nzType="minus"></i>
        </button>
      </div>

      <div class="chat-messages" #messageContainer>
        <div class="welcome-msg" *ngIf="messages.length === 0">
          <i nz-icon nzType="bulb" nzTheme="fill"></i>
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
            <div class="msg-text">{{ msg.content }}</div>

            <!-- SQL display (collapsible) -->
            <div *ngIf="msg.type === 'bot' && msg.data?.sql" class="sql-toggle"
              (click)="msg.data!.showSql = !msg.data!.showSql">
              <i nz-icon [nzType]="msg.data?.showSql ? 'code' : 'code'"></i>
              {{ msg.data?.showSql ? 'Hide SQL' : 'Show SQL' }}
            </div>
            <pre *ngIf="msg.type === 'bot' && msg.data?.showSql" class="sql-block">{{ msg.data!.sql }}</pre>

            <!-- Results table -->
            <div *ngIf="msg.type === 'bot' && msg.data?.rows?.length" class="result-section">
              <div class="result-count">{{ msg.data!.explanation }}</div>
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
  `,
  styles: [`
    :host { position: fixed; bottom: 24px; right: 24px; z-index: 1000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

    .chat-fab { width: 52px; height: 52px; border-radius: 50%; border: none; background: linear-gradient(135deg, #1f3d6e, #2a5298); color: #fff; font-size: 22px; cursor: pointer; box-shadow: 0 4px 16px rgba(31,61,110,0.35); display: flex; align-items: center; justify-content: center; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); position: relative; }
    .chat-fab:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(31,61,110,0.45); }
    .chat-fab.open { background: linear-gradient(135deg, #dc3545, #a71d2a); transform: rotate(90deg); }
    .chat-fab i { font-size: 24px; line-height: 1; }

    .chat-panel { position: absolute; bottom: 64px; right: 0; width: 420px; max-height: 580px; background: #fff; border-radius: 14px; box-shadow: 0 8px 40px rgba(0,0,0,0.18); display: flex; flex-direction: column; overflow: hidden; opacity: 0; transform: translateY(16px) scale(0.96); pointer-events: none; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); transform-origin: bottom right; }
    .chat-panel.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }

    .chat-header { display: flex; align-items: center; gap: 8px; padding: 14px 16px; background: linear-gradient(135deg, #1f3d6e, #2a5298); color: #fff; font-size: 14px; font-weight: 600; }
    .chat-header i { font-size: 18px; }
    .chat-header span { flex: 1; }
    .chat-close-btn { background: rgba(255,255,255,0.2); border: none; color: #fff; width: 24px; height: 24px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .chat-close-btn:hover { background: rgba(255,255,255,0.35); }

    .chat-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; min-height: 200px; max-height: 380px; background: #f8f9fb; }
    .chat-messages::-webkit-scrollbar { width: 4px; }
    .chat-messages::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

    .welcome-msg { text-align: center; padding: 20px 16px; color: #666; }
    .welcome-msg i { font-size: 32px; color: #1f3d6e; margin-bottom: 8px; }
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

    .sql-toggle { font-size: 11px; color: #1f3d6e; cursor: pointer; margin-top: 6px; display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; background: rgba(31,61,110,0.08); border-radius: 4px; }
    .sql-toggle:hover { background: rgba(31,61,110,0.15); }
    .sql-block { background: #1e1e2e; color: #cdd6f4; padding: 10px; border-radius: 8px; font-size: 11px; line-height: 1.5; margin: 6px 0 0; overflow-x: auto; white-space: pre-wrap; max-height: 150px; }

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
      .chat-panel { width: calc(100vw - 32px); right: -8px; max-height: 70vh; }
    }
  `]
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  isOpen = false;
  isLoading = false;
  userInput = '';
  messages: (ChatMessage & { data?: any })[] = [];

  suggestions = [
    'Total employees?',
    'How many are active?',
    'Show recent employees',
    'Gender distribution',
    'Designation wise count',
    'Pending registrations'
  ];

  private destroy$ = new Subject<void>();
  private msgId = 0;

  constructor(private text2SqlService: Text2SqlService) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
            if (response.data.rows && response.data.rows.length > 0) {
              this.addBotMessage(response.data.explanation || this.getDefaultExplanation(text), response.data);
            } else {
              this.addMessage('bot', 'No results found for your query.');
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

  private getDefaultExplanation(question: string): string {
    const q = question.toLowerCase();
    if (q.includes('how many') || q.includes('count')) return 'Here are the counts:';
    return 'Here are the results:';
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
      data: { ...data, showSql: false }
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
