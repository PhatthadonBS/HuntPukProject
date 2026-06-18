import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonButtons, IonBackButton, IonButton, IonIcon, 
  IonSegment, IonSegmentButton, IonLabel, 
  IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonCheckbox, IonList, IonListHeader,
  LoadingController, ToastController, AlertController, IonImg
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  saveOutline, imageOutline, homeOutline, wifi, 
  bedOutline, trashOutline, addCircleOutline, locationOutline, cloudUploadOutline, closeCircle,
  checkmarkCircle, checkmarkCircleOutline
} from 'ionicons/icons';
import { ActivatedRoute, Router } from '@angular/router';
import { DormitoryService } from '../../services/dormitory';
import { lastValueFrom } from 'rxjs'; 

@Component({
  selector: 'app-edit-dorm',
  templateUrl: './edit-dorm.page.html',
  styleUrls: ['./edit-dorm.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonButtons, IonBackButton, IonButton, IonIcon, 
    IonSegment, IonSegmentButton, IonLabel,
    IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonCheckbox, IonList, IonListHeader, IonImg,
    CommonModule, FormsModule
  ]
})
export class EditDormPage implements OnInit {
  dormId: number = 0;
  activeSegment: string = 'general';
  
  formData: any = {
    name: '',
    address: '',
    lat: 16.245279,
    lng: 103.250106,
    zone_id: null,
    type_id: null,
    water_unit: null,
    water_lump: null,
    elect_unit: null,
    detail: ''
  };

  zones: any[] = [];
  facilities: any[] = []; 
  roomTypes: any[] = [];

  selectedFiles: any = {
    FRONT_DORM_IMG: null,
    BED_IMG: null,
    BATHROOM_IMG: null,
    OTHER_IMG: []
  };

  previews: any = {
    FRONT_DORM_IMG: null,
    BED_IMG: null,
    BATHROOM_IMG: null,
    OTHER_IMG: []
  };

  existingGallery: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dormService: DormitoryService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      saveOutline, homeOutline, locationOutline, wifi, 
      bedOutline, addCircleOutline, trashOutline, imageOutline, 
      cloudUploadOutline, closeCircle,
      'checkmark-circle': checkmarkCircle,
      'checkmark-circle-outline': checkmarkCircleOutline
    });
  }

  async ngOnInit() {
    this.dormId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.dormId) {
      await this.loadInitialData(); 
      await this.loadDormData(this.dormId);
    }
  }

  async loadInitialData() {
    try {
      const zoneRes = await this.dormService.getZones();
      if (zoneRes.success) {
        this.zones = zoneRes.data;
      }

      const facRes: any = await lastValueFrom(this.dormService.getFacilities());
      if (facRes && facRes.length > 0) {
        this.facilities = facRes.map((f: any) => ({
          id: f.FAC_TYPE_ID,
          name: f.FAC_TYPE_NAME,
          icon: f.FAC_TYPE_ICON || f.icon || '',
          checked: false 
        }));
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  async loadDormData(id: number) {
    const loading = await this.loadingCtrl.create({ message: 'กำลังโหลดข้อมูล...' });
    await loading.present();

    try {
      const res = await this.dormService.getDormById(id);
      if (res.success) {
        const d = res.data;
        this.formData = {
          name: d.DORM_NAME,
          address: d.ADDRESS,
          lat: parseFloat(d.lat) || 0,
          lng: parseFloat(d.lng) || 0,
          zone_id: d.ZONE_ID,
          type_id: d.DORM_TYPE_ID,
          water_unit: d.WATER_UNIT || 0,
          water_lump: d.WATER_LUMP || 0,
          elect_unit: d.ELECT_UNIT || 0,
          detail: d.ADD_DORM_DATA || ''
        };

    const dormFacs = d.facilities || [];
        this.facilities.forEach((fac: any) => {
          if (dormFacs.includes(fac.name)) {
             fac.checked = true;
          }
        });

        if (d.rooms && d.rooms.length > 0) {
          this.roomTypes = d.rooms.map((r: any) => ({
            id: r.ROOM_TYPE_ID,
            roomType: r.ROOM_TYPE_NAME,
            bedType: r.bedType === 'Double Bed' ? '2' : '1',
            perMonth: r.PRICE || null,
            perTerm: r.perTerm || null,
            perDay: r.perDay || null
          }));
        } else {
          this.addRoomType();
        }

        this.previews.FRONT_DORM_IMG = d.image;
        this.existingGallery = d.gallery || [];
      }
    } catch (error) {
      this.showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  segmentChanged(ev: any) {
    this.activeSegment = ev.detail.value;
  }

  addRoomType() {
    this.roomTypes.push({
      id: null,
      roomType: '',
      bedType: '1',
      perMonth: null,
      perTerm: null,
      perDay: null
    });
  }

  removeRoomType(index: number) {
    if (this.roomTypes.length > 1) {
      this.roomTypes.splice(index, 1);
    } else {
      this.showToast('ต้องมีห้องพักอย่างน้อย 1 ประเภท', 'warning');
    }
  }

  onFileSelect(event: any, field: string) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFiles[field] = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previews[field] = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onGallerySelect(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.selectedFiles.OTHER_IMG.push(files[i]);
        const reader = new FileReader();
        reader.onload = () => {
          this.previews.OTHER_IMG.push(reader.result);
        };
        reader.readAsDataURL(files[i]);
      }
    }
  }

  removeGalleryImage(index: number, isExisting: boolean) {
    if (isExisting) {
      this.existingGallery.splice(index, 1);
    } else {
      this.previews.OTHER_IMG.splice(index, 1);
      this.selectedFiles.OTHER_IMG.splice(index, 1);
    }
  }

  async onSubmit() {
    if (!this.formData.name || !this.formData.zone_id) {
      this.showToast('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'กำลังอัปเดตข้อมูล...' });
    await loading.present();

    try {
      const form = new FormData();
      
      // 🌟 ใช้ระบบดักค่าว่าง (|| '') ป้องกัน undefined/null ทำให้ .toString() ทำแอปพัง
      form.append('name', this.formData.name || '');
      form.append('address', this.formData.address || '');
      form.append('lat', (this.formData.lat || 0).toString());
      form.append('lng', (this.formData.lng || 0).toString());
      form.append('zone_id', (this.formData.zone_id || '').toString());
      form.append('type_id', (this.formData.type_id || 1).toString());
      form.append('detail', this.formData.detail || '');

      // 🌟 ส่งค่าน้ำและค่าไฟไปตรงๆ เลยตามช่องที่กรอก (ไม่มี Dropdown waterType มากวนใจแล้ว)
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

      await this.dormService.updateDorm(this.dormId, form);
      
      this.showToast('บันทึกข้อมูลสำเร็จ!', 'success');
      
      // ดันกลับไปที่หน้าจัดการหอพัก
      setTimeout(() => {
        this.router.navigate(['/my-dorms']);
      }, 800);

    } catch (error: any) {
      console.error(error);
      this.showToast('เกิดข้อผิดพลาดในการบันทึก', 'danger');
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