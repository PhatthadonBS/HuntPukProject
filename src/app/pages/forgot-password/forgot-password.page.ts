import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';
import { UserRegPostReq } from '../../model/req/user_reg_post_req';
import { UserVerifyPostRes } from '../../model/res/user_verify_post_res';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
})
export class ForgotPasswordPage implements OnInit {
  step: number = 1; // ตัวแปรคุมหน้าจอ (1=OTP, 2=Reset)

  storedUser = sessionStorage.getItem('user');
  userData:UserRegPostReq = this.storedUser ? JSON.parse(this.storedUser) : '';
  email: string = this.userData.email;
  otpInput: string = '';
  serverOtp: string = ''; // เก็บ OTP ที่สุ่มได้

  // Step 2 Data
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: Auth
  ) {}

  ngOnInit() {}

  // กลับไปหน้า Login
  goBack() {
    this.router.navigate(['/login']);
  }

  // 1. ขอ OTP
  async requestOTP() {
    if (!this.email) {
      this.showAlert('แจ้งเตือน', 'กรุณากรอกอีเมล');
      return;
    }

    try {
      console.log("now here");
      
      const res = await this.authService.reqOTP(this.userData.email);
      console.log(res); return;
      
    } catch (error) {
      console.log(error);
      
    }
  }

  // 2. ตรวจสอบ OTP เพื่อไปหน้าถัดไป
  async verifyOTP() {
    try {
      const res = await this.authService.verifyOTP(this.userData.email, this.otpInput) as UserVerifyPostRes;
      console.log(res);
      const res2 = await this.authService.registerSec2(this.userData, res.status)
      console.log(res2);
      sessionStorage.clear();
      
    } catch (error) {
      console.log(error);
      
    }
  }

  // 3. ยืนยันการเปลี่ยนรหัสผ่าน (หน้า 2)
  async confirmReset() {
    // ตรวจสอบเงื่อนไข (a-z และ 0-9 เท่านั้น, ความยาว 8 ตัวเป๊ะตามรูป)
    const regex = /^[a-z0-9]{8}$/;

    if (!regex.test(this.newPassword)) {
      this.showAlert(
        'รูปแบบไม่ถูกต้อง',
        'รหัสผ่านต้องเป็น a-z และ 0-9 รวมกัน 8 ตัวอักษรเท่านั้น'
      );
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showAlert('ผิดพลาด', 'รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }

    // ถามยืนยันอีกครั้ง
    const confirmAlert = await this.alertController.create({
      header: 'ยืนยันการเปลี่ยนรหัสผ่าน',
      message: 'คุณต้องการเปลี่ยนรหัสผ่านใช่หรือไม่?',
      buttons: [
        {
          text: 'ยกเลิก',
          role: 'cancel',
        },
        {
          text: 'ตกลง',
          handler: () => {
            this.successAndRedirect();
          },
        },
      ],
    });
    await confirmAlert.present();
  }

  // 4. เปลี่ยนสำเร็จ -> กลับหน้า Login
  async successAndRedirect() {
    const alert = await this.alertController.create({
      header: 'สำเร็จ',
      subHeader: '✅',
      message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
      buttons: [
        {
          text: 'ตกลง',
          handler: () => {
            this.router.navigate(['/login']);
          },
        },
      ],
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
