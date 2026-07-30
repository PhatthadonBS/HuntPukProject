import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { starOutline, closeOutline, arrowForwardOutline, timeOutline } from 'ionicons/icons';

const STORAGE_KEY_RATED = 'huntpuk_has_rated';
const STORAGE_KEY_DISMISSED = 'huntpuk_last_dismissed';
const REMIND_INTERVAL_MS = 5 * 60 * 1000; // 5 นาที
const INITIAL_DELAY_MS = 5 * 60 * 1000;   // รอ 5 นาทีแรกก่อนแสดง

@Component({
  selector: 'app-rating-prompt',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="rating-overlay" [class.visible]="isVisible" (click)="onDismiss()">
      <div class="rating-popup" [class.open]="isVisible" (click)="$event.stopPropagation()">

        <!-- Close -->
        <button class="close-btn" (click)="onDismiss()">
          <ion-icon name="close-outline"></ion-icon>
        </button>

        <!-- Icon -->
        <div class="popup-star-wrap">
          <div class="star-ring">
            <ion-icon name="star-outline"></ion-icon>
          </div>
        </div>

        <!-- Text -->
        <h2>คุณชอบ HuntPuk ไหม? ⭐</h2>
        <p>หากคุณพึงพอใจกับแพลตฟอร์มของเรา ช่วยให้คะแนนสักนิด เพื่อให้เราพัฒนาได้ดียิ่งขึ้นนะครับ</p>

        <!-- Actions -->
        <div class="popup-actions">
          <button class="btn-rate" (click)="onRate()">
            <ion-icon name="star-outline"></ion-icon>
            ให้คะแนนเลย!
          </button>
          <button class="btn-about" (click)="onGoSupport()">
            <ion-icon name="arrow-forward-outline"></ion-icon>
            ให้คะแนนในภายหลัง
          </button>
        </div>

        <!-- Later -->
        <button class="btn-later" (click)="onDismiss()">
          <ion-icon name="time-outline"></ion-icon>
          ขอบคุณ แจ้งเตือนอีกครั้งทีหลัง
        </button>

      </div>
    </div>
  `,
  styles: [`
    .rating-overlay {
      position: fixed;
      inset: 0;
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(0, 0, 0, 0);
      backdrop-filter: blur(0px);
      -webkit-backdrop-filter: blur(0px);
      pointer-events: none;
      transition: background 0.35s ease, backdrop-filter 0.35s ease;

      &.visible {
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        pointer-events: all;
      }
    }

    .rating-popup {
      background: #fff;
      border-radius: 28px;
      padding: 32px 28px 24px;
      width: 100%;
      max-width: 380px;
      text-align: center;
      position: relative;
      box-shadow: 0 30px 70px rgba(0,0,0,0.25);
      transform: scale(0.85) translateY(30px);
      opacity: 0;
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                  opacity 0.35s ease;
      pointer-events: none;

      &.open {
        transform: scale(1) translateY(0);
        opacity: 1;
        pointer-events: all;
      }

      .close-btn {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: #f4f4f4;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: #888;
        cursor: pointer;
        transition: background 0.2s, transform 0.2s;
        &:hover { background: #ebebeb; transform: rotate(90deg); }
      }

      .popup-star-wrap {
        margin-bottom: 18px;
        .star-ring {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FFF9C4, #FFE082);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          font-size: 34px;
          color: #e6a800;
          box-shadow: 0 6px 20px rgba(255, 214, 0, 0.4);
          animation: pulse 2s ease-in-out infinite;
        }
      }

      h2 {
        margin: 0 0 10px;
        font-size: 20px;
        font-weight: 800;
        color: #1a1a1a;
      }

      p {
        margin: 0 0 22px;
        font-size: 14px;
        color: #666;
        line-height: 1.6;
      }

      .popup-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 12px;
      }

      .btn-rate {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 14px;
        border-radius: 14px;
        border: none;
        background: linear-gradient(135deg, #FFD600, #ffab00);
        color: #1a1a1a;
        font-size: 16px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(255, 180, 0, 0.4);
        transition: transform 0.2s, box-shadow 0.2s;
        ion-icon { font-size: 20px; }
        &:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(255,180,0,0.5); }
        &:active { transform: translateY(1px); }
      }

      .btn-about {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 12px;
        border-radius: 14px;
        border: 1.5px solid #e8e8e8;
        background: #fafafa;
        color: #444;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s, border-color 0.2s;
        ion-icon { font-size: 16px; color: #888; }
        &:hover { background: #f0f0f0; border-color: #d0d0d0; }
      }

      .btn-later {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        padding: 10px;
        border-radius: 10px;
        border: none;
        background: transparent;
        color: #aaa;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: color 0.2s;
        ion-icon { font-size: 15px; }
        &:hover { color: #888; }
      }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 6px 20px rgba(255,214,0,0.4); }
      50% { transform: scale(1.06); box-shadow: 0 8px 28px rgba(255,214,0,0.6); }
    }
  `]
})
export class RatingPromptComponent implements OnInit, OnDestroy {
  @Output() rated = new EventEmitter<void>();

  isVisible = false;
  private timer: any = null;

  readonly ratingFormUrl = 'https://forms.gle/gwsN7eyL9iaEaDKR8';

  constructor(private router: Router) {
    addIcons({
      'star-outline': starOutline,
      'close-outline': closeOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'time-outline': timeOutline
    });
  }

  ngOnInit() {
    // ถ้าเคยให้คะแนนแล้ว ไม่ต้องทำอะไร
    if (localStorage.getItem(STORAGE_KEY_RATED) === 'true') return;

    this.schedulePrompt();
  }

  ngOnDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }

  private schedulePrompt() {
    const lastDismissed = localStorage.getItem(STORAGE_KEY_DISMISSED);
    const now = Date.now();

    let delay = INITIAL_DELAY_MS;

    if (lastDismissed) {
      const elapsed = now - Number(lastDismissed);
      if (elapsed >= REMIND_INTERVAL_MS) {
        // ครบ 5 นาทีแล้ว แสดงได้เลย (หน่วงเล็กน้อยให้หน้าโหลดก่อน)
        delay = 2000;
      } else {
        // ยังไม่ครบ รอให้ครบ
        delay = REMIND_INTERVAL_MS - elapsed;
      }
    }

    this.timer = setTimeout(() => {
      this.isVisible = true;
    }, delay);
  }

  /** ผู้ใช้กดให้คะแนน */
  onRate() {
    localStorage.setItem(STORAGE_KEY_RATED, 'true');
    window.open(this.ratingFormUrl, '_blank');
    this.isVisible = false;
    this.rated.emit();
  }

  /** ผู้ใช้ต้องการให้คะแนนในหน้า Support */
  onGoSupport() {
    this.isVisible = false;
    // บันทึกว่ากด "ไปให้ที่หน้า Support" แทนการ dismiss
    // ไม่นับเป็น dismiss เพื่อให้ยังแจ้งอีกถ้าไม่ได้ให้
    this.router.navigate(['/support']);
  }

  /** ผู้ใช้กด "ทีหลัง" หรือ backdrop */
  onDismiss() {
    localStorage.setItem(STORAGE_KEY_DISMISSED, String(Date.now()));
    this.isVisible = false;
    // ตั้ง timer ใหม่สำหรับ 5 นาทีถัดไป
    this.schedulePrompt();
  }
}
