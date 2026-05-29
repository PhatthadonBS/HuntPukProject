import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'; // 🌟 เพิ่ม ViewChild, ElementRef
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ViewDidEnter } from '@ionic/angular'; // 🌟 เพิ่ม ViewDidEnter
import { Auth } from '../../services/auth';
import { addIcons } from 'ionicons';
import { arrowBack, key, person, eye, eyeOff, logInOutline } from 'ionicons/icons'; 

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
})
export class LoginPage implements OnInit, ViewDidEnter { // 🌟 เพิ่ม ViewDidEnter ตรงนี้
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  
  isLoading: boolean = false;

  // 🌟 ประกาศตัวแปรอ้างอิงไปที่ช่อง input อีเมลในหน้า HTML
  @ViewChild('emailInput', { static: false }) emailInput!: ElementRef;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: Auth
  ) {
    addIcons({ arrowBack, person, key, eye, eyeOff, logInOutline }); 
  }

  ngOnInit() {}

  // 🌟 ฟังก์ชันนี้จะทำงานอัตโนมัติเมื่อหน้า Login สไลด์เปิดขึ้นมาเสร็จสมบูรณ์
  ionViewDidEnter() {
    // หน่วงเวลา 150ms ให้ Animation จบก่อน แล้วค่อยสั่งให้เคอร์เซอร์ไปกระพริบรอที่ช่องอีเมล
    setTimeout(() => {
      if (this.emailInput && this.emailInput.nativeElement) {
        this.emailInput.nativeElement.focus();
      }
    }, 150);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  async login() {
    console.log("🔥 1. เริ่มทำงาน login()");
    
    if (this.isLoading) return;

    if (!this.email || !this.email.trim()) {
      this.showAlert('กรอกข้อมูลไม่ครบ', 'กรุณาระบุอีเมลของคุณ');
      // 🌟 ถ้าผู้ใช้ลืมกรอก ให้โฟกัสกลับไปที่ช่องอีเมลใหม่
      setTimeout(() => this.emailInput?.nativeElement?.focus(), 100);
      return;
    }

    if (!this.password) {
      this.showAlert('กรอกข้อมูลไม่ครบ', 'กรุณาระบุรหัสผ่าน');
      return;
    }

    this.isLoading = true;

    try {
      const res = (await this.authService.login(
        this.email.trim(),
        this.password
      )) as any;

      if (res && res.logged_in) {
        const roleId = res.user.role_id;
        const status = res.user.accout_status; 

        if ((roleId === 1 || roleId === 2 || roleId === 3) && status === 0) {
          const userData = {
            loggedIn: true, 
            id: res.user.id, 
            email: this.email, 
            username: res.user.username,
            role_id: res.user.role_id, 
            accout_status: res.user.accout_status, 
            phone: res.user.phone,
            token: res.token
          };
          
          localStorage.setItem("loggedIn", JSON.stringify(userData));
          
          if (roleId === 3) {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/home']);
          }
        } else {
          this.showAlert('เข้าสู่ระบบไม่สำเร็จ', 'สิทธิ์การใช้งานของคุณไม่ถูกต้อง หรือบัญชีนี้ถูกระงับ');
          localStorage.removeItem("loggedIn");
        }
      } else {
        this.showAlert('เข้าสู่ระบบไม่สำเร็จ', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      }

    } catch (error: any) {
      const serverMessage = error.error?.message || error.error || error.message || '';
      let displayMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';

      if (serverMessage.includes('User not fount') || error.status === 404) {
        displayMsg = 'ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบอีกครั้ง หรือสมัครสมาชิกใหม่';
      } else if (serverMessage.includes('Wrong password') || error.status === 401) {
        displayMsg = 'รหัสผ่านไม่ถูกต้อง กรุณาเช็คความถูกต้องอีกครั้ง';
      } else if (error.status === 500) {
        displayMsg = 'ระบบเซิร์ฟเวอร์ขัดข้องชั่วคราว (Error 500)';
      } else if (typeof serverMessage === 'string' && serverMessage.length > 0) {
        displayMsg = serverMessage;
      }

      this.showAlert('พบข้อผิดพลาด', displayMsg);

    } finally {
      this.isLoading = false;
    }
  }

  skip() {
    this.router.navigate(['/home']);
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['ตกลง'],
      cssClass: 'custom-alert',
    });
    await alert.present();
  }
}