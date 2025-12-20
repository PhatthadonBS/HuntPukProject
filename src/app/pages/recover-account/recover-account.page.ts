import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ModalController } from '@ionic/angular'; // ✅ เพิ่ม ModalController
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { addIcons } from 'ionicons';
import { arrowBack, mail, arrowForward } from 'ionicons/icons';
// ✅ Import Modal
import { OtpModalComponent } from '../../components/otp-modal/otp-modal.component';

@Component({
  selector: 'app-recover-account',
  templateUrl: './recover-account.page.html',
  styleUrls: ['./recover-account.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class RecoverAccountPage implements OnInit {

  email: string = '';

  constructor(
    private router: Router,
    private alertController: AlertController,
    private modalCtrl: ModalController, // ✅
    private authService: Auth
  ) {
    addIcons({ arrowBack, mail, arrowForward });
  }

  ngOnInit() { }

  goBack() {
    this.router.navigate(['/login']);
  }

  // ฟังก์ชันหลัก: ขอ OTP -> เปิด Modal -> กู้คืน
  async requestRecovery() {
    if (!this.email) {
      this.showAlert('แจ้งเตือน', 'กรุณากรอกอีเมลของบัญชีที่ต้องการกู้คืน');
      return;
    }

    try {
      // 1. เรียก API ขอ OTP
      await this.authService.reqOTP(this.email);

      // 2. ✅ เปิด Modal OTP
      const modal = await this.modalCtrl.create({
        component: OtpModalComponent,
        componentProps: { email: this.email },
        backdropDismiss: false
      });

      await modal.present();

      // 3. รอผลลัพธ์จาก Modal
      const { data } = await modal.onWillDismiss();

      if (data && data.success) {
        // ✅ ถ้า OTP ผ่าน -> เรียก API กู้คืนบัญชีทันที
        await this.performRecovery();
      }

    } catch (error: any) {
      console.error(error);
      this.showAlert('ผิดพลาด', 'ไม่พบอีเมลนี้ในระบบ หรือเกิดข้อผิดพลาด');
    }
  }

  // ฟังก์ชันกู้คืนบัญชี (แยกออกมาเพื่อให้โค้ดสะอาด)
  async performRecovery() {
    try {
      // เรียก API recoverAccount (ส่ง verify=true)
      // (ต้องแน่ใจว่าใน Service มีฟังก์ชันนี้และรับ email, boolean)
      await this.authService.recoverAccount(this.email, true);

      const alert = await this.alertController.create({
        header: 'กู้คืนสำเร็จ',
        subHeader: '✅',
        message: 'บัญชีของคุณเปิดใช้งานเรียบร้อยแล้ว สามารถเข้าสู่ระบบได้ทันที',
        buttons: [{
          text: 'ตกลง',
          handler: () => {
            this.router.navigate(['/login']);
          }
        }],
        cssClass: 'custom-success-alert'
      });
      await alert.present();

    } catch (error: any) {
      console.error(error);
      this.showAlert('ผิดพลาด', 'ไม่สามารถกู้คืนบัญชีได้ กรุณาลองใหม่อีกครั้ง');
    }
  }

  async showAlert(header: string, msg: string) {
    const alert = await this.alertController.create({
      header: header,
      message: msg,
      buttons: ['ตกลง']
    });
    await alert.present();
  }
}