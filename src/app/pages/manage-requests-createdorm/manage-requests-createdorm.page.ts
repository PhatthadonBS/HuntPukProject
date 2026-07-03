import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonButtons, IonButton, IonIcon, IonSpinner,
  IonSegment, IonSegmentButton, IonLabel, IonBadge, IonTextarea,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  arrowBack, person, business, calendar, checkmarkCircle, closeCircle, 
  eye, eyeOff, folderOpenOutline, mail, call, location, documentText, time,
  bulbOutline, chatboxEllipsesOutline, trashOutline, refreshOutline,
  chevronDownOutline, chevronUpOutline, imagesOutline, bedOutline,
  checkmarkCircleOutline, water, flash, homeOutline, alertCircleOutline,
  sendOutline, closeOutline
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { DormitoryService } from '../../services/dormitory'; 

@Component({
  selector: 'app-manage-requests-createdorm',
  templateUrl: './manage-requests-createdorm.page.html',
  styleUrls: ['./manage-requests-createdorm.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonButtons, IonButton, IonIcon, IonSpinner,
    IonSegment, IonSegmentButton, IonLabel, IonBadge, IonTextarea,
    CommonModule, FormsModule
  ],
  providers: [DatePipe] 
})
export class ManageRequestsCreatedormPage implements OnInit {

  requests: any[] = [];
  isLoading = false;
  currentSegment: string = 'pending'; // pending | approved | rejected | sendback

  // Expanded detail state
  expandedDormId: number | null = null;
  expandedDormData: any = null;
  isLoadingDetail = false;

  // Lightbox
  isLightboxOpen = false;
  lightboxImage = '';

  // Reject reason input
  rejectReasonMap: { [dormId: number]: string } = {};
  showRejectInputMap: { [dormId: number]: boolean } = {};
  showSendBackInputMap: { [dormId: number]: boolean } = {};
  sendBackReasonMap: { [dormId: number]: string } = {};

  constructor(
    private dormService: DormitoryService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router,
  ) { 
    addIcons({ 
      arrowBack, person, business, calendar, checkmarkCircle, 
      closeCircle, eye, eyeOff, folderOpenOutline, mail, call, location, 
      documentText, time, bulbOutline, chatboxEllipsesOutline, trashOutline,
      refreshOutline, chevronDownOutline, chevronUpOutline, imagesOutline,
      bedOutline, checkmarkCircleOutline, water, flash, homeOutline, 
      alertCircleOutline, sendOutline, closeOutline
    });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.loadAllRequests();
  }

  goBack() {
    this.router.navigate(['/home']); 
  }

