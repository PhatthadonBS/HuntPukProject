import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-require-login-modal',
  templateUrl: './require-login-modal.component.html',
  styleUrls: ['./require-login-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  animations: [
    trigger('popIn', [
      transition(':enter', [
        style({ transform: 'scale(0.85) translateY(20px)', opacity: 0 }),
        animate(
          '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ transform: 'scale(1) translateY(0)', opacity: 1 })
        )
      ])
    ])
  ]
})
export class RequireLoginModalComponent implements OnInit {
  @Input() title: string = 'แจ้งเตือน';
  @Input() message: string = 'กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อน เพื่อเลือกหอพักที่คุณสนใจครับ';

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
  
  login() {
    this.modalCtrl.dismiss(null, 'login');
  }
}
