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
      // Step 1: เรียก API Register Sec1 (เพื่อเช็ค User ซ้ำ)
      // -----------------------------------------------------------
      // ต้อง await ตรงนี้ เพราะถ้า User ซ้ำ เราจะไม่ส่ง OTP
      await this.authService.register(userData);
      
      // ✅ แก้ไข: ให้เก็บ Object ข้อมูลที่ user กรอกไว้ (userData) 
      // เพื่อป้องกันกรณี Server คืนค่ามาไม่ครบ แล้วข้อมูลหายตอนบันทึกจริง
      this.tempUserData = userData;

      // -----------------------------------------------------------
      // Step 2: สั่งส่ง OTP แบบ Fire & Forget (ไม่รอ) 🔥
      // -----------------------------------------------------------
      // เอา await ออก เพื่อให้มันทำงาน Background (Modal จะได้เด้งทันที)
      this.authService.reqOTP(this.email).catch(err => {
         console.warn('Background OTP send error:', err);
         // ถ้าส่งไม่ผ่าน User สามารถกด Resend ใน Modal ได้อยู่แล้ว ไม่ต้องซีเรียส
      });

      // -----------------------------------------------------------
      // Step 3: ปิด Loading แล้วเปิด Modal ทันที!
      // -----------------------------------------------------------
      await loading.dismiss();

      const modal = await this.modalCtrl.create({
        component: OtpModalComponent,
        componentProps: { email: this.email }, // ส่งอีเมลไปโชว์
        backdropDismiss: false // ห้ามกดข้างนอกปิด
      });

      await modal.present();

      // รอผลลัพธ์ตอนปิด Modal (User กรอก OTP เสร็จแล้ว)
      const { data } = await modal.onWillDismiss();

      // ถ้า Modal ส่งกลับมาว่า success: true
      if (data && data.success) {
        await this.finishRegister();
      }
      
    } catch (error: any) {
      await loading.dismiss(); // อย่าลืมปิด Loading ถ้า Error
      
      console.error(error);
      const msg = error.error?.message || error.message || 'เกิดข้อผิดพลาด';
      
      // เช็ค Error Message จาก Server
      if(msg.includes('Duplicate') || msg.includes('email')) {
         this.showAlert('ข้อมูลซ้ำ', 'อีเมลนี้ถูกใช้งานแล้ว');
      } else {
         this.showAlert('ผิดพลาด', 'ไม่สามารถทำรายการได้ กรุณาลองใหม่');
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