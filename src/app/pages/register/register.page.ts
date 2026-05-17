import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonicModule, 
  AlertController, 
  ModalController, 
  LoadingController // ✅ Import Loading
} from '@ionic/angular'; 
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { UserRegPostReq } from '../../model/req/user_reg_post_req';

// Import Icons
import { addIcons } from 'ionicons';
import { arrowBack, person, key, call, mail, arrowForward, eye, eyeOff } from 'ionicons/icons';

// ✅ Import Modal Component
import { OtpModalComponent } from '../../components/otp-modal/otp-modal.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  // ✅ ต้องใส่ OtpModalComponent ในนี้ ไม่งั้นเปิด Modal ไม่ขึ้น (สำคัญมาก)
  imports: [CommonModule, FormsModule, IonicModule, OtpModalComponent]
})
export class RegisterPage implements OnInit {

  // Form Data
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  phone: string = '';
  
  // UI Flags
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // ตัวแปรพักข้อมูล
  tempUserData: any = null;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController, // ✅ Inject Loading
    private authService: Auth
  ) {
    addIcons({ arrowBack, person, key, call, mail, arrowForward, eye, eyeOff }); 
  }

  ngOnInit() {}

  goBack() { this.router.navigate(['/home']); }
  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  // --- ฟังก์ชันหลัก ---
  async onNextStep() {
    // 1. Validation (ตรวจสอบความถูกต้อง)
    if(!this.username || !this.email || !this.password || !this.phone) {
      this.showAlert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    // Regex Checks
    const passwordRegex = /^[a-zA-Z0-9]{8}$/;
    if (!passwordRegex.test(this.password)) {
      this.showAlert('รหัสผ่านไม่ถูกต้อง', 'รหัสผ่านต้องเป็นภาษาอังกฤษหรือตัวเลข และมีความยาว 8 ตัวอักษรเท่านั้น');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.showAlert('แจ้งเตือน', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(this.phone)) {
      this.showAlert('เบอร์โทรศัพท์ไม่ถูกต้อง', 'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก (เฉพาะตัวเลข)');
      return;
    }

    // เตรียมข้อมูล
    const userData: UserRegPostReq = {
      username: this.username,
      email: this.email,
      password: this.password,
      phone: this.phone
    };

    // แสดง Loading
    const loading = await this.loadingCtrl.create({ 
        message: 'กำลังตรวจสอบข้อมูล...', 
        spinner: 'crescent'
    });
    await loading.present();

try {
      // -----------------------------------------------------------
      // Step 1: เรียก API Register Sec1 (เพื่อเช็ค User ซ้ำและเข้ารหัสรหัสผ่าน)
      // -----------------------------------------------------------
      // ✅ นำตัวแปรมารับผลลัพธ์จาก Backend 
      const sec1Response: any = await this.authService.register(userData);
      
      // ✅ เก็บ Object ที่มีรหัสผ่านแบบ Hash แล้ว (ที่ Backend ส่งกลับมา) ไปใช้ต่อใน Sec 2
      // (เผื่อกรณี Service คืนค่ามาเป็น .data หรือตัวข้อมูลตรงๆ)
      this.tempUserData = sec1Response.data ? sec1Response.data : sec1Response;

      // -----------------------------------------------------------
      // Step 2: สั่งส่ง OTP แบบ Fire & Forget (ไม่รอ) 🔥
      // -----------------------------------------------------------
      this.authService.reqOTP(this.email).catch(err => {
         console.warn('Background OTP send error:', err);
      });

      // -----------------------------------------------------------
      // Step 3: ปิด Loading แล้วเปิด Modal กรอก OTP ทันที!
      // -----------------------------------------------------------
      await loading.dismiss();

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
      await loading.dismiss(); // ปิดโหลดก่อน
      console.error("🔥 Register Error:", error);
      
      // ✅ ล้วงเอาข้อความ Error จาก Backend ออกมา
      const errorMsg = error.error?.message || error.error || error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      const displayMsg = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
      
      // เช็คคำว่า Duplicate หรือ Email เพื่อแปลงเป็นภาษาไทยให้ผู้ใช้อ่านง่ายๆ
      if(displayMsg.includes('Duplicate') || displayMsg.includes('email') || displayMsg.includes('ถูกใช้งานแล้ว')) {
         this.showAlert('ข้อมูลซ้ำ', 'อีเมลหรือเบอร์โทรศัพท์นี้ถูกใช้งานแล้ว กรุณาใช้ข้อมูลอื่น');
      } else {
         this.showAlert('สมัครสมาชิกไม่สำเร็จ', displayMsg);
      }
    }
  }

  // --- ฟังก์ชันบันทึกข้อมูลจริง (Sec2) ---
  async finishRegister() {
    const loading = await this.loadingCtrl.create({ message: 'กำลังสร้างบัญชี...' });
    await loading.present();

    try {
       if (this.tempUserData) {
          // ส่งข้อมูลไปบันทึกจริง พร้อม flag verify = true
          await this.authService.registerSec2(this.tempUserData, true);
       } else {
          throw new Error("ไม่พบข้อมูลผู้ใช้ชั่วคราว");
       }

       await loading.dismiss();

       // แจ้งเตือนสำเร็จ
       const alert = await this.alertController.create({
        header: 'สมัครสมาชิกสำเร็จ',
        subHeader: '✅',
        message: 'บัญชีของคุณถูกสร้างเรียบร้อยแล้ว',
        buttons: [{
          text: 'ไปหน้าเข้าสู่ระบบ',
          handler: () => { 
            this.router.navigate(['/login']); 
          }
        }],
        cssClass: 'custom-success-alert'
      });
      await alert.present();

    } catch (error: any) {
      await loading.dismiss();
      console.error(error);
      this.showAlert('ผิดพลาด', 'บันทึกข้อมูลไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ');
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