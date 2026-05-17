import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import {
  User,
  UserLoggedInPostRes,
} from '../../model/res/user_loggedIn_post_res';
import { Auth } from '../../services/auth';
import { addIcons } from 'ionicons';
import { arrowBack, key, person, eye, eyeOff } from 'ionicons/icons'; 

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
})
export class LoginPage implements OnInit {
  email: string = ''; // ✅ กลับมาใช้ email
  password: string = '';
  showPassword: boolean = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private loadingCtrl: LoadingController,
    private authService: Auth
  ) {
    addIcons({ arrowBack, person, key, eye, eyeOff }); 
  }

  ngOnInit() {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  async login() {
    if (!this.email || !this.password) {
      this.showAlert('แจ้งเตือน', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'กำลังเข้าสู่ระบบ...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // ✅ ส่งค่า email ในการ Login ตามเดิม
      const res = (await this.authService.login(
        this.email,
        this.password
      )) as UserLoggedInPostRes & { token?: string }; 

      if (res.logged_in) {
        
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
            token: res.token // ✅ เก็บ Token ไว้เพื่อให้ Interceptor นำไปใช้ส่งแนบกับ Request
          };

          localStorage.setItem("loggedIn", JSON.stringify(userData));

          await loading.dismiss();

          if (roleId === 3) {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/home']);
          }

        } else {
          await loading.dismiss();
          this.showAlert('เข้าสู่ระบบไม่สำเร็จ', 'สิทธิ์การใช้งานของคุณไม่ถูกต้อง');
          localStorage.removeItem("loggedIn");
        }
      } else {
        await loading.dismiss();
        this.showAlert('แจ้งเตือน', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }

} catch (error: any) {
      await loading.dismiss();
      console.error("🔥 Login Error:", error);

      // ✅ เปลี่ยนจากข้อความตายตัว มาดึงข้อความจากเซิร์ฟเวอร์ตรง ๆ
      const errorMsg = error.error?.message || error.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
      
      // ตรวจสอบชนิดข้อมูลเผื่อเซิร์ฟเวอร์ส่งกลับมาเป็นวัตถุ (Object)
      const displayMsg = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);

      // ตรวจจับคำว่า User not fount เพื่อแปลเป็นข้อความภาษาไทยที่อ่านง่าย
      if (displayMsg === "User not fount") {
        this.showAlert('เข้าสู่ระบบไม่สำเร็จ', 'ไม่พบบัญชีผู้ใช้นี้ในระบบ');
      } else {
        this.showAlert('เข้าสู่ระบบไม่สำเร็จ', displayMsg);
      }
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