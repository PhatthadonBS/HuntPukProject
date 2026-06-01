import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButtons, IonBackButton, IonButton, IonIcon,
  IonLabel, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonCheckbox, IonList, LoadingController, ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline, imageOutline, homeOutline, wifi,
  bedOutline, trashOutline, addCircleOutline, locationOutline, cloudUploadOutline, closeCircle,
  locateOutline, documentTextOutline, arrowBackOutline, arrowForwardOutline, imagesOutline,
  personOutline
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { DormitoryService } from '../../../services/dormitory';
import { lastValueFrom } from 'rxjs';
import { GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-dorm-form',
  templateUrl: './dorm-form.page.html',
  styleUrls: ['./dorm-form.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButtons, IonBackButton, IonButton, IonIcon,
    IonLabel, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonCheckbox, IonList, CommonModule, FormsModule, GoogleMapsModule
  ]
})
export class DormFormPage implements OnInit {
  currentStep: number = 1;

  // ✅ เก็บข้อมูล user เต็มๆ ไว้ใช้ตลอด
  currentUser: any = null;
  ownerId: number = 0;       // USER_ID จาก USERS table
  isAdmin: boolean = false;  // true ถ้า ROLE_TYPE_ID === 3

  formData: any = {
    name: '', address: '',
    lat: 16.245279, lng: 103.250106,
    zone_id: 1,
    type_id: 1,
    water_unit: null, water_lump: null, elect_unit: null, detail: ''
  };

  zones: any[] = [];
  facilities: any[] = [];
  roomTypes: any[] = [];

  selectedFiles: any = {
    FRONT_DORM_IMG: null, LICENSE_IMG: null,
    BED_IMG: null, WALL_IMG: null, CEILING_IMG: null,
    FLOOR_IMG: null, BATHROOM_IMG: null, BALCONY_IMG: null,
    OTHER_IMG: []
  };
  previews: any = {
    FRONT_DORM_IMG: null, LICENSE_IMG: null,
    BED_IMG: null, WALL_IMG: null, CEILING_IMG: null,
    FLOOR_IMG: null, BATHROOM_IMG: null, BALCONY_IMG: null,
    OTHER_IMG: []
  };

