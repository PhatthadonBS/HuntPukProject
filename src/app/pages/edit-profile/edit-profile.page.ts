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
    const navState = this.router.getCurrentNavigation()?.extras.state;
    let userData = navState ? navState['user'] : null;

    if (!userData) {
      const stored = localStorage.getItem('loggedIn');
      if (stored) {
        userData = JSON.parse(stored);
      }
    }

    if (userData) {
      this.fullUserData = userData;
      this.userId = userData.id || userData.user_id || userData.USER_ID;

      this.editData.username = userData.username || userData.USERNAME || '';
      this.fullUserData.email = userData.email || userData.EMAIL || '';
      this.editData.phone_number = userData.phone || userData.phone_number || userData.PHONE_NUMBER || '';
    }
  }

  async confirmSave() {
    if (!this.editData.username || !this.editData.phone_number) {
      this.showToast('กรุณากรอกชื่อและเบอร์โทรศัพท์', 'danger');
      return;
    }

    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(this.editData.phone_number)) {
      this.showToast('เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องมี 10 หลัก)', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'ยืนยันการแก้ไข',
      message: 'คุณต้องการบันทึกการเปลี่ยนแปลงข้อมูลใช่หรือไม่?',
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        {
          text: 'บันทึก',
          handler: () => {
            this.saveProfile(); 
          }
        }
      ]
    });
    await alert.present();
  }
async saveProfile() {
    try {
      await this.authService.updateProfile(this.userId, this.editData.username, this.editData.phone_number);

      const storedData = localStorage.getItem('loggedIn');
      if (storedData) {
        let parsed = JSON.parse(storedData);
        
        // 🔥 อัปเดตข้อมูลเข้าไปในกล่อง .user (ถ้ามี)
        if (parsed.user) {
          parsed.user.username = this.editData.username;
          parsed.user.USERNAME = this.editData.username;
          parsed.user.phone = this.editData.phone_number;
          parsed.user.PHONE_NUMBER = this.editData.phone_number;
        } else {
          parsed.username = this.editData.username;
          parsed.USERNAME = this.editData.username;
          parsed.phone = this.editData.phone_number;
          parsed.PHONE_NUMBER = this.editData.phone_number;
        }

        // เซฟกลับเข้า LocalStorage (Token จะปลอดภัยอยู่ใน parsed)
        localStorage.setItem('loggedIn', JSON.stringify(parsed));
      }

      await this.showToast('บันทึกข้อมูลเรียบร้อย', 'success');
      this.router.navigate(['/my-account']); 

    } catch (error: any) { 
      console.error('Update Error:', error);
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

  async performDeactivation() {
    try {
      await this.authService.deactivateUser(this.userId);
      localStorage.clear(); 
      const toast = await this.toastController.create({ message: 'ปิดบัญชีเรียบร้อยแล้ว', duration: 2000, color: 'dark' });
      await toast.present();
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error(error);
      await this.showToast('เกิดข้อผิดพลาด ไม่สามารถปิดบัญชีได้', 'danger');
    }
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastController.create({ message: msg, duration: 2000, color: color, position: 'top' });
    await toast.present();
  }

  goBack() {
    this.router.navigate(['/my-account']);
  }
}