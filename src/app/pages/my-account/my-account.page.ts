import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router'; 
import { addIcons } from 'ionicons';
import { person, mail, create, arrowBack, call, shieldCheckmark } from 'ionicons/icons';

import { UserService } from '../../services/user'; 

import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonButton, IonIcon, IonSpinner, 
  LoadingController, ToastController 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.page.html',
  styleUrls: ['./my-account.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, 
    IonTitle, IonToolbar, IonButtons, IonButton, 
    IonIcon, IonSpinner
  ]
})
export class MyAccountPage implements OnInit {

  user: any = {};
  isLoading: boolean = false;
  isOwnProfile: boolean = true; 
  canEdit: boolean = false; // ✅ เพิ่มตัวแปรนี้เพื่อคุมปุ่มแก้ไข

  constructor(
    private router: Router,
    private route: ActivatedRoute, 
    private userService: UserService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) { 
    addIcons({ person, mail, create, arrowBack, call, shieldCheckmark });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadUserData();
  }

  async loadUserData() {
    this.isLoading = true;

    try {
      // 1. ดึงข้อมูล "คนกด" (Current User)
      const stored = localStorage.getItem('loggedIn');
      let currentUser: any = null;
      let myRole: number = 1;
      let myId: number = 0;

      if (stored) {
         currentUser = JSON.parse(stored);
         // เช็ค key ให้ชัวร์ว่า Database ส่งอะไรมา (role_id หรือ role_type_id)
         myRole = currentUser.role_id || currentUser.role_type_id || 1; 
         myId = currentUser.id || currentUser.user_id || currentUser.USER_ID;
      }

      // 2. เช็คว่า "กำลังดูใคร?" (Target User) จาก URL
      const routeId = this.route.snapshot.paramMap.get('id');

      if (routeId) {
        // 🅰️ กรณี: กำลังส่องคนอื่น (มี ID ใน URL)
        this.isOwnProfile = false;
        
        // โหลดข้อมูลคนนั้นมาโชว์
        const targetUser = await this.userService.getUserProfile(Number(routeId));
        this.user = targetUser || {};

        // 🔥 Logic สิทธิ์การแก้ไขเมื่อดูคนอื่น:
        // Role 3 (แอดมิน) -> แก้ไขได้ ✅
        // Role 1 (สมาชิก)// Role 2 (เจ้าของ) -> แก้ไขไม่ได้ ❌
        if (myRole === 3) {
           this.canEdit = true;
        } else {
           this.canEdit = false;
        }

      } else {
        // 🅱️ กรณี: ดูตัวเอง (ไม่มี ID ใน URL)
        this.isOwnProfile = true;
        
        // โหลดข้อมูลตัวเอง
        if (myId) {
           const userData = await this.userService.getUserProfile(myId);
           this.user = userData || currentUser; 
        }
        
        // 🔥 Logic สิทธิ์การแก้ไขเมื่อดูตัวเอง:
        // ทุกคนแก้ของตัวเองได้เสมอ ✅
        this.canEdit = true; 
      }

    } catch (e) {
      console.error('Error loading profile:', e);
      this.showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  goToEditProfile() {
    // ส่งข้อมูล User ที่กำลังแสดงผลไปหน้าแก้ไข
    this.router.navigate(['/edit-profile'], { state: { user: this.user } });
  }
  
  goBack() {
    // ถ้าดูคนอื่นอยู่ ให้กลับไปหน้า Manage Users
    if (!this.isOwnProfile) {
        this.router.navigate(['/manage-users']); 
    } else {
        this.router.navigate(['/home']);
    }
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