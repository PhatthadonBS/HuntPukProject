import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  people, folderOpenOutline, close, logoFacebook, chatbubbles, 
  checkmarkCircle, closeCircle, time, logoInstagram, logoTwitter, paperPlane 
} from 'ionicons/icons'; // ✅ เพิ่ม paperPlane สำหรับ Telegram
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
  filteredRequests: OwnerRequest[] = [];
  isLoading = false;
  isModalOpen = false;
  selectedReq: OwnerRequest | null = null;
  searchQuery: string = '';

  constructor(
    private requestService: OwnerRequestService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) { 
    // เพิ่มไอคอนให้ครบ
    addIcons({ people, folderOpenOutline, close, logoFacebook, chatbubbles, checkmarkCircle, closeCircle, time, logoInstagram, logoTwitter, paperPlane });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.fetchRequests();
  }

  async fetchRequests() {
    this.isLoading = true;
    this.requestService.getAllRequests().subscribe({
      next: (res) => {
        // กรองคำขอที่ซ้ำซ้อนโดยใช้ user_id
        const uniqueRequests = res.filter((req, index, self) =>
          index === self.findIndex((t) => (
            t.user_id === req.user_id
          ))
        );
        this.requests = uniqueRequests;
        this.filteredRequests = uniqueRequests;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading = false;
      }
    });
  }

  searchRequests() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredRequests = [...this.requests];
    } else {
      this.filteredRequests = this.requests.filter(req => {
        const fullName = `${req.first_name || ''} ${req.last_name || ''}`.toLowerCase();
        const phone = req.phone_number || '';
        return fullName.includes(query) || phone.includes(query);
      });
    }
  }

  
  handleImageError(event: any) {
    event.target.onerror = null; 
    event.target.src = 'https://placehold.co/150x150?text=No+Image';
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'approved': return 'อนุมัติแล้ว';
      case 'rejected': return 'ปฏิเสธแล้ว';
      default: return 'รอการตรวจสอบ';
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

  async updateStatus(req: OwnerRequest, status: 'approved' | 'rejected') {
    if (status === 'approved') {
      await this.showApproveAlert(req);
    } else {
      await this.showRejectAlert(req);
    }
  }

  async showApproveAlert(req: OwnerRequest) {
    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการอนุมัติ',
      message: `คุณต้องการให้สิทธิ์คุณ ${req.first_name} เป็นเจ้าของหอพักใช่หรือไม่?`,
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { 
          text: 'ยืนยันอนุมัติ', 
          handler: () => { this.processUpdate(req.user_id, true, ''); }
        }
      ]
    });
    await alert.present();
  }

  async showRejectAlert(req: OwnerRequest) {
    const alert = await this.alertCtrl.create({
      header: 'ปฏิเสธคำขอ',
      message: 'กรุณาระบุเหตุผล (ถ้ามี)',
      inputs: [ { name: 'reason', type: 'textarea', placeholder: 'ระบุเหตุผล...' } ],
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { 
          text: 'ยืนยันปฏิเสธ', cssClass: 'alert-btn-reject',
          handler: (data) => {
            const msg = data.reason || 'ไม่ผ่านการพิจารณา';
            this.processUpdate(req.user_id, false, msg);
          }
        }
      ]
    });
    await alert.present();
  }

  async processUpdate(userId: number, approveStatus: boolean, msg: string) {
    const loading = await this.loadingCtrl.create({
      message: 'กำลังดำเนินการ...',
      spinner: 'crescent'
    });
    await loading.present();

    this.requestService.approveRequest(userId, approveStatus, msg).subscribe({
      next: async () => {
        await loading.dismiss();
        
        // ลบข้อมูลที่ดำเนินการแล้วออกจากหน้ารายการทันที
        this.requests = this.requests.filter(req => req.user_id !== userId);
        this.searchRequests(); // อัปเดต list ที่แสดงผล
        
        const toast = await this.toastCtrl.create({
          message: approveStatus ? 'อนุมัติเรียบร้อย' : 'ปฏิเสธคำขอเรียบร้อย',
          duration: 2000, color: approveStatus ? 'success' : 'warning'
        });
        await toast.present();
        
        this.closeModal();
      },
      error: async (err) => {
        await loading.dismiss();
        const toast = await this.toastCtrl.create({
          message: 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง', duration: 3000, color: 'danger'
        });
        await toast.present();
      }
    });
  }
}