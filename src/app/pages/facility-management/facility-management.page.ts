import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonAvatar, IonImg,
  IonIcon, IonButton, IonAlert, ToastController, AlertController, IonItemSliding,
  IonItemOptions, IonItemOption, IonModal, IonInput
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, closeCircleOutline, closeOutline, trashOutline, createOutline, documentTextOutline, cubeOutline, cameraOutline, imageOutline, informationCircleOutline } from 'ionicons/icons';
import { DormitoryService } from '../../services/dormitory';
import { FacilityItem } from '../../model/dorm.model';

@Component({
  selector: 'app-facility-management',
  templateUrl: './facility-management.page.html',
  styleUrls: ['./facility-management.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonAvatar, IonImg,
    IonIcon, IonButton, IonItemSliding, IonItemOptions, IonItemOption, IonModal, IonInput,
    CommonModule, FormsModule
  ]
})
export class FacilityManagementPage implements OnInit {
  
  currentSegment = signal<'all' | 'requests'>('all');
  allFacilities = signal<FacilityItem[]>([]);
  facilityRequests = signal<FacilityItem[]>([]);
  isLoading = signal<boolean>(false);
  
  isEditModalOpen = signal<boolean>(false);
  editFacName = signal<string>('');
  editingFacId = signal<number | null>(null);
  editSelectedFile = signal<File | null>(null);
  editPreviewUrl = signal<string | null>(null);

  constructor(
    private dormSv: DormitoryService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({ checkmarkCircleOutline, closeCircleOutline, closeOutline, trashOutline, createOutline, documentTextOutline, cubeOutline, cameraOutline, imageOutline, informationCircleOutline });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loadAllFacilities();
    this.loadFacilityRequests();
  }

  loadAllFacilities() {
    this.isLoading.set(true);
    this.dormSv.getFacilities().subscribe({
      next: (res: any) => {
        if (res && res.success && res.data) {
          this.allFacilities.set(res.data);
        } else if (Array.isArray(res)) {
          this.allFacilities.set(res);
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error(err);
        this.allFacilities.set([]);
        this.isLoading.set(false);
      }
    });
  }

  loadFacilityRequests() {
    this.isLoading.set(true);
    this.dormSv.getPendingFacilities().subscribe({
      next: (res: any) => {
        if (res && res.success && res.data) {
          this.facilityRequests.set(res.data);
        } else if (Array.isArray(res)) {
          this.facilityRequests.set(res);
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error(err);
        this.facilityRequests.set([]);
        this.isLoading.set(false);
      }
    });
  }

  segmentChanged(event: any) {
    this.currentSegment.set(event.detail.value);
  }

  handleImageError(fac: FacilityItem) {
    fac.FAC_TYPE_ICON = '';
  }

  openEditModal(fac: FacilityItem) {
    this.editingFacId.set(fac.FAC_TYPE_ID);
    this.editFacName.set(fac.FAC_TYPE_NAME);
    this.editSelectedFile.set(null);
    this.editPreviewUrl.set(fac.FAC_TYPE_ICON || null);
    this.isEditModalOpen.set(true);
  }

  selectNativeImage(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.editSelectedFile.set(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editPreviewUrl.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async saveEditFacility() {
    const facId = this.editingFacId();
    if (!facId) return;
    
    if (!this.editFacName().trim()) {
      this.showToast('กรุณากรอกชื่อสิ่งอำนวยความสะดวก', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('fac_id', facId.toString());
    formData.append('fac_name', this.editFacName());
    
    const file = this.editSelectedFile();
    if (file) {
      formData.append('icon', file);
    }

    // Pass user_id = 1 for admin
    this.dormSv.updateFacility(formData, 1).subscribe({
      next: () => {
        this.showToast('อัปเดตข้อมูลสำเร็จ', 'success');
        this.isEditModalOpen.set(false);
        this.loadData();
      },
      error: () => this.showToast('เกิดข้อผิดพลาดในการอัปเดต', 'danger')
    });
  }

  async approveFacility(fac: FacilityItem) {
    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการอนุมัติ',
      message: `คุณต้องการอนุมัติสิ่งอำนวยความสะดวก "${fac.FAC_TYPE_NAME}" ใช่หรือไม่?`,
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { 
          text: 'ยืนยัน', 
          handler: () => {
            this.dormSv.approveFacilityReq(fac.FAC_TYPE_ID, true).subscribe({
              next: () => {
                this.showToast('อนุมัติสำเร็จ', 'success');
                this.loadData();
              },
              error: () => this.showToast('เกิดข้อผิดพลาดในการอนุมัติ', 'danger')
            });
          } 
        }
      ]
    });
    await alert.present();
  }

  async rejectFacility(fac: FacilityItem) {
    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการปฏิเสธ',
      message: `คุณต้องการปฏิเสธคำร้องขอสิ่งอำนวยความสะดวก "${fac.FAC_TYPE_NAME}" ใช่หรือไม่?`,
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { 
          text: 'ยืนยัน', 
          handler: () => {
            this.dormSv.approveFacilityReq(fac.FAC_TYPE_ID, false).subscribe({
              next: () => {
                this.showToast('ปฏิเสธคำร้องขอสำเร็จ', 'success');
                this.loadData();
              },
              error: () => this.showToast('เกิดข้อผิดพลาดในการปฏิเสธ', 'danger')
            });
          } 
        }
      ]
    });
    await alert.present();
  }

  async deleteFacility(fac: FacilityItem) {
    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการลบ',
      message: `คุณต้องการลบสิ่งอำนวยความสะดวก "${fac.FAC_TYPE_NAME}" ใช่หรือไม่?`,
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { 
          text: 'ลบ', 
          role: 'destructive',
          handler: () => {
            this.dormSv.approveFacilityReq(fac.FAC_TYPE_ID, false, 'Deleted by Admin').subscribe({
              next: () => {
                this.showToast('ลบสิ่งอำนวยความสะดวกสำเร็จ', 'success');
                this.loadData();
              },
              error: () => this.showToast('เกิดข้อผิดพลาดในการลบ', 'danger')
            });
          } 
        }
      ]
    });
    await alert.present();
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
