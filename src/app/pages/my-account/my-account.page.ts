import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { person, mail, create, arrowBack, call, shieldCheckmark } from 'ionicons/icons';

// ✅ ตรวจสอบ Path ให้ชัวร์ (ปกติจะมี .service)
import { UserService } from '../../services/user'; 

import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButtons, 
  IonButton, 
  IonIcon,
  IonSpinner,       // ✅ 1. Import IonSpinner มาด้วย
  LoadingController, 
  ToastController 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.page.html',
  styleUrls: ['./my-account.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButtons, 
    IonButton, 
    IonIcon,
    IonSpinner // ✅ 2. ใส่ IonSpinner ลงใน imports array
  ]
})
export class MyAccountPage implements OnInit {

  user: any = {};
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private userService: UserService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) { 
    addIcons({ person, mail, create, arrowBack, call, shieldCheckmark });
  }

  ngOnInit() {
    this.loadUserData();
  }

  ionViewWillEnter() {
    this.loadUserData();
  }

  async loadUserData() {
    // 1. ดึง ID จาก LocalStorage
    const stored = localStorage.getItem('loggedIn');
    
    if (!stored) {
      console.warn('No user logged in');
      // ถ้าไม่ได้ล็อกอิน อาจจะ Redirect ไป Login หรือปล่อยไว้ (แล้วแต่ Flow)
      // this.router.navigate(['/login']); 
      return;
    }

    try {
      const localData = JSON.parse(stored);
      // เช็คว่าตอน Login บันทึก key ไหนแน่? (id, user_id, หรือ USER_ID)
      const userId = localData.id || localData.user_id || localData.USER_ID; 

      if (userId) {
        this.isLoading = true; // เริ่มหมุน Loading

        try {
           // 2. ยิง API ไปขอข้อมูลล่าสุด
           const userData = await this.userService.getUserProfile(userId);
           
           if (userData) {
               // userData นี้ควรผ่านการ Map เป็นตัวพิมพ์เล็กมาจาก Service แล้ว
               this.user = userData;
               console.log('User Data Loaded:', this.user);
           }
        } catch(e) {
           console.error('API Error:', e);
           this.showToast('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ แสดงข้อมูลเก่าแทน', 'warning');
           // ถ้า API พัง อาจจะใช้ข้อมูล localData แก้ขัดไปก่อน
           this.user = localData; 
        } finally {
           this.isLoading = false; // หยุดหมุน
        }
      }
    } catch (e) {
      console.error('Error parsing user data', e);
      this.showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'danger');
    }
  }

  goToEditProfile() {
    this.router.navigate(['/edit-profile'], { state: { user: this.user } });
  }
  
  goBack() {
    this.router.navigate(['/home']);
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}