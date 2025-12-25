import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DormitoryService } from '../../../services/dormitory';
import { UserService } from '../../../services/user';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonButtons, IonButton, IonIcon, IonSpinner, 
  IonBadge, IonFab, IonFabButton,IonBackButton,
  AlertController, ToastController, LoadingController 
} 
from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  add, createOutline, trashOutline, eyeOutline, star, home, 
  alertCircleOutline, arrowBackOutline, businessOutline, 
  homeOutline, addCircleOutline, addCircle, locationOutline,
  chatboxEllipsesOutline, ellipse, eye
} from 'ionicons/icons';
import { Router } from '@angular/router';


@Component({
  selector: 'app-my-dorms',
  templateUrl: './my-dorms.page.html',
  styleUrls: ['./my-dorms.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonButtons, IonButton, IonIcon, IonSpinner, IonBackButton,
    IonBadge, IonFab, IonFabButton,
    CommonModule, FormsModule
  ]
})
export class MyDormsPage implements OnInit {

  myDorms: any[] = [];
  isLoading = false;
  currentUserId: number = 0;

  constructor(
    private dormService: DormitoryService,
    private userService: UserService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) { 
    addIcons({ add, createOutline, trashOutline, eyeOutline, star, home, 
  alertCircleOutline, arrowBackOutline, businessOutline, 
  homeOutline, addCircleOutline, addCircle, locationOutline,
  chatboxEllipsesOutline, ellipse, eye });
  }

  ngOnInit() {
    this.checkPermissionAndLoadData();
  }

  async checkPermissionAndLoadData() {
    const user = this.userService.getCurrentUser();
    
    // 1. เช็คสิทธิ์ (ต้องล็อกอิน และเป็น Role 2)
    if (!user || user.role_id !== 2) {
      const alert = await this.alertCtrl.create({
        header: 'ไม่มีสิทธิ์เข้าถึง',
        message: 'หน้านี้สำหรับเจ้าของหอพักเท่านั้น',
        buttons: [{
          text: 'ตกลง',
          handler: () => {
            this.router.navigate(['/home']);
          }
        }]
      });
      await alert.present();
      return;
    }

    this.currentUserId = user.id;
    this.loadMyDorms();
  }

  async loadMyDorms() {
    this.isLoading = true;
    try {
      const res = await this.dormService.getMyDorms(this.currentUserId);
      if (res && res.data) {
        this.myDorms = res.data;
      }
    } catch (error) {
      console.error('Load My Dorms Error:', error);
      this.showToast('ไม่สามารถโหลดข้อมูลได้', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // ไปหน้าเพิ่มหอพัก
  goToAddDorm() {
    this.router.navigate(['/dorm-form']); 
  }

  // ไปหน้าแก้ไข
  goToEdit(dormId: number) {
    this.router.navigate(['/edit-dorm', dormId]); 
  }

  // ไปหน้าดูรีวิวของหอนี้
  goToReviews(dormId: number) {
    this.router.navigate(['/manage-reviews', dormId]); 
  }

  async confirmDelete(dormId: number) {
    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการลบ',
      message: 'คุณต้องการลบหอพักนี้ใช่หรือไม่? (สามารถกู้คืนได้ภายหลัง)',
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        {
          text: 'ลบ',
          role: 'destructive',
          handler: () => this.executeDelete(dormId)
        }
      ]
    });
    await alert.present();
  }

  async executeDelete(dormId: number) {
    const loading = await this.loadingCtrl.create({ message: 'กำลังลบ...' });
    await loading.present();
    try {
      await this.dormService.removeDorm(dormId);
      this.showToast('ลบหอพักเรียบร้อย', 'success');
      this.loadMyDorms(); // โหลดใหม่
    } catch (error) {
      this.showToast('ลบไม่สำเร็จ', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg, duration: 2000, color: color, position: 'bottom'
    });
    toast.present();
  }

  // Helper: สีสถานะ
  getStatusColor(statusId: number, reqStatus: number): string {
    if (reqStatus === 0) return 'warning'; // รออนุมัติ (เหลือง)
    if (reqStatus === 2) return 'danger';  // ไม่อนุมัติ (แดง)
    if (statusId === 2) return 'medium';   // ปิดปรับปรุง (เทา)
    return 'success';                      // ปกติ (เขียว)
  }

  getStatusText(statusId: number, reqStatus: number): string {
    if (reqStatus === 0) return 'รออนุมัติ';
    if (reqStatus === 2) return 'ไม่อนุมัติ';
    if (statusId === 2) return 'ปิดปรับปรุง';
    return 'ออนไลน์';
  }
}