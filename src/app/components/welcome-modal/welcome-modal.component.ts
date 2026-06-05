import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-welcome-modal',
  templateUrl: './welcome-modal.component.html',
  styleUrls: ['./welcome-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(60px)', opacity: 0 }),
        animate('400ms cubic-bezier(0.34,1.56,0.64,1)', 
          style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class WelcomeModalComponent implements OnInit {
  @Input() user: any = null;
  @Output() closed = new EventEmitter<void>();

  isVisible = false;
  title = '';
  message = '';
  buttonText = 'เริ่มใช้งาน';
  roleClass = 'member';
  confetti: string[] = [];

  ngOnInit() {
    this.buildContent();
    this.generateConfetti();
    setTimeout(() => this.isVisible = true, 100);
  }

  buildContent() {
    const name = this.user?.FIRST_NAME || this.user?.username || 'ผู้ใช้งาน';
    const role = Number(this.user?.role_id || this.user?.ROLE_TYPE_ID || 1);
    if (role === 2) {
      this.title = '🏠 ยินดีต้อนรับเจ้าของหอพัก';
      this.message = `สวัสดีคุณ <strong>${name}</strong><br>จัดการและอัปเดตข้อมูลหอพักของคุณได้เลยครับ ✨`;
      this.roleClass = 'owner';
      this.buttonText = 'ไปจัดการหอพัก';
    } else {
      this.title = '👋 ยินดีต้อนรับสู่ HuntPuk';
      this.message = `สวัสดีคุณ <strong>${name}</strong><br>ขอให้เจอหอพักที่ถูกใจนะครับ 🏡`;
      this.roleClass = 'member';
    }
  }

  generateConfetti() {
    const colors = ['#FFD600','#ff4d4d','#00c853','#2196F3','#ff69b4'];
    this.confetti = Array.from({ length: 18 }, (_, i) => {
      const color = colors[i % colors.length];
      const left = Math.random() * 100;
      const delay = Math.random() * 0.8;
      const size = 6 + Math.random() * 6;
      return `left:${left}%;animation-delay:${delay}s;background:${color};width:${size}px;height:${size}px;animation-duration:${1.2 + Math.random()}s`;
    });
  }

  onOverlayClick(e: Event) {
    if ((e.target as HTMLElement).classList.contains('welcome-overlay')) this.close();
  }

  close() {
    this.isVisible = false;
    setTimeout(() => this.closed.emit(), 300);
  }
}