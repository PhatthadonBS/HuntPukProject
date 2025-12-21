import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ViewWillEnter, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons'; 
import { person, call, logoFacebook, chatbubbles, arrowForward, logoInstagram, logoTwitter, paperPlane, alertCircle, time, checkmarkCircle, image } from 'ionicons/icons'; 
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

  // ข้อมูลฟอร์ม
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

  // ✅ ตัวแปรเก็บไฟล์รูปภาพที่จะส่งไป Backend
  selectedFile: File | null = null;
  
  // ✅ ตัวแปรเก็บ URL รูปภาพสำหรับ Preview หน้าจอ (เพิ่มใหม่)
  previewImage: string | ArrayBuffer | null = null;

  errorMessage: string = '';
  isSubmitted: boolean = false;
  isSuccess: boolean = false; 

  constructor(
    private ownerRequestService: OwnerRequestService,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    addIcons({ person, call, logoFacebook, chatbubbles, arrowForward, logoInstagram, logoTwitter, paperPlane, alertCircle, time, checkmarkCircle, image });
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
    
    // ✅ รีเซ็ตไฟล์และรูปตัวอย่าง
    this.selectedFile = null; 
    this.previewImage = null; 
    
    // รีเซ็ตค่าฟอร์ม
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
        const userId = user.id || user.user_id || user.USER_ID;

        if (userId) {
             this.formData.user_id = userId; 
             
             if(user.phone_number || user.PHONE_NUMBER) {
                 this.formData.phone_number = user.phone_number || user.PHONE_NUMBER;
             }
        } else {
             this.forceLogout();
        }
      } catch (e) {
        console.error('Parse Error:', e);
        this.forceLogout();
      }
    } else {
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

  // ✅ ฟังก์ชันเลือกไฟล์ + สร้าง Preview
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // สร้าง Preview Image
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result;
      };
      reader.readAsDataURL(file);
    }
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

    // Validation
    if (!this.formData.first_name || !this.formData.last_name || !this.formData.phone_number) {
      this.errorMessage = 'กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน';
      return;
    }

    // ✅ Validation: เช็คว่าอัปโหลดรูปหรือยัง
    if (!this.selectedFile) {
      this.errorMessage = 'กรุณาอัปโหลดรูปโปรไฟล์';
      return;
    }
    
    // ✅ สร้าง FormData เพื่อส่งไฟล์ + ข้อมูล text
    const formData = new FormData();
    formData.append('file', this.selectedFile); 
    formData.append('user_id', this.formData.user_id.toString());
    formData.append('first_name', this.formData.first_name);
    formData.append('last_name', this.formData.last_name);
    // formData.append('phone_number', this.formData.phone_number); 
    
    formData.append('facebook', this.formData.facebook || '');
    formData.append('line', this.formData.line || '');
    formData.append('instagram', this.formData.instagram || '');
    formData.append('x', this.formData.x || '');
    formData.append('telegram', this.formData.telegram || '');

    // ส่งข้อมูลไปที่ Service
    this.ownerRequestService.requestToBeOwner(formData).subscribe({
      next: (res) => {
        console.log('Success:', res);
        this.isSuccess = true;
      },
      error: (err) => {
        console.error('Error:', err);
        const msg = err.error?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
        this.errorMessage = msg;
      }
    });
  }
}