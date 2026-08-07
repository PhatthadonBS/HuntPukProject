import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonicModule, 
  AlertController, 
  ModalController
} from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth } from '../../services/auth';
import { UserRegPostReq } from '../../model/req/user_reg_post_req';
import { UserService } from '../../services/user';

// Import Icons
import { addIcons } from 'ionicons';
import { arrowBack, person, key, call, mail, arrowForward, eye, eyeOff } from 'ionicons/icons';

// Import Modal Component
import { OtpModalComponent } from '../../components/otp-modal/otp-modal.component';
import { AlertModalComponent } from '../../components/alert-modal/alert-modal.component';
import { TermsModalComponent } from '../../components/terms-modal/terms-modal.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
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
  isSubmitting: boolean = false;
  emailError: boolean = false;
  passwordError: boolean = false;
  usernameError: boolean = false;

  roleId: number = 2; // 2=ผู้เช่า, 3=เจ้าของหอ
  tempUserData: UserRegPostReq | null = null; 
  fromAdmin: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private modalCtrl: ModalController,
    private authService: Auth,
    private userService: UserService
  ) {
    addIcons({ arrowBack, person, key, call, mail, arrowForward, eye, eyeOff });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['fromAdmin'] === 'true' || params['fromAdmin'] === true) {
        this.fromAdmin = true;
        this.roleId = 1; // Default to member role if added by admin
      }
    });
  }

  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }
  goBack() {
    if (this.fromAdmin) {
      this.router.navigate(['/manage-users']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  isValidEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return re.test(email);
  }

  isValidPhone(phone: string): boolean {
    const re = /^0[0-9]{9}$/;
    return re.test(phone);
  }

  async showAlert(header: string, message: string, type: 'success'|'warning'|'error'|'info' = 'warning') {
    const modal = await this.modalCtrl.create({
      component: AlertModalComponent,
      cssClass: 'custom-alert-modal',
      componentProps: {
        title: header,
        message: message,
        type: type
      }
    });
    await modal.present();
    return modal.onDidDismiss();
  }

  // ==========================================
  // 🌟 STEP 1: กดปุ่มสมัครสมาชิก
  // ==========================================
  // 🌟 STEP 1: กดปุ่มสมัครสมาชิก
  // ==========================================
  async onNextStep() {
    if (this.isSubmitting) return;

    this.emailError = false;
    this.passwordError = false;
    this.usernameError = false;

    if (!this.username || !this.email || !this.password || !this.confirmPassword || !this.phone) {
      this.showAlert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    
    if (this.username.length < 3) {
      this.usernameError = true;
      return;
    }
    if (!this.isValidEmail(this.email)) {
      this.emailError = true;
      return;
    }
    const passRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9]{8,}$/; 
    if (!passRegex.test(this.password)) {
      this.passwordError = true;
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.showAlert('รหัสผ่านไม่ตรงกัน', 'กรุณายืนยันรหัสผ่านใหม่อีกครั้ง');
      return;
    }
    if (!this.isValidPhone(this.phone)) {
      this.showAlert('เบอร์โทรศัพท์ไม่ถูกต้อง', 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก');
      return;
    }

    this.tempUserData = {
      username: this.username,
      email: this.email,
      password: this.password,
      phone: this.phone,
      role_type_id: this.roleId 
    };

    this.isSubmitting = true;

    try {
      console.log('🔍 กำลังตรวจสอบข้อมูลอีเมลและเบอร์โทรศัพท์...');
      // ✅ Step 1: เรียก registerSec1 เพื่อเช็คซ้ำและรับ hashed password กลับมา
      let hashedData: any = null;
      try {
        hashedData = await this.authService.register(this.tempUserData);
      } catch (err: any) {
        let msg = 'อีเมลหรือเบอร์โทรนี้ถูกใช้งานแล้ว หรือข้อมูลไม่ถูกต้อง';
        
        const rawError = err?.error;

        // เช็คกรณีเชื่อมต่อ Server ไม่ได้ (Network Error / CORS)
        if (err?.name === 'HttpErrorResponse' && err.status === 0) {
          msg = 'เชื่อมต่อกับเซิร์ฟเวอร์ล้มเหลว กรุณาตรวจสอบอินเทอร์เน็ตหรือลองใหม่อีกครั้ง';
        } else if (rawError?.isTrusted || JSON.stringify(rawError).includes('isTrusted')) {
          msg = 'เชื่อมต่อกับเซิร์ฟเวอร์ล้มเหลว กรุณาตรวจสอบอินเทอร์เน็ตหรือลองใหม่อีกครั้ง';
        } else if (typeof rawError === 'string') {
           try {
             const parsed = JSON.parse(rawError);
             if (parsed.errors && parsed.errors.length > 0 && parsed.errors[0].message) {
               msg = parsed.errors[0].message;
             } else if (parsed.message) {
               msg = parsed.message;
             }
           } catch (e) {
             msg = rawError;
           }
        } else if (rawError?.errors && rawError.errors.length > 0 && rawError.errors[0].message) {
          msg = rawError.errors[0].message;
        } else if (rawError?.message) {
          msg = rawError.message;
        } else if (err?.message) {
          msg = err.message;
        }

        if (msg === '[object Object]') msg = 'อีเมลนี้เป็นสมาชิกอยู่แล้ว หรือ รูปแบบข้อมูลซ้ำซ้อนในระบบ';

        this.showAlert('สมัครไม่สำเร็จ', msg, 'error');
        this.isSubmitting = false;
        return;
      }

      const rawSec1 = hashedData?.data || hashedData;
      const bcryptRegex = /^\$2b\$10\$.{20,}/;
      const isHashed = bcryptRegex.test(rawSec1?.password || '');
      // Update tempUserData with hashed password so we don't have to hash it again
      this.tempUserData = isHashed ? { ...this.tempUserData, password: rawSec1.password } : this.tempUserData;

      console.log('🚀 โค้ดวิ่งทะลุไปยิง API ส่งอีเมลแล้ว...');
      
      this.isSubmitting = false; // ปลดล็อกปุ่มให้ Alert ทำงานได้ปกติ
      
      if (this.fromAdmin) {
        await this.finishRegisterAdmin(hashedData);
      } else {
        await this.showTermsAndConditions();
      }

    } catch (error: any) {
      console.log('💥 API เกิด Error:', error);
      let errorMsg = 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง';
      try {
        const parsed = JSON.parse(error.message);
        const rawError = parsed.error || parsed.message;
        if (typeof rawError === 'string') errorMsg = rawError;
        else if (typeof rawError === 'object') errorMsg = rawError.message || rawError.error || JSON.stringify(rawError);
      } catch (e) {
        errorMsg = error.message || errorMsg;
      }
      if (errorMsg === '[object Object]') errorMsg = 'อีเมลนี้เป็นสมาชิกอยู่แล้ว หรือ รูปแบบข้อมูลซ้ำซ้อนในระบบ';

      this.showAlert('ไม่สามารถสมัครได้', errorMsg, 'error');
      this.isSubmitting = false; // ถ้า Error ให้ปลดล็อกปุ่มทันที
    } 
  }

  async finishRegisterAdmin(sec1Result: any) {
    this.isSubmitting = true;
    try {
       await this.userService.registerSec2Admin(sec1Result);
       
       const alert = await this.modalCtrl.create({
        component: AlertModalComponent,
        componentProps: {
          title: 'สำเร็จ!',
          message: 'เพิ่มสมาชิกเรียบร้อยแล้ว',
          type: 'success'
        },
        cssClass: 'custom-alert-modal'
       });
       await alert.present();
       await alert.onDidDismiss();
       this.router.navigate(['/manage-users']);
    } catch (error: any) {
       console.error('❌ บันทึกข้อมูลพลาด:', error);
       const msg = error?.error?.message || error?.message || 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
       this.showAlert('ผิดพลาด', msg, 'error');
    } finally {
       this.isSubmitting = false;
    }
  }

  // ==========================================
  // 🌟 แสดงข้อตกลงและเงื่อนไขการใช้งานก่อนไปหน้า OTP
  // ==========================================
  async showTermsAndConditions() {
    const modal = await this.modalCtrl.create({
      component: TermsModalComponent,
      cssClass: 'custom-alert-modal'
    });
    
    await modal.present();
    
    const { data } = await modal.onDidDismiss();
    
    if (data && data.accepted) {
      this.isSubmitting = true;
      await this.authService.reqOTP_Register(this.email);
      console.log('✅ API ส่งอีเมลสำเร็จ!');
      setTimeout(() => {
        this.openOtpModal();
      }, 300);
    } else {
      this.isSubmitting = false;
    }
  }

  // ==========================================
  // 🌟 STEP 2: หน้าต่างกรอก OTP
  // ==========================================
  async openOtpModal() {
    const modal = await this.modalCtrl.create({
      component: OtpModalComponent,
      cssClass: 'otp-modal-css',
      backdropDismiss: true, 
      componentProps: { email: this.email }
    });

    await modal.present();
    
    // เมื่อเปิด OTP สำเร็จ ให้ปลดล็อกปุ่มตกลงด้านล่าง
    this.isSubmitting = false; 

    const { data } = await modal.onWillDismiss();

    if (data && data.success) {
      await this.finishRegister();
    }
  }

  // ==========================================
  // 🌟 STEP 3: บันทึกลงฐานข้อมูล + แจ้งเตือนสำเร็จ
  // ==========================================
  async finishRegister() {
    this.isSubmitting = true;
    console.log('💾 กำลังบันทึกข้อมูลผู้ใช้ลงฐานข้อมูล...');

    try {
       if (!this.tempUserData) throw new Error('ไม่พบข้อมูลผู้ใช้ชั่วคราว');

       // ✅ Step 2: ส่ง hashed data ไปบันทึกจริงที่ sec2
       await this.authService.registerSec2(this.tempUserData, true);

       console.log('🎉 บันทึกสำเร็จ!');
       
       // Clear form data
       this.username = '';
       this.email = '';
       this.password = '';
       this.confirmPassword = '';
       this.phone = '';
       this.emailError = false;
       this.passwordError = false;

       const alert = await this.modalCtrl.create({
        component: AlertModalComponent,
        componentProps: {
          title: 'สำเร็จ!',
          message: 'สมัครสมาชิกและยืนยันตัวตนเรียบร้อยแล้ว',
          type: 'success'
        },
        cssClass: 'custom-alert-modal'
       });
       await alert.present();
       await alert.onDidDismiss();
       this.router.navigate(['/login']);

    } catch (error: any) {
      console.error('❌ บันทึกข้อมูลพลาด:', error);
       const msg = error?.error?.message || error?.message || 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
       this.showAlert('ผิดพลาด', msg, 'error');
    } finally {
      this.isSubmitting = false;
    }
  }
}