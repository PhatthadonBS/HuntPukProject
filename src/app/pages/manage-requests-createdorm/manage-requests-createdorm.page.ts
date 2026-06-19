import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonButtons, IonButton, IonIcon, IonSpinner,
  IonSegment, IonSegmentButton, IonLabel,
  AlertController, ToastController, LoadingController, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
// ✅ Import Icons ให้ครบชุด
import { 
  arrowBack, person, business, calendar, checkmarkCircle, closeCircle, 
  eye, folderOpenOutline, mail, call, location, documentText, time,
  bulbOutline, chatboxEllipsesOutline
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
    IonSegment, IonSegmentButton, IonLabel,
    CommonModule, FormsModule
  ],
  providers: [DatePipe] 
})
export class ManageRequestsCreatedormPage implements OnInit {

  requests: any[] = [];
  pendingFacilities: any[] = [];
  isLoading = false;
  currentSegment: string = 'dorms';

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
      documentText, time, bulbOutline, chatboxEllipsesOutline
    });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.loadPendingRequests();
    this.loadPendingFacilities();
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
      this.showToast('โหลดข้อมูลหอพักล้มเหลว', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async loadPendingFacilities() {
    try {
      const res = await this.dormService.getPendingFacilities().toPromise();
      if (res && res.data) {
        this.pendingFacilities = res.data;
      } else {
        this.pendingFacilities = [];
      }
    } catch (error) {
      console.error('Load Facilities Error:', error);
    }
  }

  async viewOwnerDetail(item: any) {
    this.isLoading = true;
    try {
      const res = await this.dormService.getDormById(item.DORM_ID);
      const fullDormInfo = (res && res.data && Array.isArray(res.data)) ? res.data[0] : (res?.data || item);
      const finalDorm = { ...item, ...fullDormInfo };

      const modal = await this.modalCtrl.create({
        component: DormRequestModalComponent,
        componentProps: { dorm: finalDorm }
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();
      
      if (data?.action) {
        if (data.action === 'approve') this.confirmAction(item, true);
        else if (data.action === 'reject') this.confirmAction(item, false);
      }
    } catch (error) {
      console.error('Fetch Full Dorm Error:', error);
      this.showToast('โหลดข้อมูลหอพักไม่สำเร็จ', 'danger');
    } finally {
      this.isLoading = false;
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
    this.isLoading = true;
    try {
      await this.dormService.approveRequest(dormId, isApprove, msg);
      this.showToast(isApprove ? 'อนุมัติสำเร็จ' : 'ปฏิเสธคำขอเรียบร้อย', 'success');
      await this.loadPendingRequests();
    } catch (error: any) {
      console.error('Process Error:', error);
      const errMsg = error.error?.message || 'เกิดข้อผิดพลาด';
      this.showToast(errMsg, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async confirmFacilityAction(item: any, isApprove: boolean) {
    const actionText = isApprove ? 'อนุมัติ' : 'ปฏิเสธ';
    
    if (!isApprove) {
      const alert = await this.alertCtrl.create({
        header: `ยืนยันการ${actionText}`,
        message: `คุณต้องการปฏิเสธสิ่งอำนวยความสะดวก "${item.FAC_TYPE_NAME}" ใช่หรือไม่?`,
        inputs: [
          {
            name: 'reason',
            type: 'textarea',
            placeholder: 'ระบุเหตุผลที่ปฏิเสธ (ถ้ามี)',
          }
        ],
        buttons: [
          { text: 'ยกเลิก', role: 'cancel' },
          {
            text: 'ยืนยันปฏิเสธ',
            role: 'destructive',
            handler: (data) => {
              this.processFacilityRequest(item.FAC_TYPE_ID, false, data.reason);
              return true;
            }
          }
        ]
      });
      await alert.present();
    } else {
      const alert = await this.alertCtrl.create({
        header: `ยืนยันการ${actionText}`,
        message: `คุณต้องการอนุมัติ "${item.FAC_TYPE_NAME}" ให้ใช้งานในระบบใช่หรือไม่?`,
        buttons: [
          { text: 'ยกเลิก', role: 'cancel' },
          {
            text: 'อนุมัติเลย',
            handler: () => {
              this.processFacilityRequest(item.FAC_TYPE_ID, true);
            }
          }
        ]
      });
      await alert.present();
    }
  }

  async processFacilityRequest(facId: number, isApprove: boolean, msg: string = '') {
    this.isLoading = true;
    try {
      await this.dormService.approveFacilityReq(facId, isApprove, msg).toPromise();
      this.showToast(isApprove ? 'อนุมัติสิ่งอำนวยความสะดวกสำเร็จ' : 'ปฏิเสธเรียบร้อย', 'success');
      await this.loadPendingFacilities();
    } catch (error: any) {
      console.error('Process Facility Error:', error);
      const errMsg = error.error?.message || 'เกิดข้อผิดพลาด';
      this.showToast(errMsg, 'danger');
    } finally {
      this.isLoading = false;
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