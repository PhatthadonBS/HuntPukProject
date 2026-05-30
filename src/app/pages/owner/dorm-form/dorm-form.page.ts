import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonButtons, IonBackButton, IonButton, IonIcon, 
  IonSegment, IonSegmentButton, IonLabel, 
  IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonCheckbox, IonList, LoadingController, ToastController, AlertController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  saveOutline, imageOutline, homeOutline, wifi, 
  bedOutline, trashOutline, addCircleOutline, locationOutline, cloudUploadOutline, closeCircle 
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { DormitoryService } from '../../../services/dormitory';
import { lastValueFrom } from 'rxjs'; 

@Component({
  selector: 'app-dorm-form',
  templateUrl: './dorm-form.page.html',
  styleUrls: ['./dorm-form.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonButtons, IonBackButton, IonButton, IonIcon, 
    IonSegment, IonSegmentButton, IonLabel,
    IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonCheckbox, IonList, CommonModule, FormsModule
  ]
})
export class DormFormPage implements OnInit {
  activeSegment: string = 'general';
  ownerId: number = 0;
  
  formData: any = {
    name: '', address: '', lat: 16.245279, lng: 103.250106, 
    zone_id: null, type_id: 1, water_unit: null, water_lump: null, elect_unit: null, detail: ''
  };

  zones: any[] = [];
  facilities: any[] = []; 
  roomTypes: any[] = [];

  selectedFiles: any = { FRONT_DORM_IMG: null, BED_IMG: null, BATHROOM_IMG: null, OTHER_IMG: [] };
  previews: any = { FRONT_DORM_IMG: null, BED_IMG: null, BATHROOM_IMG: null, OTHER_IMG: [] };