  center: google.maps.LatLngLiteral = { lat: 16.245279, lng: 103.250106 };
  zoom = 15;
  markerPosition: google.maps.LatLngLiteral = { lat: 16.245279, lng: 103.250106 };
  mapOptions: google.maps.MapOptions = { streetViewControl: false, mapTypeControl: false };
  markerOptions: google.maps.MarkerOptions = { draggable: true };

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
      cloudUploadOutline, closeCircle, locateOutline, documentTextOutline,
      arrowBackOutline, arrowForwardOutline, imagesOutline, personOutline
    });
  }

  async ngOnInit() {
    // ✅ FIX: รองรับทุก key ที่ backend อาจส่งกลับมาใน localStorage
    const stored = localStorage.getItem('loggedIn');
    if (!stored) {
      this.showToast('กรุณาเข้าสู่ระบบก่อน', 'danger');
      this.router.navigate(['/login']);
      return;
    }

    try {
      this.currentUser = JSON.parse(stored);
      // รองรับทุกรูปแบบ key ที่ backend อาจส่งมา
      this.ownerId =
        this.currentUser?.USER_ID ??
        this.currentUser?.user_id ??
        this.currentUser?.userId ??
        this.currentUser?.id ??
        0;

      // ✅ ตรวจสอบ role: 3 = Admin, 2 = Dorm Owner
      const roleId =
        this.currentUser?.ROLE_TYPE_ID ??
        this.currentUser?.role_id ??
        this.currentUser?.roleId ??
        1;
      this.isAdmin = (roleId === 3);

      console.log('👤 currentUser:', this.currentUser);
      console.log('🔑 ownerId:', this.ownerId, '| isAdmin:', this.isAdmin, '| roleId:', roleId);

      if (!this.ownerId) {
        this.showToast('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่', 'danger');
        this.router.navigate(['/login']);
        return;
      }

      // ✅ ถ้าไม่ใช่ Admin และไม่ใช่ Dorm Owner → ไม่มีสิทธิ์
      if (roleId !== 2 && roleId !== 3) {
        this.showToast('คุณไม่มีสิทธิ์ลงทะเบียนหอพัก', 'danger');
        this.router.navigate(['/home']);
        return;
      }
    } catch (e) {
      console.error('❌ Parse localStorage error:', e);
      this.showToast('ข้อมูล Session ผิดพลาด กรุณา Login ใหม่', 'danger');
      this.router.navigate(['/login']);
      return;
    }

    await this.loadInitialData();
    this.resetForm();
  }

  async loadInitialData() {
    try {
      const zoneRes = await this.dormService.getZones();
      if (zoneRes.success) this.zones = zoneRes.data;

      // ✅ FIX: รองรับทั้ง array ตรงๆ และแบบห่อ {data: [...]}
      const facRes: any = await lastValueFrom(this.dormService.getFacilities());
      const facArray = Array.isArray(facRes) ? facRes : (facRes?.data || []);

      if (facArray.length > 0) {
        this.facilities = facArray.map((f: any) => ({
          id: f.FAC_TYPE_ID,
          name: f.FAC_TYPE_NAME,
          icon: f.FAC_TYPE_ICON || '',
          // ✅ FIX: ตรวจสอบว่า icon เป็น Font Awesome class หรือ URL
          isFontAwesome: f.FAC_TYPE_ICON &&
            !f.FAC_TYPE_ICON.startsWith('http') &&
            !f.FAC_TYPE_ICON.startsWith('/') &&
            !f.FAC_TYPE_ICON.startsWith('assets'),
          checked: false
        }));
        console.log('✅ Facilities loaded:', this.facilities.length, 'items');
        console.log('🔍 Sample:', this.facilities[0]?.name, '→', this.facilities[0]?.icon, '(FA:', this.facilities[0]?.isFontAwesome, ')');
      }
    } catch (error) {
      console.error('❌ loadInitialData error:', error);
    }
  }

  resetForm() {
    this.currentStep = 1;
    this.formData = {
      name: '', address: '',
      lat: 16.245279, lng: 103.250106,
      zone_id: 1, type_id: 1,
      water_unit: null, water_lump: null, elect_unit: null, detail: ''
    };
    this.facilities.forEach(f => f.checked = false);

    // ✅ ห้องเริ่มต้น 1 ห้อง
    this.roomTypes = [{
      id: null,
      selectedType: 'ห้องพัดลม',
      roomType: 'ห้องพัดลม',
      bedType: '1',
      perMonth: null, perTerm: null, perDay: null
    }];

    this.selectedFiles = {
      FRONT_DORM_IMG: null, LICENSE_IMG: null,
      BED_IMG: null, WALL_IMG: null, CEILING_IMG: null,
      FLOOR_IMG: null, BATHROOM_IMG: null, BALCONY_IMG: null,
      OTHER_IMG: []
    };
    this.previews = {
      FRONT_DORM_IMG: null, LICENSE_IMG: null,
      BED_IMG: null, WALL_IMG: null, CEILING_IMG: null,
      FLOOR_IMG: null, BATHROOM_IMG: null, BALCONY_IMG: null,
      OTHER_IMG: []
    };

    this.center = { lat: 16.245279, lng: 103.250106 };
    this.markerPosition = { lat: 16.245279, lng: 103.250106 };
  }

  // ==========================
  // Step Navigation
  // ==========================
  nextStep() {
    if (this.currentStep === 1) {
      if (!this.formData.name?.trim()) {
        this.showToast('กรุณากรอกชื่อหอพัก', 'warning');
        return;
      }
      if (!this.formData.water_unit && this.formData.water_unit !== 0) {
        this.showToast('กรุณากรอกค่าน้ำ (บาท/หน่วย)', 'warning');
        return;
      }
      if (!this.formData.elect_unit && this.formData.elect_unit !== 0) {
        this.showToast('กรุณากรอกค่าไฟ (บาท/หน่วย)', 'warning');
        return;
      }
    }
    if (this.currentStep === 3) {
      // ตรวจสอบว่าแต่ละห้องมีราคาอย่างน้อย 1 ช่อง
      for (const room of this.roomTypes) {
        if (!room.perMonth && !room.perTerm && !room.perDay) {
          this.showToast('กรุณากรอกราคาอย่างน้อย 1 ช่อง (เดือน/เทอม/วัน) ในทุกประเภทห้อง', 'warning');
          return;
        }
      }
    }
    if (this.currentStep < 4) this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  // ==========================
  // แผนที่
  // ==========================
  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.formData.lat = position.coords.latitude;
          this.formData.lng = position.coords.longitude;
          this.center = { lat: this.formData.lat, lng: this.formData.lng };
          this.markerPosition = { ...this.center };
          this.showToast('ดึงตำแหน่งปัจจุบันสำเร็จ ✓', 'success');
        },
        () => { this.showToast('ไม่สามารถดึงตำแหน่งได้ กรุณาเปิด GPS', 'danger'); }
      );
    }
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.formData.lat = event.latLng.lat();
      this.formData.lng = event.latLng.lng();
      this.markerPosition = { lat: this.formData.lat, lng: this.formData.lng };
    }
  }

  onInputCoordChange() {
    if (this.formData.lat && this.formData.lng) {
      this.markerPosition = { lat: Number(this.formData.lat), lng: Number(this.formData.lng) };
      this.center = { ...this.markerPosition };
    }
  }

  // ==========================
  // ห้องพัก
  // ==========================
  addRoomType() {
    this.roomTypes.push({
      id: null, selectedType: 'ห้องแอร์', roomType: 'ห้องแอร์',
      bedType: '1', perMonth: null, perTerm: null, perDay: null
    });
  }

  removeRoomType(index: number) {
    if (this.roomTypes.length > 1) this.roomTypes.splice(index, 1);
  }

  onRoomTypeChange(room: any) {
    if (room.selectedType !== 'custom') {
      room.roomType = room.selectedType;
    } else {
      room.roomType = '';
    }
  }

  // ==========================
  // รูปภาพ
  // ==========================
  onFileSelect(event: any, field: string) {
    const file = event.target.files?.[0];
    if (!file) return;

    // ✅ เช็คขนาดไฟล์ไม่เกิน 10MB
    if (file.size > 10 * 1024 * 1024) {
      this.showToast('ไฟล์ใหญ่เกินไป (สูงสุด 10MB)', 'warning');
      return;
    }

    this.selectedFiles[field] = file;
    const reader = new FileReader();
    reader.onload = () => { this.previews[field] = reader.result; };
    reader.readAsDataURL(file);
  }

  onGallerySelect(event: any) {
    const files = event.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 10 * 1024 * 1024) continue; // ข้ามไฟล์ใหญ่เกิน
      this.selectedFiles.OTHER_IMG.push(files[i]);
      const reader = new FileReader();
      reader.onload = () => { this.previews.OTHER_IMG.push(reader.result); };
      reader.readAsDataURL(files[i]);
    }
  }

  removeGalleryImage(index: number) {
    this.previews.OTHER_IMG.splice(index, 1);
    this.selectedFiles.OTHER_IMG.splice(index, 1);
  }

  // ==========================
  // Submit
  // ==========================
  async onSubmit() {
    if (!this.selectedFiles.FRONT_DORM_IMG || !this.selectedFiles.LICENSE_IMG) {
      this.showToast('กรุณาแนบ รูปหน้าปก และ เอกสารยืนยันตัวตน ให้ครบ', 'warning');
      return;
    }

    const confirmAlert = await this.alertCtrl.create({
      header: 'ยืนยันการบันทึก',
      message: 'ต้องการบันทึกข้อมูลหอพักใหม่ใช่หรือไม่?',
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { text: 'บันทึก', cssClass: 'alert-btn-confirm', handler: () => { this.processSaveData(); } }
      ]
    });
    await confirmAlert.present();
  }

  async processSaveData() {
    const loading = await this.loadingCtrl.create({
      message: 'กำลังส่งข้อมูล...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const form = new FormData();

      // ✅ FIX: ส่ง user_id (USER_ID จาก USERS table)
      // Backend จะไป lookup DORM_OWNER_ID เอง
      // ถ้า Admin ยังไม่มี DORM_OWNERS record → Backend ต้อง auto-create
      form.append('user_id', this.ownerId.toString());
      form.append('name', this.formData.name?.trim() || '');
      form.append('address', this.formData.address?.trim() || '');
      form.append('lat', (this.formData.lat || 16.245279).toString());
      form.append('lng', (this.formData.lng || 103.250106).toString());
      form.append('zone_id', (this.formData.zone_id || 1).toString());
      form.append('type_id', (this.formData.type_id || 1).toString());
      form.append('detail', this.formData.detail?.trim() || '');
      form.append('water_unit', (this.formData.water_unit || 0).toString());
      form.append('water_lump', (this.formData.water_lump || 0).toString());
      form.append('elect_unit', (this.formData.elect_unit || 0).toString());

      // ✅ FIX: format roomTypes ให้ตรงกับที่ Backend ต้องการ
      const roomTypesFormatted = this.roomTypes.map(r => ({
        roomType: r.selectedType === 'custom' ? (r.roomType || 'อื่นๆ') : r.selectedType,
        bedType: r.bedType || '1',
        perMonth: Number(r.perMonth) || 0,
        perTerm: Number(r.perTerm) || 0,
        perDay: Number(r.perDay) || 0
      }));
      form.append('roomTypes', JSON.stringify(roomTypesFormatted));

      const selectedFacIds = this.facilities
        .filter((f: any) => f.checked)
        .map((f: any) => f.id);
      form.append('facilities', JSON.stringify(selectedFacIds));

      // รูปภาพ
      if (this.selectedFiles.FRONT_DORM_IMG) form.append('FRONT_DORM_IMG', this.selectedFiles.FRONT_DORM_IMG);
      if (this.selectedFiles.LICENSE_IMG) form.append('LICENSE_IMG', this.selectedFiles.LICENSE_IMG);
      if (this.selectedFiles.BED_IMG) form.append('BED_IMG', this.selectedFiles.BED_IMG);
      if (this.selectedFiles.WALL_IMG) form.append('WALL_IMG', this.selectedFiles.WALL_IMG);
      if (this.selectedFiles.CEILING_IMG) form.append('CEILING_IMG', this.selectedFiles.CEILING_IMG);
      if (this.selectedFiles.FLOOR_IMG) form.append('FLOOR_IMG', this.selectedFiles.FLOOR_IMG);
      if (this.selectedFiles.BATHROOM_IMG) form.append('BATHROOM_IMG', this.selectedFiles.BATHROOM_IMG);
      if (this.selectedFiles.BALCONY_IMG) form.append('BALCONY_IMG', this.selectedFiles.BALCONY_IMG);

      if (this.selectedFiles.OTHER_IMG?.length > 0) {
        this.selectedFiles.OTHER_IMG.forEach((file: File) => {
          form.append('OTHER_IMG', file);
        });
      }

      // Debug log ก่อนส่ง
      console.log('📤 Submitting FormData:');
      form.forEach((val, key) => console.log(`  ${key}:`, typeof val === 'string' ? val : '[File]'));

      await lastValueFrom(this.dormService.createDorm(form));

      await loading.dismiss();
      this.showSuccessFlow();

    } catch (error: any) {
      await loading.dismiss();
      const serverMsg =
        error?.error?.message ||
        error?.error?.error ||
        error?.message ||
        'ไม่ทราบสาเหตุ';
      console.error('❌ createDorm error:', error);
      console.error('📩 Server message:', serverMsg);
      this.showToast(`บันทึกไม่สำเร็จ: ${serverMsg}`, 'danger');
    }
  }

  async showSuccessFlow() {
    const alert = await this.alertCtrl.create({
      header: '✅ บันทึกสำเร็จ!',
      message: `ข้อมูลหอพักของคุณถูกส่งแล้ว<br><br>
        <b>กรุณารอผู้ดูแลระบบตรวจสอบภายใน 24 ชั่วโมง</b><br>
        หากผ่านการอนุมัติ หอพักของคุณจะแสดงบนระบบ`,
      buttons: [{ text: 'ตกลง', handler: () => { this.askAddMore(); } }],
      backdropDismiss: false
    });
    await alert.present();
  }

  async askAddMore() {
    const alert = await this.alertCtrl.create({
      header: 'จัดการหอพัก',
      message: 'ต้องการลงทะเบียนหอพักเพิ่มอีกหรือไม่?',
      buttons: [
        { text: 'ไม่, กลับไปหน้ารายการ', role: 'cancel', handler: () => { this.router.navigate(['/my-dorms']); } },
        { text: 'ใช่, เพิ่มหอพักอีก', handler: () => { this.resetForm(); } }
      ]
    });
    await alert.present();
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg, duration: 2800, color, position: 'bottom',
      cssClass: 'custom-toast'
    });
    toast.present();
  }
}