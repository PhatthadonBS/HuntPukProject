import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular'; // <--- 1. เพิ่ม AlertController
import {
  User,
  UserLoggedInPostRes,
} from '../../model/res/user_loggedIn_post_res';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
})
export class LoginPage implements OnInit {
  // ตัวแปรรับค่าจากฟอร์ม
  email: string = '';
  password: string = '';

  // 3. เพิ่ม alertController เข้ามาใน constructor
  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: Auth
  ) {}

  ngOnInit() {}

  async login() {
    if (!this.email || !this.password) {
      this.showAlert('แจ้งเตือน', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    try {
      const res = (await this.authService.login(
        this.email,
        this.password
      )) as UserLoggedInPostRes;

      const UserDataRes: UserLoggedInPostRes = {
        logged_in: res.logged_in,
        message: res.message,
        user: res.user,
      };

      const userData = {
        logggedIn: UserDataRes.logged_in,
        id: UserDataRes.user.id,
        email: UserDataRes.user.email,
        username: UserDataRes.user.username,
        role_id: UserDataRes.user.role_id,
        accout_status: UserDataRes.user.accout_status,
      };

      localStorage.setItem("loggedIn", JSON.stringify(userData))
      this.router.navigateByUrl('home')
    } catch (error) {
    } finally {
    }
  }

  skip() {
    this.router.navigate(['/home']);
  }

  // ฟังก์ชันช่วยแสดง Popup แจ้งเตือนสวยๆ ของ Ionic
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
