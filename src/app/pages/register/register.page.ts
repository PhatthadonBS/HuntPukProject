import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonicModule, 
  AlertController, 
  ModalController, 
  LoadingController 
} from '@ionic/angular'; 
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { UserRegPostReq } from '../../model/req/user_reg_post_req';

// Import Icons
import { addIcons } from 'ionicons';
import {
  arrowBack, person, key, call, mail, arrowForward, eye, eyeOff,
} from 'ionicons/icons';

// Import Modal Component
import { OtpModalComponent } from '../../components/otp-modal/otp-modal.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  // 👇 จุดที่แก้ไข: ต้องเพิ่ม OtpModalComponent เข้าไปใน imports ด้วย
  imports: [CommonModule, FormsModule, IonicModule, OtpModalComponent],
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
    private loadingCtrl: LoadingController,
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
      this.showAlert('แจ้งเตือน', 'รหัสผ่านยืนยันไม่ตรงกัน');
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

    // เตรียมข้อมูล
    const userData: UserRegPostReq = {
      username: this.username,
      email: this.email,
      password: this.password,
      phone: this.phone,
    };

    // 2. แสดง Loading
    const loading = await this.loadingCtrl.create({ 
      message: 'กำลังตรวจสอบข้อมูล...',
      spinner: 'crescent' 
    });
    await loading.present();

    try {
      // 3. ยิง API Register (Sec1)
      this.tempUserData = await this.authService.register(userData);
      
      // 4. ยิง API ขอ OTP
      await this.authService.reqOTP(this.email);
      
      // ✅ ปิด Loading ก่อนเปิด Modal
      await loading.dismiss();

      // 5. เปิด OTP Modal
      const modal = await this.modalCtrl.create({
        component: OtpModalComponent,
        componentProps: { email: this.email },
        backdropDismiss: false,
      });

      await modal.present();

      // 6. รอรับค่ากลับจาก Modal
      const { data } = await modal.onWillDismiss();

      if (data && data.success) {
        await this.finishRegister();
      }

    } catch (error: any) {
      // ❌ ถ้า Error ให้ปิด Loading ก่อน
      await loading.dismiss();
      
      console.error("Register Error:", error);
      
      const serverMsg = error.error?.message || error.message || 'เกิดข้อผิดพลาด';
      let displayMsg = 'ระบบขัดข้อง กรุณาลองใหม่ภายหลัง';

      if (serverMsg.includes('Duplicate') || serverMsg.includes('email')) {
        displayMsg = 'อีเมลนี้ถูกใช้งานแล้ว';
      } else if (serverMsg.includes('username')) {
        displayMsg = 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว';
      }

      this.showAlert('ไม่สามารถทำรายการได้', displayMsg);
    }
  }

  async finishRegister() {
    const loading = await this.loadingCtrl.create({ message: 'กำลังสร้างบัญชี...' });
    await loading.present();

    try {
      const isVerified = true;

      if (this.tempUserData) {
        await this.authService.registerSec2(this.tempUserData, isVerified);
      } else {
        throw new Error('Session Expired');
      }

      await loading.dismiss();

      const alert = await this.alertController.create({
        header: 'สมัครสมาชิกสำเร็จ',
        subHeader: '✅',
        message: 'บัญชีของคุณถูกสร้างเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ',
        buttons: [{
            text: 'ตกลง',
            handler: () => {
              this.router.navigate(['/login']);
            },
        }],
        cssClass: 'custom-success-alert',
      });
      await alert.present();

    } catch (error: any) {
      await loading.dismiss();
      console.error(error);
      this.showAlert('ผิดพลาด', 'การบันทึกล้มเหลว กรุณาลองใหม่อีกครั้ง');
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