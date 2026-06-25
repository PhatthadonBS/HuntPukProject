import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// ✅ แก้ NG0201: ใช้ standalone components แทน IonicModule
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonBackButton, IonButton, IonIcon, IonSpinner, IonModal, IonList, IonItem, IonLabel,
  AlertController, ToastController, 
  LoadingController, ModalController 
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
    IonBackButton, IonButton, IonIcon, IonSpinner, IonModal, IonList, IonItem, IonLabel,
    OtpModalComponent
  ] 
})
export class MyDormsPage implements OnInit {
  myDorms: any[] = [];
  isLoading: boolean = true;
  currentUser: any = null;

  // Status modal
  isStatusModalOpen: boolean = false;
  selectedDormForStatus: any = null;

  statusOptions = [
    { id: 1, label: 'ว่าง / ออนไลน์', desc: 'หอพักเปิดรับนักศึกษา มีห้องว่าง', color: '#22c55e', icon: '🟢' },
    { id: 3, label: 'ห้องเต็ม', desc: 'เปิดอยู่แต่ไม่มีห้องว่างแล้ว', color: '#ef4444', icon: '🔴' },
    { id: 2, label: 'ปิดปรับปรุง', desc: 'ปิดให้บริการชั่วคราว กำลังปรับปรุง', color: '#f59e0b', icon: '🟡' },
  ];

  constructor(
    private router: Router,
    private dormService: DormitoryService,
    private userService: UserService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
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
        // แสดงทุกหอยกเว้น REQ_STATUS=2 (ไม่อนุมัติ)
        this.myDorms = res.data.filter((dorm: any) => dorm.REQ_STATUS !== 2);
      }
    } catch (error) {
      console.error('Error loadMyDorms:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getStatusText(statusId: number, reqStatus: number): string {
    if (statusId === 4) return 'ถูกลบ';
    if (reqStatus === 3) return 'ส่งคำร้องใหม่';
    if (reqStatus === 0) return 'รออนุมัติ';
    if (reqStatus === 2) return 'ไม่อนุมัติ';
    if (statusId === 2) return 'ปิดปรับปรุง';
    if (statusId === 3) return 'ห้องเต็ม';
    return 'ว่าง / ออนไลน์'; 
  }

  getStatusColor(statusId: number, reqStatus: number): string {
    if (statusId === 4) return 'medium';
    if (reqStatus === 3) return 'warning';
    if (reqStatus === 0) return 'warning';
    if (reqStatus === 2) return 'danger';
    if (statusId === 2) return 'warning'; 
    if (statusId === 3) return 'danger'; 
    return 'success'; 
  }

  openStatusSheet(dorm: any) {
    this.selectedDormForStatus = dorm;
    this.isStatusModalOpen = true;
  }

  closeStatusModal() {
    this.isStatusModalOpen = false;
    this.selectedDormForStatus = null;
  }

  async selectStatus(statusId: number) {
    this.closeStatusModal();
    await this.changeStatus(this.selectedDormForStatus?.DORM_ID, statusId);
  }

  async onStatusChange(event: Event, dorm: any) {
    const select = event.target as HTMLSelectElement;
    const newStatusId = Number(select.value);
    if (newStatusId !== dorm.DORM_STATUS_ID) {
      await this.changeStatus(dorm.DORM_ID, newStatusId);
      dorm.DORM_STATUS_ID = newStatusId; // update local immediately
    }
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
    const dorm = this.myDorms.find(d => d.DORM_ID === dormId);
    const dormName = dorm?.DORM_NAME || 'หอพักนี้';
    const userEmail = this.currentUser?.email || this.currentUser?.EMAIL || '';

    const alert = await this.alertCtrl.create({
      header: '🗑️ ลบหอพักออกจากระบบ',
      message: `หอพัก "${dormName}" จะถูกซ่อนออกจากรายการ แต่สามารถกู้คืนได้ภายหลัง\n\nกรุณากรอก Email ของคุณเพื่อยืนยัน:`,
      inputs: [
        {
          name: 'emailConfirm',
          type: 'email',
          placeholder: userEmail || 'ระบุ Email ของคุณ',
        }
      ],
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        {
          text: 'ยืนยันลบ',
          role: 'destructive',
          handler: (data) => {
            if (!data.emailConfirm || data.emailConfirm.trim().toLowerCase() !== userEmail.toLowerCase()) {
              this.showToast('Email ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง', 'danger');
              return false;
            }
            this.executeDelete(dormId);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async executeDelete(dormId: number) {
    const loading = await this.loadingCtrl.create({ message: 'กำลังลบหอพัก...' });
    await loading.present();
    try {
      await this.dormService.changeDormStatus(dormId, 4); // soft delete
      this.showToast('ลบหอพักออกจากระบบแล้ว (กู้คืนได้)', 'success');
      this.loadMyDorms(); 
    } catch (error) {
      this.showToast('ลบไม่สำเร็จ', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  async confirmRestoreWithOTP(dormId: number) {
    const alert = await this.alertCtrl.create({
      header: '🔄 กู้คืนหอพัก',
      message: 'ต้องการกู้คืนหอพักนี้ให้กลับมาออนไลน์ใช่หรือไม่?',
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { text: 'กู้คืน', handler: () => this.executeRestore(dormId) }
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