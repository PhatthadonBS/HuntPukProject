import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonicModule, 
  AlertController, 
  ModalController
} from '@ionic/angular'; // 🌟 เอา LoadingController ออกแล้ว
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { UserRegPostReq } from '../../model/req/user_reg_post_req';
import Swal from 'sweetalert2';

// Import Icons
import { addIcons } from 'ionicons';
import { arrowBack, person, key, call, mail, arrowForward, eye, eyeOff } from 'ionicons/icons';

// Import Modal Component
import { OtpModalComponent } from '../../components/otp-modal/otp-modal.component';

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

  roleId: number = 2; // 2=ผู้เช่า, 3=เจ้าของหอ
  tempUserData: UserRegPostReq | null = null; 

  constructor(
    private router: Router,
    private alertController: AlertController,
    private modalCtrl: ModalController,
    private authService: Auth
    // 🌟 เอา private loadingCtrl ออกไปแล้วครับ
  ) {
    addIcons({ arrowBack, person, key, call, mail, arrowForward, eye, eyeOff });
  }

  ngOnInit() { }

  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }
  goBack() { this.router.navigate(['/login']); }

  isValidEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return re.test(email);
  }

  isValidPhone(phone: string): boolean {
    const re = /^0[0-9]{9}$/;
    return re.test(phone);
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['ตกลง'],
    });
    await alert.present();
  }

  // ==========================================
  // 🌟 STEP 1: กดปุ่มสมัครสมาชิก
  // ==========================================
  async onNextStep() {
    if (this.isSubmitting) return;

    this.emailError = false;
    this.passwordError = false;

    if (!this.username || !this.email || !this.password || !this.confirmPassword || !this.phone) {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบ',
        text: 'กรุณากรอกข้อมูลให้ครบทุกช่อง',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#ffc107',
        background: '#1a1a1a',
        color: '#fff'
      });
      return;
    }
    if (!this.isValidEmail(this.email)) {
      this.emailError = true;
      return;
    }
    const passRegex = /^[a-zA-Z0-9]{8,}$/; 
    if (!passRegex.test(this.password)) {
      this.passwordError = true;
      return;
    }
    if (this.password !== this.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'รหัสผ่านไม่ตรงกัน',
        text: 'กรุณายืนยันรหัสผ่านใหม่อีกครั้ง',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#ffc107',
        background: '#1a1a1a',
        color: '#fff'
      });
      return;
    }
    if (!this.isValidPhone(this.phone)) {
      Swal.fire({
        icon: 'error',
        title: 'เบอร์โทรศัพท์ไม่ถูกต้อง',
        text: 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#ffc107',
        background: '#1a1a1a',
        color: '#fff'
      });
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
        const msg = err?.error?.message || err?.message || 'อีเมลหรือเบอร์โทรนี้ถูกใช้งานแล้ว';
        Swal.fire({
          icon: 'error',
          title: 'สมัครไม่สำเร็จ',
          text: msg,
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#ffc107',
          background: '#1a1a1a',
          color: '#fff'
        });
        this.isSubmitting = false;
        return;
      }

      const rawSec1 = hashedData?.data || hashedData;
      const bcryptRegex = /^\$2b\$10\$.{20,}/;
      const isHashed = bcryptRegex.test(rawSec1?.password || '');
      // Update tempUserData with hashed password so we don't have to hash it again
      this.tempUserData = isHashed ? { ...this.tempUserData, password: rawSec1.password } : this.tempUserData;

      console.log('🚀 โค้ดวิ่งทะลุไปยิง API ส่งอีเมลแล้ว (ไม่มี Loading กวนใจ!)...');
      await this.authService.reqOTP_Register(this.email);
      console.log('✅ API ส่งอีเมลสำเร็จ!');
      
      // หน่วงเวลาให้ UI หายใจนิดนึง แล้วเปิด OTP
      setTimeout(() => {
        this.openOtpModal();
      }, 300);
      
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

      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถสมัครได้',
        text: errorMsg,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#ffc107',
        background: '#1a1a1a',
        color: '#fff'
      });
      this.isSubmitting = false; // ถ้า Error ให้ปลดล็อกปุ่มทันที
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

       await Swal.fire({
         icon: 'success',
         title: 'สำเร็จ!',
         text: 'สมัครสมาชิกและยืนยันตัวตนเรียบร้อยแล้ว',
         confirmButtonText: 'ไปหน้าเข้าสู่ระบบ',
         confirmButtonColor: '#28a745',
         background: '#1a1a1a',
         color: '#fff',
         timer: 3000,
         timerProgressBar: true
       });
       this.router.navigate(['/login']);

    } catch (error: any) {
      console.error('❌ บันทึกข้อมูลพลาด:', error);
      const msg = error?.error?.message || error?.message || 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      Swal.fire({
        icon: 'error',
        title: 'ผิดพลาด',
        text: msg,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#ffc107',
        background: '#1a1a1a',
        color: '#fff'
      });
    } finally {
      this.isSubmitting = false;
    }
  }
}