  constructor(
    private router: Router,
    private dormService: DormitoryService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      saveOutline, homeOutline, locationOutline, wifi, 
      bedOutline, addCircleOutline, trashOutline, imageOutline, 
      cloudUploadOutline, closeCircle
    });
  }

  async ngOnInit() {
    const stored = localStorage.getItem('loggedIn');
    if (stored) {
      const user = JSON.parse(stored);
      this.ownerId = user.id || user.USER_ID;
    }
    await this.loadInitialData();
    this.resetForm(); // เคลียร์ฟอร์มเตรียมพร้อม
  }

  async loadInitialData() {
    try {
      const zoneRes = await this.dormService.getZones();
      if (zoneRes.success) this.zones = zoneRes.data;

      const facRes: any = await lastValueFrom(this.dormService.getFacilities());
      if (facRes && facRes.length > 0) {
        this.facilities = facRes.map((f: any) => ({
          id: f.FAC_TYPE_ID, name: f.FAC_TYPE_NAME, checked: false 
        }));
      }
    } catch (error) { console.error('Error loading initial data', error); }
  }

  resetForm() {
    this.formData = {
      name: '', address: '', lat: 16.245279, lng: 103.250106, 
      zone_id: null, type_id: 1, water_unit: null, water_lump: null, elect_unit: null, detail: ''
    };
    this.facilities.forEach(f => f.checked = false);
    this.roomTypes = [{ id: null, roomType: '', bedType: '1', perMonth: null, perTerm: null, perDay: null }];
    this.selectedFiles = { FRONT_DORM_IMG: null, BED_IMG: null, BATHROOM_IMG: null, OTHER_IMG: [] };
    this.previews = { FRONT_DORM_IMG: null, BED_IMG: null, BATHROOM_IMG: null, OTHER_IMG: [] };
    this.activeSegment = 'general';
  }

  segmentChanged(ev: any) { this.activeSegment = ev.detail.value; }

  addRoomType() {
    this.roomTypes.push({ id: null, roomType: '', bedType: '1', perMonth: null, perTerm: null, perDay: null });
  }

  removeRoomType(index: number) {
    if (this.roomTypes.length > 1) this.roomTypes.splice(index, 1);
  }

  onFileSelect(event: any, field: string) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFiles[field] = file;
      const reader = new FileReader();
      reader.onload = () => { this.previews[field] = reader.result; };
      reader.readAsDataURL(file);
    }
  }

  onGallerySelect(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.selectedFiles.OTHER_IMG.push(files[i]);
        const reader = new FileReader();
        reader.onload = () => { this.previews.OTHER_IMG.push(reader.result); };
        reader.readAsDataURL(files[i]);
      }
    }
  }

  removeGalleryImage(index: number) {
    this.previews.OTHER_IMG.splice(index, 1);
    this.selectedFiles.OTHER_IMG.splice(index, 1);
  }

  async onSubmit() {
    if (!this.formData.name || !this.formData.zone_id || !this.selectedFiles.FRONT_DORM_IMG) {
      this.showToast('กรุณากรอกชื่อหอพัก, โซนที่ตั้ง และใส่รูปหน้าปกหอพักให้ครบถ้วน', 'warning');
      return;
    }

    const confirmAlert = await this.alertCtrl.create({
      header: 'ยืนยัน',
      message: 'ต้องการบันทึกข้อมูลหอพักใหม่ใช่หรือไม่?',
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { text: 'บันทึก', handler: () => { this.processSaveData(); } }
      ]
    });
    await confirmAlert.present();
  }

  async processSaveData() {
    const loading = await this.loadingCtrl.create({ message: 'กำลังบันทึกข้อมูล...' });
    await loading.present();

    try {
      const form = new FormData();
      
      form.append('user_id', this.ownerId.toString());
      form.append('name', this.formData.name || '');
      form.append('address', this.formData.address || '');
      form.append('lat', (this.formData.lat || 0).toString());
      form.append('lng', (this.formData.lng || 0).toString());
      form.append('zone_id', (this.formData.zone_id || '').toString());
      form.append('type_id', (this.formData.type_id || 1).toString());
      form.append('detail', this.formData.detail || '');

      form.append('water_unit', (this.formData.water_unit || 0).toString());
      form.append('water_lump', (this.formData.water_lump || 0).toString());
      form.append('elect_unit', (this.formData.elect_unit || 0).toString());
      
      const selectedFacIds = this.facilities.filter((f: any) => f.checked).map((f: any) => f.id);
      form.append('facilities', JSON.stringify(selectedFacIds));
      form.append('roomTypes', JSON.stringify(this.roomTypes));

      if (this.selectedFiles.FRONT_DORM_IMG) form.append('FRONT_DORM_IMG', this.selectedFiles.FRONT_DORM_IMG);
      if (this.selectedFiles.BED_IMG) form.append('BED_IMG', this.selectedFiles.BED_IMG);
      if (this.selectedFiles.BATHROOM_IMG) form.append('BATHROOM_IMG', this.selectedFiles.BATHROOM_IMG);
      
      if (this.selectedFiles.OTHER_IMG && this.selectedFiles.OTHER_IMG.length > 0) {
        this.selectedFiles.OTHER_IMG.forEach((file: any) => {
          form.append('OTHER_IMG', file);
        });
      }

      await lastValueFrom(this.dormService.createDorm(form));
      
      loading.dismiss();
      this.showSuccessFlow(); // 🌟 เรียก Flow แจ้งเตือนความสำเร็จ

    } catch (error: any) {
      loading.dismiss();
      this.showToast('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่', 'danger');
    }
  }

  // 🌟 แจ้งเตือน + รอ 24 ชม.
  async showSuccessFlow() {
    const alert = await this.alertCtrl.create({
      header: 'บันทึกสำเร็จ!',
      message: 'ข้อมูลหอพักของคุณถูกส่งแล้ว <b>กรุณารอผู้ดูแลระบบตรวจสอบข้อมูลภายใน 24 ชั่วโมง</b> หากผ่านการอนุมัติ หอพักของคุณจะแสดงบนระบบ',
      buttons: [
        {
          text: 'ตกลง',
          handler: () => { this.askAddMore(); }
        }
      ],
      backdropDismiss: false
    });
    await alert.present();
  }

  // 🌟 ถามว่าต้องการเพิ่มหอพักอีกหรือไม่
  async askAddMore() {
    const alert = await this.alertCtrl.create({
      header: 'จัดการหอพัก',
      message: 'ท่านต้องการลงทะเบียนหอพักเพิ่มอีกหรือไม่?',
      buttons: [
        {
          text: 'ไม่, กลับไปหน้ารายการ',
          role: 'cancel',
          handler: () => { this.router.navigate(['/my-dorms']); }
        },
        {
          text: 'ใช่, เพิ่มหอพักอีก',
          handler: () => { this.resetForm(); }
        }
      ]
    });
    await alert.present();
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2500, color: color, position: 'bottom' });
    toast.present();
  }
}