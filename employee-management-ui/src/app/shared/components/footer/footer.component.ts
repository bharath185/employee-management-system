import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="app-footer">
      <div class="footer-content">
        <span>&copy; {{ currentYear }} Employee Management System. All rights reserved.</span>
        <span class="footer-version">v1.0.0</span>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      background: white;
      border-top: 1px solid #e0e0e0;
      padding: 12px 24px;
      margin-top: auto;
    }
    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #666;
    }
    .footer-version {
      color: #999;
    }
    @media (max-width: 768px) {
      .app-footer {
        padding: 8px 16px;
      }
      .footer-content {
        flex-direction: column;
        gap: 4px;
        text-align: center;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
