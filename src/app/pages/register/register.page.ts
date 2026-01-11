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

import { addIcons } from 'ionicons';
import { arrowBack, person, key, call, mail, arrowForward, eye, eyeOff } from 'ionicons/icons';

// ✅ Import Modal
import { OtpModalComponent } from '../../components/otp-modal/otp-modal.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  // ✅ ต้องใส่ OtpModalComponent ในนี้ ไม่งั้น Error
  imports: [CommonModule, FormsModule, IonicModule, OtpModalComponent]
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

  goBack() { this.router.navigate(['/login']); }
  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  async onNextStep() {
    // 1. Validation
    if(!this.username || !this.email || !this.password || !this.phone) {
      this.showAlert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    // Regex Check ... (ตัดละไว้ในฐานที่เข้าใจ) ...

    const userData: UserRegPostReq = {
      username: this.username,
      email: this.email,
      password: this.password,
      phone: this.phone
    };

    const loading = await this.loadingCtrl.create({ 
        message: 'กำลังตรวจสอบข้อมูล...', 
        spinner: 'crescent'
    });
    await loading.present();

    try {
      // -----------------------------------------------------------
      // Step 1: เรียก Register ก่อน (เพื่อเช็ค User ซ้ำ และ Save Temp)
      // -----------------------------------------------------------
      this.tempUserData = await this.authService.register(userData);
      
      // ถ้าผ่าน Step 1 มาได้ แปลว่า User ไม่ซ้ำ -> เปลี่ยนข้อความ Loading
      loading.message = 'กำลังส่งรหัส OTP...'; 

      // -----------------------------------------------------------
      // Step 2: ค่อยยิงส่ง OTP (ชัวร์กว่า)
      // -----------------------------------------------------------
      await this.authService.reqOTP(this.email);

      // เสร็จหมดแล้ว ปิด Loading
      await loading.dismiss();

      // -----------------------------------------------------------
      // Step 3: เปิด Modal
      // -----------------------------------------------------------
      const modal = await this.modalCtrl.create({
        component: OtpModalComponent,
        componentProps: { email: this.email },
        backdropDismiss: false
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();
      if (data && data.success) {
        await this.finishRegister();
      }
      
    } catch (error: any) {
      await loading.dismiss(); // ปิด Loading เสมอ
      console.error(error);
      const msg = error.error?.message || error.message || 'เกิดข้อผิดพลาด';
      
      if(msg.includes('Duplicate') || msg.includes('email')) {
         this.showAlert('แจ้งเตือน', 'อีเมลนี้ถูกใช้งานแล้ว');
      } else {
         this.showAlert('ผิดพลาด', 'ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่');
      }
    }
  }

  // ... (ฟังก์ชัน finishRegister และ showAlert เหมือนเดิม) ...
  async finishRegister() {
    const loading = await this.loadingCtrl.create({ message: 'กำลังสร้างบัญชี...' });
    await loading.present();
    try {
       if (this.tempUserData) {
          await this.authService.registerSec2(this.tempUserData, true);
       } else {
          throw new Error("ไม่พบข้อมูลผู้ใช้");
       }
       await loading.dismiss();
       const alert = await this.alertController.create({
        header: 'สำเร็จ',
        subHeader: '✅',
        message: 'สร้างบัญชีเรียบร้อยแล้ว',
        buttons: [{
          text: 'ตกลง',
          handler: () => { this.router.navigate(['/login']); }
        }],
        cssClass: 'custom-success-alert'
      });
      await alert.present();
    } catch (error: any) {
      await loading.dismiss();
      this.showAlert('ผิดพลาด', 'บันทึกข้อมูลไม่สำเร็จ');
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