import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { trigger, transition, style, animate } from '@angular/animations';
import { addIcons } from 'ionicons';
import { helpCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
  animations: [
    trigger('popIn', [
      transition(':enter', [
        style({ transform: 'scale(0.85) translateY(20px)', opacity: 0 }),
        animate(
          '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ transform: 'scale(1) translateY(0)', opacity: 1 })
        )
      ]),
      transition(':leave', [
        animate(
          '160ms ease-in',
          style({ transform: 'scale(0.95)', opacity: 0 })
        )
      ])
    ])
  ]
})
export class ConfirmModalComponent implements OnInit {
  @Input() title: string = 'ยืนยันการดำเนินการ';
  @Input() message: string = 'คุณต้องการดำเนินการต่อใช่หรือไม่?';
  @Input() note: string = '';
  @Input() confirmText: string = 'ยืนยัน';
  @Input() cancelText: string = 'ยกเลิก';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  isVisible = false;

  constructor() {
    addIcons({ 'help-circle-outline': helpCircleOutline, 'checkmark-circle-outline': checkmarkCircleOutline });
  }

  ngOnInit() {
    setTimeout(() => (this.isVisible = true), 50);
  }

  onOverlayClick(e: Event) {
    // ✅ ไม่ปิดอัตโนมัติเมื่อคลิก backdrop — บังคับให้กดปุ่มเลือกชัดเจน
  }

  confirm() {
    this.isVisible = false;
    setTimeout(() => this.confirmed.emit(), 180);
  }

  cancel() {
    this.isVisible = false;
    setTimeout(() => this.cancelled.emit(), 180);
  }
}