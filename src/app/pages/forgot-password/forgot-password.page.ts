import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ModalController } from '@ionic/angular';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';
import { addIcons } from 'ionicons';
import { arrowBack, mail, key, arrowForward, checkmarkCircle, eye, eyeOff } from 'ionicons/icons';

// ✅ Import Modal OTP
import { OtpModalComponent } from '../../components/otp-modal/otp-modal.component';
import { SuccessModalComponent } from '../../components/success-modal/success-modal.component';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule, SuccessModalComponent],
})
export class ForgotPasswordPage implements OnInit {
  
  step: number = 1; // 1=กรอกอีเมล, 2=ตั้งรหัสใหม่
  email: string = '';
  
  // Step 2 Data
  newPassword: string = '';
  confirmPassword: string = '';

  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  showSuccessModal: boolean = false;
  isLoggedIn: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private modalCtrl: ModalController, // ✅ เพิ่ม ModalController
    private authService: Auth
  ) {
    addIcons({ arrowBack, mail, key, arrowForward, checkmarkCircle ,eye ,eyeOff});
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      }
    });
  }

  ionViewWillEnter() {
    this.isLoggedIn = !!localStorage.getItem('loggedIn');
    // Reset state in case page is cached by Ionic
    this.step = 1;
    this.newPassword = '';
    this.confirmPassword = '';
    
    // Read email from query params again just in case
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (emailParam) {
      this.email = emailParam;
    } else {
      this.email = '';
    }
  }
toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  
  goBack() {
    // ถ้าล็อกอยู่แล้ว (มี loggedIn ใน localStorage) ให้กลับไป /my-account
    const isLoggedIn = !!localStorage.getItem('loggedIn');
    if (isLoggedIn) {
      this.router.navigate(['/my-account']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  // STEP 1: ขอ OTP และเปิด Modal
  async requestOTP() {
    if (!this.email) {
      this.showAlert('แจ้งเตือน', 'กรุณากรอกอีเมล');
      return;
    }

    try {
      // 1. เรียก API ขอ OTP
// ✅ ของใหม่ (เรียกใช้ reqOTP_Recover)
      await this.authService.reqOTP_Recover(this.email);
      // 2. ✅ เปิด Modal OTP (ใช้ตัวเดียวกับ Register)
      const modal = await this.modalCtrl.create({
        component: OtpModalComponent,
        componentProps: { email: this.email },
        backdropDismiss: false
      });

      await modal.present();

      // 3. รอผลลัพธ์จาก Modal (เมื่อกดยืนยันใน Modal ผ่าน)
      const { data } = await modal.onWillDismiss();

      if (data && data.success) {
        // ถ้า OTP ผ่าน -> ไปหน้าตั้งรหัสใหม่ (Step 2)
        this.step = 2;
      }

    } catch (error: any) {
      console.error(error);
      this.showAlert('ข้อผิดพลาด', 'ไม่พบอีเมลในระบบ หรือเกิดข้อผิดพลาด');
    }
  }

  // STEP 2: บันทึกรหัสผ่านใหม่
  async confirmReset() {
    // Validation
    const regex = /^[a-zA-Z0-9]{8,}$/;
    if (!regex.test(this.newPassword)) {
      this.showAlert('รูปแบบไม่ถูกต้อง', 'รหัสผ่านต้องเป็นตัวอักษร a-z, A-Z และตัวเลข 0-9 รวมกันอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showAlert('ผิดพลาด', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    try {
      // ✅ เรียก API เปลี่ยนรหัสผ่าน (ส่ง verify=true เพราะผ่าน OTP แล้ว)
      await this.authService.resetPassword(this.email, this.newPassword, true);

      this.successAndRedirect();

    } catch (error: any) {
      console.error(error);
      this.showAlert('ผิดพลาด', 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    }
  }

  async successAndRedirect() {
    this.showSuccessModal = true;
  }

  async handleSuccessConfirm() {
    this.showSuccessModal = false;
    if (this.isLoggedIn) {
      this.router.navigate(['/my-account']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  handleSuccessCancel() {
    this.showSuccessModal = false;
    localStorage.removeItem('loggedIn');
    this.router.navigate(['/login']);
  }

  async showAlert(header: string, msg: string) {
    const alert = await this.alertController.create({
      header: header,
      message: msg,
      buttons: ['ตกลง'],
    });
    await alert.present();
  }
}