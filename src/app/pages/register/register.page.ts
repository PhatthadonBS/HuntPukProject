import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular'; // <--- 1. เพิ่ม AlertController
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { UserRegPostReq } from '../../model/req/user_reg_post_req';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class RegisterPage implements OnInit {

  // ตัวแปรรับค่า
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  phone: string = '';

  // 2. เพิ่ม alertController ใน constructor
  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: Auth
  ) { }

  ngOnInit() {
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  // 3. ฟังก์ชันเมื่อกดปุ่ม "ถัดไป" (ปุ่มลูกศร)
  async register() {
    // เช็คว่ากรอกข้อมูลครบไหม
    if(!this.username || !this.email || !this.password || !this.phone) {
      this.showErrorAlert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // เช็คว่ารหัสผ่านตรงกันไหม
    if (this.password !== this.confirmPassword) {
      this.showErrorAlert('รหัสผ่านไม่ตรงกัน');
      return;
    }

    const userData: UserRegPostReq = {
      username: this.username,
      email: this.email,
      password: this.password,
      phone: this.phone
    }

    try {
      const res = await this.authService.register(userData)
      sessionStorage.clear();
      sessionStorage.setItem("user", JSON.stringify(res));
      this.router.navigateByUrl("/forgot-password");
      return;
    } catch (error) {
      console.log(error);
      
    }
    
    
    // --- ส่วนจำลองการบันทึกข้อมูล (Mock) ---
    console.log('สมัครสมาชิกสำเร็จ:', {
      user: this.username,
      email: this.email
    });

    // 4. แสดง Popup สำเร็จ และพากลับหน้า Login
    const alert = await this.alertController.create({
      header: 'ดำเนินการสำเร็จ',
      subHeader: '✅',
      message: 'สมัครสมาชิกเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ',
      buttons: [
        {
          text: 'ตกลง',
          handler: () => {
            // เมื่อกดตกลง ให้ทำงานตรงนี้
            this.router.navigate(['/login']);
          }
        }
      ],
      cssClass: 'custom-success-alert' // (เผื่ออยากแต่ง CSS เพิ่ม)
    });

    await alert.present();
  }

  // ฟังก์ชันแจ้งเตือนเมื่อกรอกผิด
  async showErrorAlert(msg: string) {
    const alert = await this.alertController.create({
      header: 'แจ้งเตือน',
      message: msg,
      buttons: ['ตกลง']
    });
    await alert.present();
  }

}