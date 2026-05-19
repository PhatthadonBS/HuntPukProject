import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
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
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  
  // ⭐ State สำคัญสำหรับควบคุมสถานะ "กำลังเข้าสู่ระบบ..."
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: Auth
  ) {
    // ลงทะเบียนไอคอนให้ครบถ้วนเพื่อความปลอดภัย
    addIcons({ arrowBack, person, key, eye, eyeOff, logInOutline }); 
  }

  ngOnInit() {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  async login() {
    console.log("🔥 1. เริ่มทำงาน login()");
    
    // ป้องกันการกดปุ่มซ้ำขณะที่ระบบกำลังโหลดข้อมูลอยู่
    if (this.isLoading) return;

    // 🔍 Step 1: ตรวจสอบความถูกต้องของข้อมูล (Validation) ก่อนยิง API
    if (!this.email || !this.email.trim()) {
      this.showAlert('กรอกข้อมูลไม่ครบ', 'กรุณาระบุอีเมลของคุณ');
      return;
    }

    if (!this.password) {
      this.showAlert('กรอกข้อมูลไม่ครบ', 'กรุณาระบุรหัสผ่าน');
      return;
    }

    // ⏳ Step 2: เปิดสถานะกำลังเข้าสู่ระบบ (ปรับปรุงจาก LoadingController มาใช้ State)
    this.isLoading = true;
    console.log("🚀 2. เปลี่ยน State isLoading = true (ปุ่มล็อกอินจะแสดงไอคอนโหลด)");

    try {
      console.log("📡 3. กำลังส่งข้อมูลไปตรวจสอบที่ Backend...");
      const res = (await this.authService.login(
        this.email.trim(),
        this.password
      )) as any;

      console.log("📥 4. Backend ตอบกลับมาสำเร็จ:", res);

      if (res && res.logged_in) {
        console.log("🎉 5. ตรวจสอบข้อมูลถูกต้อง เตรียมบันทึก Session และเปลี่ยนหน้า");
        
        const roleId = res.user.role_id;
        const status = res.user.accout_status; 

        // ตรวจสอบสิทธิ์การใช้งานและสถานะบัญชี
        if ((roleId === 1 || roleId === 2 || roleId === 3) && status === 0) {
          const userData = {
            loggedIn: true, 
            id: res.user.id, 
            email: this.email, 
            username: res.user.username,
            role_id: res.user.role_id, 
            accout_status: res.user.accout_status, 
            token: res.token
          };
          
          localStorage.setItem("loggedIn", JSON.stringify(userData));
          
          // เปลี่ยนหน้าตามระดับสิทธิ์ของผู้ใช้งาน
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
        console.log("❌ 6. ข้อมูลไม่ถูกต้องตามเงื่อนไขเซิร์ฟเวอร์");
        this.showAlert('เข้าสู่ระบบไม่สำเร็จ', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      }

    } catch (error: any) {
      console.error("🔥 7. ตรวจพบข้อผิดพลาดจากเซิร์ฟเวอร์ (Catch Error):", error);

      // ล้วงเอาข้อความ Error จริงๆ จาก Backend ออกมาวิเคราะห์และแปลภาษา
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
      // 🟢 ปิดสถานะกำลังโหลดทุกกรณี ไม่ว่าจะสำเร็จหรือพัง เพื่อให้ปุ่มกลับมาใช้งานได้ปกติ
      this.isLoading = false;
      console.log("🟢 8. รีเซ็ต State isLoading = false เรียบร้อย");
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