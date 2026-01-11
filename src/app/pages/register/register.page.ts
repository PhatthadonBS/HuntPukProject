import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonicModule, 
  AlertController, 
  ModalController, 
  LoadingController // 1. เพิ่ม LoadingController
} from '@ionic/angular'; 
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { UserRegPostReq } from '../../model/req/user_reg_post_req';

// Import Icons
import { addIcons } from 'ionicons';
import {
  arrowBack, person, key, call, mail, arrowForward, eye, eyeOff,
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
    private loadingCtrl: LoadingController, // 2. Inject LoadingController
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
    // 1. Validation (ตรวจสอบเบื้องต้น)
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

    // เตรียมข้อมูลส่ง
    const userData: UserRegPostReq = {
      username: this.username,
      email: this.email,
      password: this.password,
      phone: this.phone,
    };

    // 3. สร้าง Loading (เพื่อให้รู้ว่ากำลังทำงาน)
    const loading = await this.loadingCtrl.create({ 
      message: 'กำลังตรวจสอบข้อมูล...',
      spinner: 'crescent' 
    });
    await loading.present();

    try {
      // 4. ยิง API ตรวจสอบข้อมูลเบื้องต้น (Sec1)
      this.tempUserData = await this.authService.register(userData);
      
      // 5. ยิง API ขอ OTP
      await this.authService.reqOTP(this.email);
      
      // ปิด Loading เมื่อเสร็จสิ้น API Call ก่อนเปิด Modal
      await loading.dismiss();

      // 6. เปิด Modal OTP
      const modal = await this.modalCtrl.create({
        component: OtpModalComponent,
        componentProps: { email: this.email },
        backdropDismiss: false,
      });

      await modal.present();

      // 7. รอผลลัพธ์จาก Modal
      const { data } = await modal.onWillDismiss();

      if (data && data.success) {
        // ถ้า OTP ผ่าน ให้บันทึกข้อมูลทันที
        await this.finishRegister();
      }

    } catch (error: any) {
      // ถ้า Error ให้ปิด Loading ก่อน แล้วค่อยโชว์ Alert
      await loading.dismiss();
      
      console.error("Register Error:", error);
      
      // ดึงข้อความ Error จาก Server มาแสดง
      // เช็คหลายชั้นเผื่อ Structure ของ Error ต่างกัน
      const serverMsg = error.error?.message || error.message || JSON.stringify(error);
      
      let displayMsg = 'ระบบขัดข้อง กรุณาลองใหม่ภายหลัง';
      
      // แปลง Error Message ให้ user เข้าใจง่าย (Optional)
      if (serverMsg.includes('Duplicate entry') || serverMsg.includes('email')) {
        displayMsg = 'อีเมลนี้ถูกใช้งานแล้ว';
      } else if (serverMsg.includes('username')) {
        displayMsg = 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว';
      }

      this.showAlert('ไม่สามารถทำรายการได้', displayMsg);
    }
  }

  async finishRegister() {
    // สร้าง Loading อีกรอบตอนบันทึกจริง
    const loading = await this.loadingCtrl.create({ message: 'กำลังสร้างบัญชี...' });
    await loading.present();

    try {
      const isVerified = true;

      if (this.tempUserData) {
        await this.authService.registerSec2(this.tempUserData, isVerified);
      } else {
        throw new Error('ไม่พบข้อมูลผู้ใช้ (Session Expired)');
      }

      await loading.dismiss(); // ปิด Loading

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
      await loading.dismiss();
      console.error(error);
      this.showAlert('ผิดพลาด', 'การบันทึกข้อมูลล้มเหลว กรุณาลองใหม่อีกครั้ง');
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