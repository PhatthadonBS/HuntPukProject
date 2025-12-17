import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ViewWillEnter, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons'; 
import { person, call, logoFacebook, chatbubbles, arrowForward, logoInstagram, logoTwitter, paperPlane, alertCircle, time, checkmarkCircle } from 'ionicons/icons'; 
import { OwnerRequestService, UserDormOwnerReqPostReq } from '../../services/owner-request';
import { Router } from '@angular/router';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.page.html',
  styleUrls: ['./requests.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule] 
})
export class RequestsPage implements OnInit, ViewWillEnter {

  formData: UserDormOwnerReqPostReq = {
    user_id: 0,
    first_name: '',
    last_name: '',
    phone_number: '',
    facebook: '',
    line: '',
    instagram: '',
    x: '',
    telegram: ''
  };

  errorMessage: string = '';
  isSubmitted: boolean = false;
  isSuccess: boolean = false; 

  constructor(
    private ownerRequestService: OwnerRequestService,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    addIcons({ person, call, logoFacebook, chatbubbles, arrowForward, logoInstagram, logoTwitter, paperPlane, alertCircle, time, checkmarkCircle });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.checkUserAccess();
    this.resetFormState();
  }

  resetFormState() {
    this.errorMessage = '';
    this.isSubmitted = false;
    this.isSuccess = false;
    // รีเซ็ตค่าฟอร์ม (ยกเว้น user_id กับเบอร์โทรที่ดึงมาออโต้)
    this.formData.first_name = '';
    this.formData.last_name = '';
    this.formData.facebook = '';
    this.formData.line = '';
    this.formData.instagram = '';
    this.formData.x = '';
    this.formData.telegram = '';
  }

  async checkUserAccess() {
    const storedData = localStorage.getItem('loggedIn');
    
    if (storedData) {
      try {
        const user = JSON.parse(storedData);
        console.log('📌 Data from LocalStorage:', user);

        // ✅ แก้ไขตรงนี้: ใช้ user.id แทน user.USER_ID ให้ตรงกับที่บันทึกตอน Login
        if (user && user.id) {
             this.formData.user_id = user.id; 
             
             // ดึงเบอร์โทรมาใส่ให้เลย (ถ้ามี)
             if(user.phone_number) {
                 this.formData.phone_number = user.phone_number;
             }
             
             console.log('✅ User ID set to:', this.formData.user_id);

        } else {
             console.warn('❌ ID not found in storage');
             this.forceLogout();
        }
      } catch (e) {
        console.error('❌ Parse Error:', e);
        this.forceLogout();
      }
    } else {
      console.warn('⚠️ No loggedIn key found');
      this.forceLogout();
    }
  }

  async forceLogout() {
    const alert = await this.alertCtrl.create({
      header: 'แจ้งเตือน',
      message: 'กรุณาเข้าสู่ระบบก่อนทำรายการ',
      buttons: ['ตกลง']
    });
    await alert.present();
    this.router.navigate(['/login']);
  }

  onCancel() {
    this.router.navigate(['/home']);
  }

  onSubmit() {
    this.isSubmitted = true;
    this.errorMessage = '';

    if (this.formData.user_id === 0) {
      this.forceLogout();
      return;
    }

    // Validation: ตรวจสอบข้อมูลจำเป็น
    if (!this.formData.first_name || !this.formData.last_name || !this.formData.phone_number) {
      this.errorMessage = 'ข้อมูลไม่ถูกต้อง กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน';
      return;
    }
    
    // ส่งข้อมูลไปที่ Service
    this.ownerRequestService.requestToBeOwner(this.formData).subscribe({
      next: (res) => {
        console.log('Success:', res);
        this.isSuccess = true; // เปลี่ยนสถานะเพื่อแสดงหน้าจอความสำเร็จ
      },
      error: (err) => {
        console.error('Error:', err);
        const msg = err.error?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
        this.errorMessage = msg;
      }
    });
  }
}