  // ====== Load all requests (all statuses for admin) ======
  async loadAllRequests() {
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

  // ====== Filter requests by segment ======
  get filteredRequests(): any[] {
    switch (this.currentSegment) {
      case 'pending':   return this.requests.filter(r => r.REQ_STATUS === 0);
      case 'approved':  return this.requests.filter(r => r.REQ_STATUS === 1);
      case 'rejected':  return this.requests.filter(r => r.REQ_STATUS === 2);
      case 'sendback':  return this.requests.filter(r => r.REQ_STATUS === 4);
      default: return this.requests;
    }
  }

  get pendingCount()   { return this.requests.filter(r => r.REQ_STATUS === 0).length; }
  get approvedCount()  { return this.requests.filter(r => r.REQ_STATUS === 1).length; }
  get rejectedCount()  { return this.requests.filter(r => r.REQ_STATUS === 2).length; }
  get sendbackCount()  { return this.requests.filter(r => r.REQ_STATUS === 4).length; }

  getReqStatusLabel(status: number): string {
    switch (status) {
      case 0: return 'รออนุมัติ';
      case 1: return 'อนุมัติแล้ว';
      case 2: return 'ปฏิเสธแล้ว';
      case 4: return 'ส่งกลับแก้ไข';
      default: return 'ไม่ทราบ';
    }
  }

  getReqStatusColor(status: number): string {
    switch (status) {
      case 0: return 'warning';
      case 1: return 'success';
      case 2: return 'danger';
      case 4: return 'tertiary';
      default: return 'medium';
    }
  }

  // ====== Toggle expand detail ======
  async toggleDetail(item: any) {
    if (this.expandedDormId === item.DORM_ID) {
      // ปิด
      this.expandedDormId = null;
      this.expandedDormData = null;
      return;
    }

    // เปิดและโหลดข้อมูลเต็ม
    this.expandedDormId = item.DORM_ID;
    this.expandedDormData = null;
    this.isLoadingDetail = true;
    
    try {
      const res = await this.dormService.getDormById(item.DORM_ID);
      const fullDorm = (res && res.data && Array.isArray(res.data)) ? res.data[0] : (res?.data || item);
      this.expandedDormData = { ...item, ...fullDorm };
    } catch (error) {
      console.error('Fetch Detail Error:', error);
      this.expandedDormData = { ...item }; // fallback
    } finally {
      this.isLoadingDetail = false;
    }
  }

  isExpanded(dormId: number): boolean {
    return this.expandedDormId === dormId;
  }

  // ====== Actions ======
  async approve(item: any) {
    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการอนุมัติ',
      message: `คุณต้องการอนุมัติหอพัก "${item.DORM_NAME}" ให้แสดงในระบบใช่หรือไม่?`,
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        {
          text: 'อนุมัติเลย',
          handler: () => { this.processRequest(item.DORM_ID, true, ''); }
        }
      ]
    });
    await alert.present();
  }

  toggleRejectInput(dormId: number) {
    this.showRejectInputMap[dormId] = !this.showRejectInputMap[dormId];
    if (!this.rejectReasonMap[dormId]) this.rejectReasonMap[dormId] = '';
  }

  async reject(item: any) {
    const reason = (this.rejectReasonMap[item.DORM_ID] || '').trim();
    if (!reason) {
      this.showToast('กรุณาระบุเหตุผลที่ปฏิเสธ', 'warning');
      return;
    }
    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการปฏิเสธ',
      message: `คุณต้องการปฏิเสธคำขอของ "${item.DORM_NAME}" ใช่หรือไม่?`,
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        {
          text: 'ยืนยันปฏิเสธ',
          role: 'destructive',
          handler: () => { this.processRequest(item.DORM_ID, false, reason); }
        }
      ]
    });
    await alert.present();
  }

  toggleSendBackInput(dormId: number) {
    this.showSendBackInputMap[dormId] = !this.showSendBackInputMap[dormId];
    if (!this.sendBackReasonMap[dormId]) this.sendBackReasonMap[dormId] = '';
  }

  async sendBack(item: any) {
    const reason = (this.sendBackReasonMap[item.DORM_ID] || '').trim();
    const alert = await this.alertCtrl.create({
      header: 'ส่งกลับให้แก้ไข',
      message: `ส่งหอพัก "${item.DORM_NAME}" กลับให้เจ้าของแก้ไขและส่งใหม่${reason ? `\n\nหมายเหตุ: ${reason}` : ''}`,
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        {
          text: 'ยืนยัน',
          handler: () => { this.processSendBack(item.DORM_ID, reason); }
        }
      ]
    });
    await alert.present();
  }

  async deleteRequest(item: any) {
    const alert = await this.alertCtrl.create({
      header: 'ลบคำขอออกจากระบบ',
      message: `ลบคำขอของหอพัก "${item.DORM_NAME}" ออกจากระบบถาวรหรือไม่? (เจ้าของหอจะต้องลงทะเบียนใหม่ถ้าต้องการ)`,
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        {
          text: 'ลบออก',
          role: 'destructive',
          handler: () => { this.executeDelete(item.DORM_ID); }
        }
      ]
    });
    await alert.present();
  }

  // ====== Process ======
  async processRequest(dormId: number, isApprove: boolean, msg: string) {
    this.isLoading = true;
    try {
      await this.dormService.approveRequest(dormId, isApprove, msg);
      this.showToast(isApprove ? '✅ อนุมัติสำเร็จ' : '🚫 ปฏิเสธคำขอเรียบร้อย', 'success');
      this.expandedDormId = null;
      this.expandedDormData = null;
      this.rejectReasonMap[dormId] = '';
      this.showRejectInputMap[dormId] = false;
      await this.loadAllRequests();
    } catch (error: any) {
      const errMsg = error.error?.message || 'เกิดข้อผิดพลาด';
      this.showToast(errMsg, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async processSendBack(dormId: number, reason: string) {
    this.isLoading = true;
    try {
      await this.dormService.sendBackForRevision(dormId, reason);
      this.showToast('📩 ส่งกลับให้แก้ไขเรียบร้อย', 'success');
      this.expandedDormId = null;
      this.expandedDormData = null;
      this.sendBackReasonMap[dormId] = '';
      this.showSendBackInputMap[dormId] = false;
      await this.loadAllRequests();
    } catch (error: any) {
      const errMsg = error.error?.message || 'เกิดข้อผิดพลาด';
      this.showToast(errMsg, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async executeDelete(dormId: number) {
    this.isLoading = true;
    try {
      await this.dormService.deletePendingRequest(dormId);
      this.showToast('🗑️ ลบคำขอเรียบร้อยแล้ว', 'success');
      if (this.expandedDormId === dormId) {
        this.expandedDormId = null;
        this.expandedDormData = null;
      }
      await this.loadAllRequests();
    } catch (error: any) {
      const errMsg = error.error?.message || 'เกิดข้อผิดพลาด';
      this.showToast(errMsg, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // ====== Lightbox ======
  viewImage(src: string) {
    if (!src) return;
    this.lightboxImage = src;
    this.isLightboxOpen = true;
  }
  closeLightbox() {
    this.isLightboxOpen = false;
  }

  // ====== Helpers ======
  getImages(dorm: any): string[] {
    const imgs = dorm?.GALLERY || dorm?.gallery || [];
    if (Array.isArray(imgs)) return imgs;
    return [];
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}