import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ModalController } from '@ionic/angular'; // ✅ เพิ่ม ModalController
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { UserRegPostReq } from '../../model/req/user_reg_post_req';

// Import Icons
import { addIcons } from 'ionicons';
import { arrowBack, person, key, call, mail, arrowForward } from 'ionicons/icons';

// ✅ Import Modal
import { OtpModalComponent } from '../../components/otp-modal/otp-modal.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class RegisterPage implements OnInit {

  // ไม่ต้องมี step แล้ว เพราะ OTP เด้งเป็น Modal แทน
  // Form Data
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  phone: string = '';
  
  // ❌ ลบตัวแปร otpInput ออก เพราะไปใช้ใน Modal

  tempUserData: any = null;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private modalCtrl: ModalController, // ✅ เพิ่ม
    private authService: Auth
  ) {
    addIcons({ arrowBack, person, key, call, mail, arrowForward }); 
  }

  ngOnInit() {}

  goBack() {
    this.router.navigate(['/login']); 
  }

  // ฟังก์ชันเดียวจบ: กรอกข้อมูล -> กดถัดไป -> เด้ง OTP -> จบงาน
  async onNextStep() {
    // 1. Validation
    if(!this.username || !this.email || !this.password || !this.phone) {
      this.showAlert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.showAlert('แจ้งเตือน', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    const userData: UserRegPostReq = {
      username: this.username,
      email: this.email,
      password: this.password,
      phone: this.phone
    };

    try {
      // 2. เรียก registerSec1 
      this.tempUserData = await this.authService.register(userData);
      
      // 3. เรียกขอ OTP
      await this.authService.reqOTP(this.email);

      // 4. ✅ เปิด Modal OTP (แบบเดียวกับ Forgot Password)
      const modal = await this.modalCtrl.create({
        component: OtpModalComponent,
        componentProps: { email: this.email },
        backdropDismiss: false
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

  // แยกฟังก์ชันบันทึกข้อมูลออกมา
  async finishRegister() {
    try {
       const isVerified = true; 

       if (this.tempUserData) {
          await this.authService.registerSec2(this.tempUserData, isVerified);
       } else {
          throw new Error("ไม่พบข้อมูลผู้ใช้");
       }

       // Alert สำเร็จ -> ไป Login
       const alert = await this.alertController.create({
        header: 'สมัครสมาชิกสำเร็จ',
        subHeader: '✅',
        message: 'บัญชีของคุณถูกสร้างเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ',
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
      this.showAlert('ผิดพลาด', 'การบันทึกล้มเหลว');
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