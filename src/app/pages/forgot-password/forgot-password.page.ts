import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ModalController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';
import { addIcons } from 'ionicons';
import { arrowBack, mail, key, arrowForward, checkmarkCircle, eye, eyeOff } from 'ionicons/icons';

// ✅ Import Modal OTP
import { OtpModalComponent } from '../../components/otp-modal/otp-modal.component';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
})
export class ForgotPasswordPage implements OnInit {
  
  step: number = 1; // 1=กรอกอีเมล, 2=ตั้งรหัสใหม่
  email: string = '';
  
  // Step 2 Data
  newPassword: string = '';
  confirmPassword: string = '';

  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private modalCtrl: ModalController, // ✅ เพิ่ม ModalController
    private authService: Auth
  ) {
    addIcons({ arrowBack, mail, key, arrowForward, checkmarkCircle ,eye ,eyeOff});
  }

  ngOnInit() {}
toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  
  goBack() {
    this.router.navigate(['/login']);
  }

  // STEP 1: ขอ OTP และเปิด Modal
  async requestOTP() {
    if (!this.email) {
      this.showAlert('แจ้งเตือน', 'กรุณากรอกอีเมล');
      return;
    }

    try {
      // 1. เรียก API ขอ OTP
      await this.authService.reqOTP(this.email);

      // 2. ✅ เปิด Modal OTP (ใช้ตัวเดียวกับ Register)
      const modal = await this.modalCtrl.create({
        component: OtpModalComponent,
        componentProps: { email: this.email },
        backdropDismiss: false
      });

      await modal.present();

      // 3. รอผลลัพธ์จาก Modal (เมื่อกดยืนยันใน Modal ผ่าน)
      const { data } = await modal.onWillDismiss();

      if (data && data.success) {
        // ถ้า OTP ผ่าน -> ไปหน้าตั้งรหัสใหม่ (Step 2)
        this.step = 2;
      }

    } catch (error: any) {
      console.error(error);
      this.showAlert('ข้อผิดพลาด', 'ไม่พบอีเมลในระบบ หรือเกิดข้อผิดพลาด');
    }
  }

  // STEP 2: บันทึกรหัสผ่านใหม่
  async confirmReset() {
    // Validation
    const regex = /^[a-z0-9]{8}$/;
    if (!regex.test(this.newPassword)) {
      this.showAlert('รูปแบบไม่ถูกต้อง', 'รหัสผ่านต้องเป็น a-z และ 0-9 รวมกัน 8 ตัวอักษรเท่านั้น');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showAlert('ผิดพลาด', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    try {
      // ✅ เรียก API เปลี่ยนรหัสผ่าน (ส่ง verify=true เพราะผ่าน OTP แล้ว)
      await this.authService.resetPassword(this.email, this.newPassword, true);

      this.successAndRedirect();

    } catch (error: any) {
      console.error(error);
      this.showAlert('ผิดพลาด', 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    }
  }

  async successAndRedirect() {
    const alert = await this.alertController.create({
      header: 'สำเร็จ',
      subHeader: '✅',
      message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
      buttons: [{
        text: 'ตกลง',
        handler: () => {
          this.router.navigate(['/login']);
        },
      }],
      cssClass: 'custom-success-alert'
    });
    await alert.present();
  }

  async showAlert(header: string, msg: string) {
    const alert = await this.alertController.create({
      header: header,
      message: msg,
      buttons: ['ตกลง'],
    });
    await alert.present();
  }
}