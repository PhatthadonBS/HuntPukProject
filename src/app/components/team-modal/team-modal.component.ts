import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeOutline, logoFacebook, codeSlashOutline } from 'ionicons/icons';

export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  avatarColor: string;
  avatarTextColor: string;
  facebookUrl: string;
}

@Component({
  selector: 'app-team-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="popup-overlay" [class.visible]="isOpen" (click)="onClose()">
      <div class="popup-box" [class.open]="isOpen" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="popup-header">
          <div class="popup-title-wrap">
            <div class="popup-title-icon">
              <ion-icon name="code-slash-outline"></ion-icon>
            </div>
            <div>
              <h2>ทีมผู้จัดทำ</h2>
              <p>HuntPuk Development Team</p>
            </div>
          </div>
          <button class="close-btn" (click)="onClose()">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>

        <div class="popup-divider"></div>

        <!-- Member Cards -->
        <div class="member-list">
          <div class="member-card" *ngFor="let member of members; let i = index"
               [style.animation-delay]="(i * 0.08) + 's'">
            <div class="member-avatar"
                 [style.background]="member.avatarColor"
                 [style.color]="member.avatarTextColor">
              {{ member.avatar }}
            </div>
            <div class="member-info">
              <h3>{{ member.name }}</h3>
              <span class="role-badge">{{ member.role }}</span>
            </div>
            <a class="fb-btn" [href]="member.facebookUrl" target="_blank" (click)="$event.stopPropagation()">
              <ion-icon name="logo-facebook"></ion-icon>
              <span>Facebook</span>
            </a>
          </div>
        </div>

        <div class="popup-footer">
          <span>© 2026 HuntPuk. All rights reserved.</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .popup-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(0, 0, 0, 0);
      backdrop-filter: blur(0px);
      -webkit-backdrop-filter: blur(0px);
      pointer-events: none;
      transition: background 0.3s ease, backdrop-filter 0.3s ease;

      &.visible {
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        pointer-events: all;
      }
    }

    .popup-box {
      background: #fff;
      border-radius: 28px;
      padding: 28px 28px 20px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0,0,0,0.04);
      transform: scale(0.88) translateY(20px);
      opacity: 0;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                  opacity 0.3s ease;
      pointer-events: none;

      &.open {
        transform: scale(1) translateY(0);
        opacity: 1;
        pointer-events: all;
      }
    }

    .popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;

      .popup-title-wrap {
        display: flex;
        align-items: center;
        gap: 14px;

        .popup-title-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: linear-gradient(135deg, #FFD600, #ffab00);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: #1a1a1a;
          box-shadow: 0 4px 12px rgba(255, 214, 0, 0.35);
          flex-shrink: 0;
        }

        h2 {
          margin: 0 0 2px;
          font-size: 18px;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.3px;
        }

        p {
          margin: 0;
          font-size: 12px;
          color: #999;
          font-weight: 500;
        }
      }

      .close-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: #f4f4f4;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: #666;
        cursor: pointer;
        transition: background 0.2s, color 0.2s, transform 0.15s;
        flex-shrink: 0;

        &:hover {
          background: #ebebeb;
          color: #1a1a1a;
          transform: rotate(90deg);
        }
      }
    }

    .popup-divider {
      height: 1px;
      background: #f0f0f0;
      margin-bottom: 20px;
    }

    .member-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .member-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border-radius: 18px;
      background: #fafafa;
      border: 1px solid #f0f0f0;
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
      transition: box-shadow 0.2s ease, transform 0.2s ease;

      &:hover {
        box-shadow: 0 6px 20px rgba(0,0,0,0.07);
        transform: translateY(-2px);
      }

      .member-avatar {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 800;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      }

      .member-info {
        flex: 1;
        min-width: 0;

        h3 {
          margin: 0 0 5px;
          font-size: 15px;
          font-weight: 700;
          color: #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .role-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          color: #888;
          background: rgba(0,0,0,0.06);
          padding: 3px 10px;
          border-radius: 99px;
        }
      }

      .fb-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 9px 14px;
        border-radius: 12px;
        background: linear-gradient(135deg, #1877f2, #0d63d0);
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
        white-space: nowrap;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(24, 119, 242, 0.35);
        transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;

        ion-icon { font-size: 17px; }

        &:hover {
          opacity: 0.92;
          transform: scale(1.04);
          box-shadow: 0 6px 18px rgba(24, 119, 242, 0.45);
        }

        &:active {
          transform: scale(0.97);
          opacity: 0.85;
        }
      }
    }

    .popup-footer {
      text-align: center;
      padding-top: 10px;
      border-top: 1px solid #f5f5f5;

      span {
        font-size: 12px;
        color: #bbb;
        font-weight: 500;
      }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class TeamModalComponent {
  @Input() isOpen = false;
  @Input() members: TeamMember[] = [];
  @Output() closed = new EventEmitter<void>();

  constructor() {
    addIcons({
      'close-outline': closeOutline,
      'logo-facebook': logoFacebook,
      'code-slash-outline': codeSlashOutline
    });
  }

  onClose() {
    this.closed.emit();
  }
}
