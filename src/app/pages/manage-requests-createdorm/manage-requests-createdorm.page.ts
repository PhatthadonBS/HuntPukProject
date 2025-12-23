import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonButtons, IonButton, IonIcon, IonSpinner,
  AlertController, ToastController, LoadingController, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
// ✅ Import Icons ให้ครบชุด
import { 
  arrowBack, person, business, calendar, checkmarkCircle, closeCircle, 
  eye, folderOpenOutline, mail, call, location, documentText, time
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { DormitoryService } from '../../services/dormitory'; 
import { DormRequestModalComponent } from '../../components/dorm-request-modal/dorm-request-modal.component';

@Component({
  selector: 'app-manage-requests-createdorm',
  templateUrl: './manage-requests-createdorm.page.html',
  styleUrls: ['./manage-requests-createdorm.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonButtons, IonButton, IonIcon, IonSpinner,
    CommonModule, FormsModule
  ],
  providers: [DatePipe] 
})
export class ManageRequestsCreatedormPage implements OnInit {

  requests: any[] = [];
  isLoading = false;

  constructor(
    private dormService: DormitoryService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private router: Router,
    private modalCtrl: ModalController 
  ) { 
    // ✅ ลงทะเบียน Icons ทั้งหมดที่ใช้
    addIcons({ 
      arrowBack, person, business, calendar, checkmarkCircle, 
      closeCircle, eye, folderOpenOutline, mail, call, location, 
      documentText, time 
    });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.loadPendingRequests();
  }

  goBack() {
    this.router.navigate(['/home']); 
  }

  async loadPendingRequests() {
    this.isLoading = true;
    try {
      const res = await this.dormService.getPendingRequests();
      if (res && res.data) {
        this.requests = res.data;
      } else {
        this.requests = [];
      }
    } catch (error) {
      console.error('Load Error:', error);
      this.showToast('โหลดข้อมูลล้มเหลว', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async viewOwnerDetail(item: any) {
    const modal = await this.modalCtrl.create({
      component: DormRequestModalComponent,
      componentProps: { dorm: item }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    
    if (data?.action) {
      if (data.action === 'approve') this.confirmAction(item, true);
      else if (data.action === 'reject') this.confirmAction(item, false);
    }
  }

  async confirmAction(item: any, isApprove: boolean) {
    const actionText = isApprove ? 'อนุมัติ' : 'ปฏิเสธ';
    
    if (!isApprove) {
      const alert = await this.alertCtrl.create({
        header: `ยืนยันการ${actionText}`,
        message: `คุณต้องการปฏิเสธคำขอของ "${item.DORM_NAME}" ใช่หรือไม่?`,
        inputs: [
          {
            name: 'reason',
            type: 'textarea',
            placeholder: 'ระบุเหตุผลที่ปฏิเสธ (จำเป็น)',
          }
        ],
        buttons: [
          { text: 'ยกเลิก', role: 'cancel' },
          {
            text: 'ยืนยันปฏิเสธ',
            role: 'destructive',
            handler: (data) => {
              if (!data.reason || data.reason.trim() === '') {
                this.showToast('กรุณาระบุเหตุผล', 'warning');
                return false;
              }
              this.processRequest(item.DORM_ID, false, data.reason);
              return true;
            }
          }
        ]
      });
      await alert.present();
    } else {
      const alert = await this.alertCtrl.create({
        header: `ยืนยันการ${actionText}`,
        message: `คุณต้องการอนุมัติหอพัก "${item.DORM_NAME}" ให้แสดงในระบบใช่หรือไม่?`,
        buttons: [
          { text: 'ยกเลิก', role: 'cancel' },
          {
            text: 'อนุมัติเลย',
            handler: () => {
              this.processRequest(item.DORM_ID, true);
            }
          }
        ]
      });
      await alert.present();
    }
  }

  async processRequest(dormId: number, isApprove: boolean, msg: string = '') {
    const loading = await this.loadingCtrl.create({ message: 'กำลังประมวลผล...' });
    await loading.present();

    try {
      await this.dormService.approveRequest(dormId, isApprove, msg);
      this.showToast(isApprove ? 'อนุมัติสำเร็จ' : 'ปฏิเสธคำขอเรียบร้อย', 'success');
      await this.loadPendingRequests();
    } catch (error: any) {
      console.error('Process Error:', error);
      const errMsg = error.error?.message || 'เกิดข้อผิดพลาด';
      this.showToast(errMsg, 'danger');
    } finally {
      loading.dismiss();
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