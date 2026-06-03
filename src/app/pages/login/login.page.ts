import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ViewDidEnter } from '@ionic/angular';
import { Auth } from '../../services/auth';
import { addIcons } from 'ionicons';
import { arrowBack, key, person, eye, eyeOff, logInOutline, checkmark } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
})
export class LoginPage implements OnInit, ViewDidEnter {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;
  rememberMe: boolean = false;

  @ViewChild('emailInput', { static: false }) emailInput!: ElementRef;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: Auth
  ) {
    addIcons({ arrowBack, person, key, eye, eyeOff, logInOutline, checkmark });
  }

  ngOnInit() {
    const remembered = localStorage.getItem('rememberLogin');
    if (remembered) {
      try {
        const data = JSON.parse(remembered);
        this.email      = data.email    || '';
        this.password   = data.password || '';
        this.rememberMe = true;
      } catch {}
    }
  }

  ionViewDidEnter() {
    setTimeout(() => this.emailInput?.nativeElement?.focus(), 150);
  }

  togglePasswordVisibility() { this.showPassword = !this.showPassword; }
  goHome() { this.router.navigate(['/home']); }

  async login() {
    if (this.isLoading) return;

    if (!this.email?.trim()) {
      this.showAlert('กรอกข้อมูลไม่ครบ', 'กรุณาระบุอีเมลของคุณ');
      setTimeout(() => this.emailInput?.nativeElement?.focus(), 100);
      return;
    }
    if (!this.password) {
      this.showAlert('กรอกข้อมูลไม่ครบ', 'กรุณาระบุรหัสผ่าน');
      return;
    }

    this.isLoading = true;

    try {
      const normalizedEmail = this.email.trim().toLowerCase();
      const res = (await this.authService.login(normalizedEmail, this.password)) as any;

      if (res && res.logged_in) {
        const roleId = res.user.role_id;
        const status = res.user.accout_status;

        if ((roleId === 1 || roleId === 2 || roleId === 3) && status === 0) {
          const userData = {
            loggedIn: true,
            id: res.user.id,
            email: normalizedEmail,
            username: res.user.username,
            role_id: res.user.role_id,
            accout_status: res.user.accout_status,
            phone: res.user.phone,
            token: res.token,
            // ✅ Flag ให้หน้าปลายทางโชว์ welcome popup ครั้งเดียว
            showWelcome: true
          };
          localStorage.setItem('loggedIn', JSON.stringify(userData));

          if (this.rememberMe) {
            localStorage.setItem('rememberLogin', JSON.stringify({
              email: normalizedEmail,
              password: this.password
            }));
          } else {
            localStorage.removeItem('rememberLogin');
          }

          // ✅ navigate ไปหน้าปลายทาง ให้หน้านั้นโชว์ popup เอง
          if (roleId === 3) {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/home']);
          }

        } else {
          this.showAlert('เข้าสู่ระบบไม่สำเร็จ', 'บัญชีของคุณถูกระงับหรือไม่มีสิทธิ์เข้าใช้งาน');
          localStorage.removeItem('loggedIn');
        }
      } else {
        this.showAlert('เข้าสู่ระบบไม่สำเร็จ', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      }

    } catch (error: any) {
      const serverMessage = error.error?.message || error.error || error.message || '';
      let displayMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
      if (serverMessage.includes('ไม่มีข้อมูล') || error.status === 404)
        displayMsg = 'ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบอีกครั้ง';
      else if (serverMessage.includes('รหัสผ่าน') || error.status === 401)
        displayMsg = 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
      else if (error.status === 500)
        displayMsg = 'ระบบเซิร์ฟเวอร์ขัดข้องชั่วคราว กรุณาลองใหม่ภายหลัง';
      else if (typeof serverMessage === 'string' && serverMessage.length > 0)
        displayMsg = serverMessage;
      this.showAlert('พบข้อผิดพลาด', displayMsg);
    } finally {
      this.isLoading = false;
    }
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header, message, buttons: ['ตกลง'], cssClass: 'custom-alert',
    });
    await alert.present();
  }
}