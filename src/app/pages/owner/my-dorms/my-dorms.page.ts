import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// ✅ แก้ NG0201: ใช้ standalone components แทน IonicModule
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonBackButton, IonButton, IonIcon, IonSpinner,
  AlertController, ToastController, 
  LoadingController, ActionSheetController, ModalController 
} from '@ionic/angular/standalone';

import { DormitoryService } from '../../../services/dormitory';
import { UserService } from '../../../services/user';
import { OtpModalComponent } from '../../../components/otp-modal/otp-modal.component';

import { addIcons } from 'ionicons';
import { 
  add, createOutline, trashOutline, eyeOutline, star, home, 
  alertCircleOutline, arrowBackOutline, businessOutline, 
  homeOutline, addCircleOutline, addCircle, locationOutline,
  chatboxEllipsesOutline, ellipse, eye, swapVerticalOutline, refreshOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-my-dorms',
  templateUrl: './my-dorms.page.html',
  styleUrls: ['./my-dorms.page.scss'],
  standalone: true,
  // ✅ แก้ NG0201: ใส่ standalone components ทีละตัวแทน IonicModule
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonBackButton, IonButton, IonIcon, IonSpinner,
    OtpModalComponent
  ] 
})
export class MyDormsPage implements OnInit {
  myDorms: any[] = [];
  isLoading: boolean = true;
  currentUser: any = null;

  constructor(
    private router: Router,
    private dormService: DormitoryService,
    private userService: UserService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private actionSheetCtrl: ActionSheetController,
    private modalCtrl: ModalController
  ) {
    addIcons({ 
      add, createOutline, trashOutline, eyeOutline, star, home, 
      alertCircleOutline, arrowBackOutline, businessOutline, 
      homeOutline, addCircleOutline, addCircle, locationOutline,
      chatboxEllipsesOutline, ellipse, eye, swapVerticalOutline, refreshOutline 
    });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.checkLoginAndLoadData();
  }

  checkLoginAndLoadData() {
    const stored = localStorage.getItem('loggedIn');
    if (stored) {
      try {
        const userObj = JSON.parse(stored);
        this.currentUser = userObj;
        this.loadMyDorms();
      } catch (e) {
        this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  async loadMyDorms() {
    this.isLoading = true;
    const userId = this.currentUser.id || this.currentUser.USER_ID;
    
    try {
      const res = await this.dormService.getMyDorms(userId);
      if (res.success) {
        this.myDorms = res.data;
      }
    } catch (error) {
      console.error('Error loadMyDorms:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getStatusText(statusId: number, reqStatus: number): string {
    if (reqStatus === 0) return 'รออนุมัติ';
    if (reqStatus === 2) return 'ไม่อนุมัติ';
    if (statusId === 2) return 'ปิดให้บริการ';
    if (statusId === 3) return 'ห้องเต็ม';
    return 'ว่าง / ออนไลน์'; 
  }

  getStatusColor(statusId: number, reqStatus: number): string {
    if (reqStatus === 0) return 'warning';
    if (reqStatus === 2) return 'danger';
    if (statusId === 2) return 'medium'; 
    if (statusId === 3) return 'danger'; 
    return 'success'; 
  }

  async openStatusSheet(dorm: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: `ปรับสถานะ: ${dorm.DORM_NAME}`,
      buttons: [
        { text: '✅ สถานะ: ห้องว่าง (ออนไลน์)', handler: () => { this.changeStatus(dorm.DORM_ID, 1); } },
        { text: '❌ สถานะ: ห้องเต็ม', handler: () => { this.changeStatus(dorm.DORM_ID, 3); } },
        { text: 'ยกเลิก', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async changeStatus(dormId: number, statusId: number) {
    const loading = await this.loadingCtrl.create({ message: 'กำลังอัปเดตสถานะ...' });
    await loading.present();
    try {
      await this.dormService.changeDormStatus(dormId, statusId);
      this.showToast('เปลี่ยนสถานะเรียบร้อย', 'success');
      this.loadMyDorms(); 
    } catch (error) {
      this.showToast('เปลี่ยนสถานะไม่สำเร็จ', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  async confirmDelete(dormId: number) {
    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการปิดบริการ',
      message: 'คุณต้องการปิด/ลบหอพักนี้ใช่หรือไม่? (หากต้องการกู้คืน ต้องใช้ OTP)',
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { text: 'ปิดบริการ', role: 'destructive', handler: () => this.executeDelete(dormId) }
      ]
    });
    await alert.present();
  }

  async executeDelete(dormId: number) {
    const loading = await this.loadingCtrl.create({ message: 'กำลังปิดบริการ...' });
    await loading.present();
    try {
      await this.dormService.removeDorm(dormId);
      this.showToast('ปิดให้บริการหอพักเรียบร้อย', 'success');
      this.loadMyDorms(); 
    } catch (error) {
      this.showToast('ลบไม่สำเร็จ', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  async confirmRestoreWithOTP(dormId: number) {
    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการกู้คืน',
      message: 'ระบบจะส่งรหัส OTP ไปยังอีเมลของคุณ เพื่อยืนยันสิทธิ์ในการกู้คืนหอพัก',
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { text: 'ส่ง OTP', handler: () => this.openOtpModalForRestore(dormId) }
      ]
    });
    await alert.present();
  }

  async openOtpModalForRestore(dormId: number) {
    const userEmail = this.currentUser.email || this.currentUser.EMAIL;
    const modal = await this.modalCtrl.create({
      component: OtpModalComponent,
      componentProps: { email: userEmail, mode: 'recover' },
      cssClass: 'custom-otp-modal'
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data && data.success) {
      this.executeRestore(dormId);
    } else {
      this.showToast('การยืนยันตัวตนถูกยกเลิก', 'warning');
    }
  }

  async executeRestore(dormId: number) {
    const loading = await this.loadingCtrl.create({ message: 'กำลังกู้คืนหอพัก...' });
    await loading.present();
    try {
      await this.dormService.restoreDorm(dormId);
      this.showToast('กู้คืนหอพักสำเร็จ! หอพักออนไลน์แล้ว', 'success');
      this.loadMyDorms();
    } catch (error) {
      this.showToast('เกิดข้อผิดพลาดในการกู้คืน', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2000, color: color, position: 'bottom' });
    toast.present();
  }

  goToDetail(id: number) { this.router.navigate(['/dorm-detail', id]); }
  goToAddDorm() { this.router.navigate(['/dorm-form']); }
  goToEdit(id: number) { this.router.navigate(['/edit-dorm', id]); }
  goToReviews(id: number) { this.router.navigate(['/manage-reviews'], { queryParams: { dorm_id: id }}); }
}