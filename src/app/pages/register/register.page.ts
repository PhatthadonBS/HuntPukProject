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

  roleId: number = 2; // 2=ผู้เช่า, 3=เจ้าของหอ
  tempUserData: UserRegPostReq | null = null; 

  constructor(
    private router: Router,
    private alertController: AlertController,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private authService: Auth
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
    const re = /^[0-9]{10}$/;
    return re.test(phone);
  }

  async showAlert(header: string, message: string) {
    console.log('📢 กำลังเปิดกล่องแจ้งเตือน:', header, message);
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
    console.log('--- 🟢 เริ่มกดปุ่มสมัครสมาชิก ---');

    if (this.isSubmitting) {
      console.log('🚫 ปุ่มถูกล็อกอยู่ ไม่สามารถกดซ้ำได้');
      return;
    }

    if (!this.username || !this.email || !this.password || !this.confirmPassword || !this.phone) {
      this.showAlert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    if (!this.isValidEmail(this.email)) {
      this.showAlert('อีเมลไม่ถูกต้อง', 'กรุณากรอกรูปแบบอีเมลให้ถูกต้อง');
      return;
    }
    const passRegex = /^[a-zA-Z0-9]{8,}$/; 
    if (!passRegex.test(this.password)) {
      this.showAlert('รหัสผ่านไม่ถูกต้อง', 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร (a-z, A-Z, 0-9)');
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

    console.log('✅ ข้อมูลผ่านการตรวจสอบ! กำลังเตรียมส่ง API...');

    this.tempUserData = {
      username: this.username,
      email: this.email,
      password: this.password,
      phone: this.phone, 
      role_type_id: this.roleId 
    };

    this.isSubmitting = true;
    let loading: HTMLIonLoadingElement | null = null;

    try {
      loading = await this.loadingCtrl.create({ message: 'กำลังตรวจสอบข้อมูล...' });
      loading.present(); // 🌟 พระเอกอยู่ตรงนี้: เอาคำว่า await ออก ระบบจะได้ไม่ค้าง!
      console.log('⏳ เปิดหน้าต่าง Loading สำเร็จ โค้ดวิ่งทะลุแล้ว!');

      console.log('🚀 กำลังเรียก API ส่งอีเมล OTP...');
      await this.authService.reqOTP_Register(this.email);
      console.log('✅ API ส่งอีเมลสำเร็จ!');
      
      if (loading) {
        await loading.dismiss().catch(() => {});
        loading = null;
      }

      setTimeout(() => {
        console.log('🌟 กำลังเรียกคำสั่งเปิด Modal OTP...');
        this.openOtpModal();
      }, 300);
      
    } catch (error: any) {
      console.log('💥 API เกิด Error:', error);
      if (loading) {
        await loading.dismiss().catch(() => {});
        loading = null;
      }

      let errorMsg = 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง';
      
      try {
        const parsed = JSON.parse(error.message);
        const rawError = parsed.error || parsed.message;
        
        if (typeof rawError === 'string') {
          errorMsg = rawError;
        } else if (typeof rawError === 'object') {
          errorMsg = rawError.message || rawError.error || JSON.stringify(rawError);
        }
      } catch (e) {
        errorMsg = error.message || errorMsg;
      }

      if (errorMsg === '[object Object]') {
         errorMsg = 'อีเมลนี้เป็นสมาชิกอยู่แล้ว หรือ รูปแบบข้อมูลซ้ำซ้อนในระบบ';
      }

      setTimeout(() => {
        this.showAlert('ไม่สามารถสมัครได้', errorMsg);
      }, 300);
      
    } finally {
      this.isSubmitting = false; 
    }
  }

  // ==========================================
  // 🌟 STEP 2: หน้าต่างกรอก OTP
  // ==========================================
  async openOtpModal() {
    console.log('📱 เข้าสู่ฟังก์ชัน openOtpModal()');
    const modal = await this.modalCtrl.create({
      component: OtpModalComponent,
      cssClass: 'otp-modal-css',
      backdropDismiss: true, 
      componentProps: { email: this.email }
    });

    await modal.present();
    console.log('✅ เปิด Modal OTP สำเร็จ');

    const { data } = await modal.onWillDismiss();
    console.log('🔒 ปิด Modal OTP แล้ว ได้ข้อมูล:', data);

    if (data && data.success) {
      await this.finishRegister();
    }
  }

  // ==========================================
  // 🌟 STEP 3: บันทึกลงฐานข้อมูล + แจ้งเตือนสำเร็จ
  // ==========================================
  async finishRegister() {
    let loading: HTMLIonLoadingElement | null = null;
    console.log('💾 กำลังบันทึกข้อมูลผู้ใช้ลงฐานข้อมูล...');

    try {
       loading = await this.loadingCtrl.create({ message: 'กำลังสร้างบัญชี...' });
       loading.present(); // 🌟 เอา await ออกเพื่อกันค้างเช่นเดียวกันครับ

       if (this.tempUserData) {
          try {
            await this.authService.register(this.tempUserData);
          } catch (err: any) { } 
          
          await this.authService.registerSec2(this.tempUserData, true);
       }

       if (loading) {
         await loading.dismiss().catch(() => {});
         loading = null;
       }

       console.log('🎉 บันทึกสำเร็จ!');
       const alert = await this.alertController.create({
        header: 'สำเร็จ!',
        subHeader: '✅',
        message: 'สมัครสมาชิกและยืนยันตัวตนเรียบร้อยแล้ว',
        buttons: [
          {
            text: 'ไปหน้าเข้าสู่ระบบ',
            handler: () => { this.router.navigate(['/login']); }
          }
        ],
      });
      await alert.present();

    } catch (error: any) {
      if (loading) {
        await loading.dismiss().catch(() => {});
        loading = null;
      }
      console.error('❌ บันทึกข้อมูลพลาด:', error);
      this.showAlert('ผิดพลาด', 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  }
}