import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController, AlertController, IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { closeOutline, personOutline, callOutline, mailOutline, trashOutline } from 'ionicons/icons';
import { Auth } from '../../services/auth'; 

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class EditProfilePage implements OnInit {

  editData = {
    username: '',
    phone_number: ''
  };

  fullUserData: any = {};
  userId: number = 0;

  constructor(
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private authService: Auth 
  ) {
    addIcons({ closeOutline, personOutline, callOutline, mailOutline, trashOutline });
  }

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const stored = localStorage.getItem('loggedIn');
    if (stored) {
      this.fullUserData = JSON.parse(stored);
      this.userId = this.fullUserData.id || this.fullUserData.USER_ID;
      this.editData.username = this.fullUserData.username || this.fullUserData.USERNAME || '';
      this.editData.phone_number = this.fullUserData.phone_number || this.fullUserData.PHONE_NUMBER || '';
    }
  }

  // ✅ แก้ไขฟังก์ชันบันทึกข้อมูล (ใช้ await แทน subscribe)
  async saveProfile() {
    if (!this.editData.username || !this.editData.phone_number) {
      this.showToast('กรุณากรอกชื่อและเบอร์โทรศัพท์', 'danger');
      return;
    }

    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(this.editData.phone_number)) {
      this.showToast('เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องมี 10 หลัก)', 'danger');
      return;
    }

    try {
      // ✅ ใช้ await รอผลลัพธ์
      const res = await this.authService.updateProfile(this.userId, this.editData.username, this.editData.phone_number);
      
      console.log('Update Success:', res);

      // อัปเดต LocalStorage
      this.fullUserData.username = this.editData.username;
      this.fullUserData.phone_number = this.editData.phone_number;
      if(this.fullUserData.USERNAME) this.fullUserData.USERNAME = this.editData.username;
      if(this.fullUserData.PHONE_NUMBER) this.fullUserData.PHONE_NUMBER = this.editData.phone_number;

      localStorage.setItem('loggedIn', JSON.stringify(this.fullUserData));

      await this.showToast('บันทึกข้อมูลเรียบร้อย', 'success');
      this.router.navigate(['/my-account']);

    } catch (error: any) { // ❌ ดักจับ Error ตรงนี้
      console.error('Update Error:', error);
      // ต้องแปลง error string กลับเป็น object หรือดึง message ออกมา
      let msg = 'บันทึกไม่สำเร็จ';
      try {
         const errObj = JSON.parse(error.message);
         msg = errObj.message || msg;
      } catch(e) {
         msg = error.message || msg;
      }
      await this.showToast(msg, 'danger');
    }
  }

  async deleteAccount() {
    const alert = await this.alertController.create({
      header: 'ยืนยันการปิดบัญชี',
      message: 'บัญชีของคุณจะถูกระงับการใช้งาน คุณแน่ใจหรือไม่?',
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        {
          text: 'ยืนยันปิดบัญชี',
          role: 'destructive',
          cssClass: 'alert-btn-delete',
          handler: () => {
            this.performDeactivation();
          }
        }
      ]
    });
    await alert.present();
  }

  // ✅ แก้ไขฟังก์ชันปิดบัญชี (ใช้ await แทน subscribe)
  async performDeactivation() {
    try {
      // ✅ ใช้ await
      await this.authService.deactivateUser(this.userId);
      
      // ล้างข้อมูล Login
      localStorage.clear(); 
      
      const toast = await this.toastController.create({
        message: 'ปิดบัญชีเรียบร้อยแล้ว',
        duration: 2000,
        color: 'dark'
      });
      await toast.present();

      // เด้งไปหน้า Login
      this.router.navigate(['/login']);

    } catch (error: any) {
      console.error(error);
      await this.showToast('เกิดข้อผิดพลาด ไม่สามารถปิดบัญชีได้', 'danger');
    }
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }

  goBack() {
    this.router.navigate(['/my-account']);
  }
}