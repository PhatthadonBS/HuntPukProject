import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class ForgotPasswordPage implements OnInit {

  step: number = 1; // ตัวแปรคุมหน้าจอ (1=OTP, 2=Reset)
  
  // Step 1 Data
  email: string = '';
  otpInput: string = '';
  serverOtp: string = ''; // เก็บ OTP ที่สุ่มได้

  // Step 2 Data
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {
  }

  // กลับไปหน้า Login
  goBack() {
    this.router.navigate(['/login']);
  }

  // 1. ขอ OTP
  async requestOTP() {
    if(!this.email) {
      this.showAlert('แจ้งเตือน', 'กรุณากรอกอีเมล');
      return;
    }
    
    // จำลองการสุ่ม OTP 4 หลัก
    this.serverOtp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // แสดง OTP ให้เห็น (Mock)
    this.showAlert('OTP ส่งไปยังอีเมลแล้ว', `รหัส OTP ของคุณคือ: ${this.serverOtp}`);
  }

  // 2. ตรวจสอบ OTP เพื่อไปหน้าถัดไป
  verifyOTP() {
    if (this.otpInput === this.serverOtp && this.serverOtp !== '') {
      // ผ่าน! ไปหน้า 2
      this.step = 2;
    } else {
      this.showAlert('ผิดพลาด', 'รหัส OTP ไม่ถูกต้อง');
    }
  }

  // 3. ยืนยันการเปลี่ยนรหัสผ่าน (หน้า 2)
  async confirmReset() {
    // ตรวจสอบเงื่อนไข (a-z และ 0-9 เท่านั้น, ความยาว 8 ตัวเป๊ะตามรูป)
    const regex = /^[a-z0-9]{8}$/;

    if (!regex.test(this.newPassword)) {
      this.showAlert('รูปแบบไม่ถูกต้อง', 'รหัสผ่านต้องเป็น a-z และ 0-9 รวมกัน 8 ตัวอักษรเท่านั้น');
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
          role: 'cancel'
        },
        {
          text: 'ตกลง',
          handler: () => {
            this.successAndRedirect();
          }
        }
      ]
    });
    await confirmAlert.present();
  }

  // 4. เปลี่ยนสำเร็จ -> กลับหน้า Login
  async successAndRedirect() {
    const alert = await this.alertController.create({
      header: 'สำเร็จ',
      subHeader: '✅',
      message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
      buttons: [{
        text: 'ตกลง',
        handler: () => {
          this.router.navigate(['/login']);
        }
      }]
    });
    await alert.present();
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