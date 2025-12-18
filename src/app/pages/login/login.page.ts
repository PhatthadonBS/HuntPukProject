import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import {
  User,
  UserLoggedInPostRes,
} from '../../model/res/user_loggedIn_post_res';
import { Auth } from '../../services/auth';
import { addIcons } from 'ionicons';
import { arrowBack, key, person } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
})
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';

  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: Auth
  ) {
    // ✅ ลงทะเบียน Icon
    addIcons({ arrowBack, person, key });
  }

  ngOnInit() {}

  // ✅ ฟังก์ชันกลับหน้า Home
  goHome() {
    this.router.navigate(['/home']);
  }
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

      if (res.logged_in) {
        
        // ✅ [เพิ่ม] เช็คเงื่อนไข Role และ Status ตรงนี้เลย
        const roleId = res.user.role_id;
        const status = res.user.accout_status; // (ตามชื่อตัวแปรใน model คุณ)

        if ((roleId === 1 || roleId === 2 || roleId === 3) && status === 0) {
          
          const userData = {
            loggedIn: true,
            id: res.user.id,
            email: res.user.email,
            username: res.user.username,
            role_id: res.user.role_id,
            accout_status: res.user.accout_status,
          };

          localStorage.setItem("loggedIn", JSON.stringify(userData));

          // ✅ แยกทางเดิน: ถ้าเป็น Admin (3) ไป dashboard, คนอื่นไป home
          if (roleId === 3) {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/home']);
          }

        } else {
          this.showAlert('เข้าสู่ระบบไม่สำเร็จ', 'สิทธิ์การใช้งานของคุณไม่ถูกต้อง');
          localStorage.removeItem("loggedIn");
        }
      } else {
        this.showAlert('แจ้งเตือน', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }

    } catch (error) {
      console.error(error);
      this.showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
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