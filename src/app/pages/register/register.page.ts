import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonicModule, 
  AlertController, 
  ModalController
} from '@ionic/angular';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { UserRegPostReq } from '../../model/req/user_reg_post_req';

// Import Icons
import { addIcons } from 'ionicons';
import { arrowBack, person, key, call, mail, arrowForward, eye, eyeOff } from 'ionicons/icons';

// Import Modal Component
import { OtpModalComponent } from '../../components/otp-modal/otp-modal.component';
import { AlertModalComponent } from '../../components/alert-modal/alert-modal.component';

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

  async showAlert(header: string, message: string, type: 'success'|'warning'|'error'|'info' = 'warning') {
    const modal = await this.modalCtrl.create({
      component: AlertModalComponent,
      cssClass: 'auto-height-modal',
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
  async onNextStep() {
    if (this.isSubmitting) return;

    this.emailError = false;
    this.passwordError = false;

    if (!this.username || !this.email || !this.password || !this.confirmPassword || !this.phone) {
      this.showAlert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
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
        const msg = err?.error?.message || err?.message || 'อีเมลหรือเบอร์โทรนี้ถูกใช้งานแล้ว';
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
      await this.showTermsAndConditions();

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

  // ==========================================
  // 🌟 แสดงข้อตกลงและเงื่อนไขการใช้งานก่อนไปหน้า OTP
  // ==========================================
  async showTermsAndConditions() {
    const alert = await this.alertController.create({
      header: 'ข้อตกลงและเงื่อนไขการใช้งานเว็บแอปพลิเคชัน HuntPuk',
      message: `
        <div style="text-align: left; max-height: 50vh; overflow-y: auto; font-size: 14px; line-height: 1.6;">
          <p style="margin-bottom: 12px">
            <strong>1. บทนำและการยอมรับข้อตกลง</strong><br />
            &emsp;ยินดีต้อนรับสู่แอปพลิเคชัน HuntPuk การที่คุณดาวน์โหลด ติดตั้ง หรือใช้งานแอปพลิเคชันนี้ ถือว่าคุณได้อ่าน เข้าใจ และยอมรับที่จะผูกพันตามข้อตกลงและเงื่อนไขการใช้งานฉบับนี้ทุกประการ
          </p>
          <p style="margin-bottom: 12px">
            <strong>2. วัตถุประสงค์ของการให้บริการ</strong><br />
            &emsp;HuntPuk เป็นเพียง "สื่อกลาง" ในการรวบรวมและแสดงข้อมูลหอพักรอบมหาวิทยาลัย แอปพลิเคชันไม่มีส่วนเกี่ยวข้องในการทำธุรกรรม การทำสัญญาเช่า หรือการรับ-จ่ายเงินมัดจำใดๆ ระหว่างผู้เช่าและผู้ให้เช่าทั้งสิ้น
          </p>
          <p style="margin-bottom: 12px">
            <strong>3. การสมัครสมาชิกและความปลอดภัยของบัญชี</strong><br />
            &emsp;ผู้ใช้งานต้องให้ข้อมูลที่เป็นความจริง ถูกต้อง และรักษารหัสผ่านของตนเองให้เป็นความลับ
          </p>
          <p style="margin-bottom: 12px">
            <strong>4. กฎระเบียบและข้อควรปฏิบัติของผู้ใช้งาน</strong><br />
            &emsp;ห้ามมิให้ลงประกาศหอพักปลอม หรือมีเจตนาหลอกลวง หากตรวจสอบพบทางแอปพลิเคชันมีสิทธิ์ลบบัญชีทันที
            &emsp;สำหรับนิสิต/นักศึกษาโปรดใช้วิจารณญาณในการตัดสินใจ แอปพลิเคชันเป็นเพียงสื่อกลางเท่านั้น ผู้ใช้งานควรตรวจสอบสถานที่จริงและรายละเอียดสัญญากับเจ้าของหอพักโดยตรงก่อนทำการโอนเงินมัดจำทุกครั้ง
          </p>
          <p style="margin-bottom: 12px">
            <strong>5. สิทธิในทรัพย์สินทางปัญญา</strong><br />
            &emsp;ข้อมูล รูปภาพ หรือข้อความที่ผู้ใช้งานอัปโหลดลงในระบบ ผู้ใช้งานจะต้องเป็นเจ้าของลิขสิทธิ์ หรือได้รับอนุญาตอย่างถูกต้อง
          </p>
          <p style="margin-bottom: 12px">
            <strong>6. ข้อจำกัดความรับผิดชอบ</strong><br />
            &emsp;แอปพลิเคชัน HuntPuk จะไม่รับผิดชอบต่อความเสียหายใดๆ รวมถึงการถูกหลอกลวงจากการทำธุรกรรมระหว่างผู้เช่าและเจ้าของหอพัก
          </p>
          <p style="margin-bottom: 12px">
            <strong>7. นโยบายความเป็นส่วนตัว</strong><br />
            &emsp;ทางแอปพลิเคชันจะเก็บรวบรวมข้อมูลส่วนบุคคลของคุณ เพื่อใช้ในการให้บริการและพัฒนาแอปพลิเคชันเท่านั้น
          </p>
          <p style="margin-bottom: 12px">
            <strong>8. การยกเลิกบัญชีผู้ใช้</strong><br />
            &emsp;เราขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีผู้ใช้งานทันที หากตรวจพบการละเมิดข้อตกลง
          </p>
          <p style="margin-bottom: 12px">
            <strong>9. การเปลี่ยนแปลงข้อตกลง</strong><br />
            &emsp;ทีมผู้พัฒนาขอสงวนสิทธิ์ในการแก้ไขหรือเปลี่ยนแปลงข้อตกลงนี้ได้ตลอดเวลา
          </p>
        </div>
      `,
      inputs: [
        {
          name: 'accept',
          type: 'checkbox',
          label: 'ฉันได้อ่านและยอมรับข้อตกลงและเงื่อนไข',
          value: 'accepted'
        }
      ],
      buttons: [
        {
          text: 'ยกเลิก',
          role: 'cancel',
          handler: () => {
            this.isSubmitting = false;
          }
        },
        {
          text: 'ยอมรับและดำเนินการต่อ',
          handler: async (data) => {
            if (data && data.includes('accepted')) {
              this.isSubmitting = true;
              await this.authService.reqOTP_Register(this.email);
              console.log('✅ API ส่งอีเมลสำเร็จ!');
              setTimeout(() => {
                this.openOtpModal();
              }, 300);
              return true;
            } else {
              this.showAlert('แจ้งเตือน', 'คุณต้องกดยอมรับข้อตกลงก่อนดำเนินการต่อ');
              return false; // Prevent modal from closing
            }
          }
        }
      ]
    });

    await alert.present();
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
        cssClass: 'auto-height-modal'
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