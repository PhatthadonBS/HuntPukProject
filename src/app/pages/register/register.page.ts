import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ModalController } from '@ionic/angular'; // ✅ เพิ่ม ModalController
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { UserRegPostReq } from '../../model/req/user_reg_post_req';

// Import Icons
import { addIcons } from 'ionicons';
import {
  arrowBack,
  person,
  key,
  call,
  mail,
  arrowForward,
  eye,
  eyeOff,
} from 'ionicons/icons';

import { OtpModalComponent } from '../../components/otp-modal/otp-modal.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class RegisterPage implements OnInit {
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  phone: string = '';

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  tempUserData: any = null;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private modalCtrl: ModalController,
    private authService: Auth
  ) {
    addIcons({ arrowBack, person, key, call, mail, arrowForward, eye, eyeOff });
  }

  ngOnInit() {}

  goBack() {
    this.router.navigate(['/login']);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async onNextStep() {
    // 1. Validation
    if (!this.username || !this.email || !this.password || !this.phone) {
      this.showAlert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const passwordRegex = /^[a-zA-Z0-9]{8}$/;
    if (!passwordRegex.test(this.password)) {
      this.showAlert(
        'รหัสผ่านไม่ถูกต้อง',
        'รหัสผ่านต้องเป็นภาษาอังกฤษหรือตัวเลข และมีความยาว 8 ตัวอักษรเท่านั้น'
      );
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.showAlert('แจ้งเตือน', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(this.phone)) {
      this.showAlert(
        'เบอร์โทรศัพท์ไม่ถูกต้อง',
        'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก (เฉพาะตัวเลข)'
      );
      return;
    }

    const userData: UserRegPostReq = {
      username: this.username,
      email: this.email,
      password: this.password,
      phone: this.phone,
    };

    try {
      this.tempUserData = await this.authService.register(userData);
      await this.authService.reqOTP(this.email);
      const modal = await this.modalCtrl.create({
        component: OtpModalComponent,
        componentProps: { email: this.email },
        backdropDismiss: false,
      });

      await modal.present();

      // 5. รอผลลัพธ์จาก Modal
      const { data } = await modal.onWillDismiss();

      if (data && data.success) {
        // ✅ ถ้า OTP ผ่าน ให้บันทึกข้อมูลทันที
        await this.finishRegister();
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.error || error.message || 'เกิดข้อผิดพลาด';
      this.showAlert('ผิดพลาด', 'อีเมลนี้อาจถูกใช้งานแล้ว หรือระบบขัดข้อง');
    }
  }

  async finishRegister() {
    try {
      const isVerified = true;

      if (this.tempUserData) {
        await this.authService.registerSec2(this.tempUserData, isVerified);
      } else {
        throw new Error('ไม่พบข้อมูลผู้ใช้');
      }

      const alert = await this.alertController.create({
        header: 'สมัครสมาชิกสำเร็จ',
        subHeader: '✅',
        message: 'บัญชีของคุณถูกสร้างเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ',
        buttons: [
          {
            text: 'ตกลง',
            handler: () => {
              this.router.navigate(['/login']);
            },
          },
        ],
        cssClass: 'custom-success-alert',
      });
      await alert.present();
    } catch (error: any) {
      console.error(error);
      this.showAlert('ผิดพลาด', 'การบันทึกล้มเหลว');
    }
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
