import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  people, folderOpenOutline, close, logoFacebook, chatbubbles, 
  checkmarkCircle, closeCircle, time 
} from 'ionicons/icons';
import { OwnerRequestService, OwnerRequest } from '../../services/owner-request';

@Component({
  selector: 'app-manage-requests-dorm-owner',
  templateUrl: './manage-requests-dorm-owner.page.html',
  styleUrls: ['./manage-requests-dorm-owner.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ManageRequestsDormOwnerPage implements OnInit {

  requests: OwnerRequest[] = [];
  isLoading = false;
  
  isModalOpen = false;
  selectedReq: OwnerRequest | null = null;

  constructor(
    private requestService: OwnerRequestService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) { 
    addIcons({ people, folderOpenOutline, close, logoFacebook, chatbubbles, checkmarkCircle, closeCircle, time });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.fetchRequests();
  }

  async fetchRequests() {
    this.isLoading = true;
    this.requestService.getAllRequests().subscribe({
      next: (res) => {

        this.requests = res; 
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching requests:', err);
        this.isLoading = false;
      }
    });
  }
  getStatusLabel(status: string): string {
    switch(status) {
      case 'approved': return 'ยืนยันแล้ว';
      case 'rejected': return 'ปฏิเสธแล้ว';
      default: return 'รอการดำเนินการ';
    }
  }

  openDetailModal(req: OwnerRequest) {
    this.selectedReq = req;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedReq = null;
  }

  // ✅ ฟังก์ชันหลัก: ตัดสินใจว่าจะโชว์ Alert แบบไหน
  async updateStatus(req: OwnerRequest, status: 'approved' | 'rejected') {
    if (status === 'approved') {
      await this.showApproveAlert(req);
    } else {
      await this.showRejectAlert(req);
    }
  }

  // 🟢 1. Alert สำหรับการอนุมัติ (ไม่ต้องกรอกเหตุผล)
  async showApproveAlert(req: OwnerRequest) {
    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการอนุมัติ',
      message: `คุณต้องการให้สิทธิ์ ${req.first_name} เป็นเจ้าของหอพักใช่หรือไม่?`,
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { 
          text: 'อนุมัติ', 
          handler: () => {
            // ส่ง true, msg ว่าง
            this.processUpdate(req.user_id, true, '');
          }
        }
      ]
    });
    await alert.present();
  }

  // 🔴 2. Alert สำหรับการปฏิเสธ (มีช่องกรอกเหตุผล)
  async showRejectAlert(req: OwnerRequest) {
    const alert = await this.alertCtrl.create({
      header: 'ปฏิเสธคำขอ',
      message: 'กรุณาระบุเหตุผลที่ปฏิเสธ (ระบบจะส่งอีเมลแจ้งผู้ใช้)',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'ระบุเหตุผล เช่น เอกสารไม่ครบถ้วน...'
        }
      ],
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { 
          text: 'ยืนยันปฏิเสธ', 
          cssClass: 'alert-btn-reject', // (Optional Class)
          handler: (data) => {
            // ถ้าไม่กรอกเหตุผล ให้แจ้งเตือน หรือใส่ค่า Default
            const msg = data.reason || 'ไม่ผ่านการพิจารณา';
            // ส่ง false, พร้อม msg
            this.processUpdate(req.user_id, false, msg);
          }
        }
      ]
    });
    await alert.present();
  }

  // 🚀 ยิง API จริง
  processUpdate(userId: number, approveStatus: boolean, msg: string) {
    this.requestService.approveRequest(userId, approveStatus, msg).subscribe({
      next: async (res) => {
        const toast = await this.toastCtrl.create({
          message: approveStatus ? 'อนุมัติสิทธิ์สำเร็จ' : 'ปฏิเสธคำขอเรียบร้อย',
          duration: 2000,
          color: approveStatus ? 'success' : 'warning'
        });
        await toast.present();
        
        this.closeModal();
        this.fetchRequests(); // โหลดข้อมูลใหม่
      },
      error: async (err) => {
        console.error(err);
        const toast = await this.toastCtrl.create({
          message: 'เกิดข้อผิดพลาด: ' + (err.error?.message || 'เชื่อมต่อ Server ไม่ได้'),
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }
}