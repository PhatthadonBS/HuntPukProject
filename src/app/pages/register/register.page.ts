import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { UserRegPostReq } from '../../model/req/user_reg_post_req';

// ✅ 1. Import addIcons และ Icon ที่ต้องการใช้ (เช่น arrowBack)
import { addIcons } from 'ionicons';
import { arrowBack, chevronBack } from 'ionicons/icons';

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

  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: Auth
  ) {
    // ✅ 2. ลงทะเบียน Icon ที่จะใช้ในหน้านี้
    // ถ้าใน HTML คุณใช้ <ion-icon name="arrow-back"></ion-icon> ให้ใส่ arrowBack
    addIcons({ arrowBack, chevronBack }); 
  }

  ngOnInit() {
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  // ฟังก์ชันเมื่อกดปุ่ม "ถัดไป"
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

    console.log(userData);

    try {
      const res = await this.authService.register(userData)
      sessionStorage.clear();
      sessionStorage.setItem("user", JSON.stringify(res));
      this.router.navigateByUrl("/forgot-password");
      console.log("move to fkpw");
      
      return;
    } catch (error) {
      console.log(error);
    }
    
    // --- ส่วนจำลองการบันทึกข้อมูล (Mock) ---
    // (โค้ดส่วนนี้อาจจะไม่ได้ถูกเรียกถ้า router.navigate ทำงานไปแล้วใน try block)
    console.log('สมัครสมาชิกสำเร็จ:', {
      user: this.username,
      email: this.email
    });

    const alert = await this.alertController.create({
      header: 'ดำเนินการสำเร็จ',
      subHeader: '✅',
      message: 'สมัครสมาชิกเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ',
      buttons: [
        {
          text: 'ตกลง',
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ],
      cssClass: 'custom-success-alert'
    });

    await alert.present();
  }

  async showErrorAlert(msg: string) {
    const alert = await this.alertController.create({
      header: 'แจ้งเตือน',
      message: msg,
      buttons: ['ตกลง']
    });
    await alert.present();
  }

}