import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth'; // Import Service

@Component({
  selector: 'app-recover-account',
  templateUrl: './recover-account.page.html',
  styleUrls: ['./recover-account.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class RecoverAccountPage implements OnInit, OnDestroy {

  step: number = 1; // 1=กรอกอีเมล, 2=กรอก OTP
  email: string = '';
  otpInput: string = '';

  // ✅ ตัวแปรสำหรับตัวนับเวลา
  timeLeft: number = 60;
  interval: any;
  isResendDisabled: boolean = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: Auth
  ) { }

  ngOnInit() { }

  // ✅ เมื่อออกจากหน้า ต้องเคลียร์ตัวนับเวลา
  ngOnDestroy() {
    this.stopTimer();
  }

  goBack() {
    if (this.step === 2) {
      this.step = 1;
      this.stopTimer(); // หยุดเวลาเมื่อย้อนกลับ
    } else {
      this.router.navigate(['/login']);
    }
  }

  // --- Logic Timer ---
  startTimer() {
    this.stopTimer(); // เคลียร์อันเก่าก่อน
    this.timeLeft = 60;
    this.isResendDisabled = true; // ปิดปุ่มกด

    this.interval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.stopTimer();
        this.isResendDisabled = false; // เปิดปุ่มเมื่อครบเวลา
      }
    }, 1000);
  }

  stopTimer() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  // --- Logic API ---

  // ฟังก์ชันกดปุ่ม "ส่งรหัส OTP ใหม่"
  async resendOTP() {
    await this.requestOTP(true); 
  }

  // 1. ขอ OTP
  async requestOTP(isResend: boolean = false) {
    if (!this.email) {
      this.showAlert('แจ้งเตือน', 'กรุณากรอกอีเมลของบัญชีที่ต้องการกู้คืน');
      return;
    }

    try {
      // เรียก API ขอ OTP
      const res: any = await this.authService.reqOTP(this.email);
      console.log('OTP Res:', res);
      
      // ✅ เริ่มนับเวลาถอยหลังทันทีที่ส่งสำเร็จ
      this.startTimer();

      if (!isResend) {
        this.step = 2; // ไปหน้ากรอก OTP
      } else {
        this.showAlert('สำเร็จ', 'ส่งรหัส OTP ใหม่เรียบร้อยแล้ว');
      }

    } catch (error: any) {
      console.error(error);
      this.showAlert('ผิดพลาด', 'ไม่พบอีเมลนี้ในระบบ หรือเกิดข้อผิดพลาด');
    }
  }

  // 2. ยืนยัน OTP และ กู้คืนบัญชี
  async verifyAndRecover() {
    if (!this.otpInput) {
      this.showAlert('แจ้งเตือน', 'กรุณากรอกรหัส OTP');
      return;
    }

    try {
      // 2.1 ยืนยัน OTP
      const verifyRes: any = await this.authService.verifyOTP(this.email, this.otpInput);
      console.log('Verify Res:', verifyRes);
      console.log(this.otpInput);

      // ✅ 2.2 เรียก API กู้คืนบัญชี (ส่ง Email แทน ID)
      // (ต้องแน่ใจว่าไฟล์ auth.ts แก้ไขให้ recoverAccount รับ string แล้วนะครับ)
      const recoverRes = await this.authService.recoverAccount(this.email, true);
      console.log('Recover Res:', recoverRes);

      // 3. สำเร็จ -> แจ้งเตือนและกลับหน้า Login
      const alert = await this.alertController.create({
        header: 'กู้คืนสำเร็จ',
        subHeader: '✅',
        message: 'บัญชีของคุณเปิดใช้งานเรียบร้อยแล้ว สามารถเข้าสู่ระบบได้ทันที',
        buttons: [{
          text: 'ตกลง',
          handler: () => {
            this.router.navigate(['/login']);
          }
        }]
      });
      await alert.present();

    } catch (error: any) {
      console.error(error);
      this.showAlert('ผิดพลาด', 'รหัส OTP ไม่ถูกต้อง หรือกู้คืนไม่สำเร็จ');
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