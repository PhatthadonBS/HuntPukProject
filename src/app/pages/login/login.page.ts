import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular'; // <--- 1. เพิ่ม AlertController

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class LoginPage implements OnInit {

  // ตัวแปรรับค่าจากฟอร์ม
  email: string = '';
  password: string = '';

  // 2. สร้างข้อมูล User จำลอง (สมมติว่าได้มาจาก Database)
  mockUserDatabase = {
    email: 'user@test.com',
    password: '123456',
    username: 'นายทดสอบ ระบบ',
    role: 'user'
  };

  // 3. เพิ่ม alertController เข้ามาใน constructor
  constructor(
    private router: Router,
    private alertController: AlertController 
  ) { }

  ngOnInit() {
  }

  // 4. ฟังก์ชัน Login แบบมีเงื่อนไข
  async login() {
    // ตรวจสอบว่ากรอกข้อมูลหรือยัง
    if (!this.email || !this.password) {
      this.showAlert('แจ้งเตือน', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    // ตรวจสอบความถูกต้อง (เช็คกับข้อมูลจำลอง)
    if (this.email === this.mockUserDatabase.email && this.password === this.mockUserDatabase.password) {
      
      console.log('Login สำเร็จ! ยินดีต้อนรับ:', this.mockUserDatabase.username);
      
      // (ทางเลือก) บันทึกข้อมูลลง LocalStorage เพื่อจำว่าล็อกอินแล้ว
      localStorage.setItem('userLoggedIn', JSON.stringify(this.mockUserDatabase));

      // ไปหน้า Home
      this.router.navigate(['/home']);

    } else {
      // ถ้าผิด ให้แจ้งเตือน
      console.log('Login ผิดพลาด');
      this.showAlert('เข้าสู่ระบบไม่สำเร็จ', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
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
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

}