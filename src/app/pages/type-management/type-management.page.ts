import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonSegment, IonSegmentButton,
  IonLabel, IonList, IonItem, IonButton, IonIcon, IonInput, IonItemDivider,
  IonModal, IonButtons, IonSpinner, AlertController, ToastController
} from '@ionic/angular/standalone';
import { DormitoryService } from '../../services/dormitory';
import { MasterType, DormZone } from '../../model/dorm.model';
import { addIcons } from 'ionicons';
import {
  trashOutline, addCircleOutline, locateOutline, locationOutline,
  closeOutline, chevronForwardOutline, arrowBackOutline,
  businessOutline, bedOutline, pricetagOutline, checkmarkCircleOutline, mapOutline, homeOutline
} from 'ionicons/icons';
import { GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-type-management',
  templateUrl: './type-management.page.html',
  styleUrls: ['./type-management.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonSegment, IonSegmentButton,
    IonLabel, IonList, IonItem, IonButton, IonIcon, IonInput, IonItemDivider,
    IonModal, IonButtons, IonSpinner,
    CommonModule, FormsModule, GoogleMapsModule
  ]
})
export class TypeManagementPage implements OnInit {
  selectedSegment: string = 'dormType';

  // ✅ ควบคุมการเปิด/ปิด popup modal ของแต่ละหมวด
  isModalOpen: boolean = false;
  isLoading: boolean = false;
  isSaving: boolean = false;

  lists: { [key: string]: any[] } = {
    dormType: [],
    roomType: [],
    bedType: [],
    priceType: [],
    dormStatus: [],
    zone: []
  };

  newName: string = '';
  newLat: number | null = null;
  newLng: number | null = null;

  center: google.maps.LatLngLiteral = { lat: 16.245279, lng: 103.250106 };
  zoom = 14;
  markerPosition: google.maps.LatLngLiteral = { lat: 16.245279, lng: 103.250106 };
  mapOptions: google.maps.MapOptions = { streetViewControl: false, mapTypeControl: false };
  markerOptions: google.maps.MarkerOptions = { draggable: true };

  // ✅ เพิ่ม icon ให้แต่ละ card แยกแยะง่ายขึ้นด้วยตา
  segments = [
    { value: 'dormType', label: 'ประเภทหอพัก', icon: 'home-outline' },
    { value: 'roomType', label: 'ประเภทห้องพัก', icon: 'business-outline' },
    { value: 'bedType', label: 'ประเภทเตียง', icon: 'bed-outline' },
    { value: 'priceType', label: 'ประเภทราคา', icon: 'pricetag-outline' },
    { value: 'dormStatus', label: 'สถานะหอพัก', icon: 'checkmark-circle-outline' },
    { value: 'zone', label: 'โซนหอพัก', icon: 'map-outline' }
  ];

  constructor(
    private dormServices: DormitoryService,
    private alertController: AlertController,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    addIcons({
      trashOutline, addCircleOutline, locateOutline, locationOutline,
      closeOutline, chevronForwardOutline, arrowBackOutline,
      businessOutline, bedOutline, pricetagOutline, checkmarkCircleOutline, mapOutline, homeOutline
    });
  }

  // ✅ ปุ่มกลับ — ปรับ path ปลายทางตามที่ต้องการ (เช่น dashboard ของแอดมิน)
  goBack() {
    this.router.navigate(['/dashboard']);
  }

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.isLoading = true;
    const tasks = [
      new Promise(r => this.dormServices.getDormTypes().subscribe({ next: (res: any) => { this.lists['dormType'] = res.data || res; r(null); }, error: () => r(null) })),
      new Promise(r => this.dormServices.getRoomTypes().subscribe({ next: (res: any) => { this.lists['roomType'] = res.data || res; r(null); }, error: () => r(null) })),
      new Promise(r => this.dormServices.getBedTypes().subscribe({ next: (res: any) => { this.lists['bedType'] = res.data || res; r(null); }, error: () => r(null) })),
      new Promise(r => this.dormServices.getPriceTypes().subscribe({ next: (res: any) => { this.lists['priceType'] = res.data || res; r(null); }, error: () => r(null) })),
      new Promise(r => this.dormServices.getDormStatuses().subscribe({ next: (res: any) => { this.lists['dormStatus'] = res.data || res; r(null); }, error: () => r(null) })),
      this.dormServices.getZones().then((res: any) => { this.lists['zone'] = res.data || []; }).catch(() => {})
    ];
    Promise.all(tasks).finally(() => this.isLoading = false);
  }

  // ✅ เปิด popup สำหรับหมวดที่กด พร้อมรีเซ็ตฟอร์ม
  openSegment(value: string) {
    this.selectedSegment = value;
    this.newName = '';
    this.newLat = null;
    this.newLng = null;
    this.isModalOpen = true;
  }

  // ✅ ปิด popup
  closeModal() {
    this.isModalOpen = false;
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.newLat = position.coords.latitude;
          this.newLng = position.coords.longitude;
          this.center = { lat: this.newLat, lng: this.newLng };
          this.markerPosition = { ...this.center };
        },
        () => { console.error('ไม่สามารถดึงตำแหน่งได้'); }
      );
    }
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.newLat = parseFloat(event.latLng.lat().toFixed(6));
      this.newLng = parseFloat(event.latLng.lng().toFixed(6));
      this.markerPosition = { lat: this.newLat, lng: this.newLng };
    }
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.newLat = parseFloat(event.latLng.lat().toFixed(6));
      this.newLng = parseFloat(event.latLng.lng().toFixed(6));
    }
  }

  onInputCoordChange() {
    if (this.newLat && this.newLng) {
      this.markerPosition = { lat: Number(this.newLat), lng: Number(this.newLng) };
      this.center = { ...this.markerPosition };
    }
  }

  get currentList() {
    return this.lists[this.selectedSegment];
  }

  get currentLabel() {
    return this.segments.find(s => s.value === this.selectedSegment)?.label || '';
  }

  async addType() {
    if (!this.newName.trim()) return;

    const alert = await this.alertController.create({
      header: 'ยืนยันการเพิ่ม',
      message: `คุณต้องการเพิ่ม "${this.newName}" ในหมวดหมู่ ${this.currentLabel} ใช่หรือไม่?`,
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { text: 'เพิ่ม', handler: () => this.executeAddType() }
      ]
    });
    await alert.present();
  }

  executeAddType() {
    let obs$;
    switch (this.selectedSegment) {
      case 'dormType': obs$ = this.dormServices.addDormType(this.newName); break;
      case 'roomType': obs$ = this.dormServices.addRoomType(this.newName); break;
      case 'bedType': obs$ = this.dormServices.addBedType(this.newName); break;
      case 'priceType': obs$ = this.dormServices.addPriceType(this.newName); break;
      case 'dormStatus': obs$ = this.dormServices.addDormStatus(this.newName); break;
      case 'zone': obs$ = this.dormServices.addZone(this.newName, this.newLat || 0, this.newLng || 0); break;
    }

    if (obs$) {
      this.isSaving = true;
      obs$.subscribe({
        next: () => {
          this.newName = '';
          this.newLat = null;
          this.newLng = null;
          this.loadAllData();
          this.showToast('เพิ่มข้อมูลสำเร็จ!', 'success');
        },
        error: (err: any) => {
          this.showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'danger');
        },
        complete: () => this.isSaving = false
      });
    }
  }

  async confirmDelete(item: any) {
    const id = item.id || item.ZONE_ID;
    const name = item.name || item.ZONE_NAME;

    const alert = await this.alertController.create({
      header: 'ยืนยันการลบ',
      message: `คุณต้องการลบ "${name}" ใช่หรือไม่?`,
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { text: 'ลบ', role: 'destructive', handler: () => this.deleteType(id) }
      ]
    });
    await alert.present();
  }

  async editType(item: any) {
    const id = item.id || item.ZONE_ID;
    const oldName = item.name || item.ZONE_NAME;

    const alert = await this.alertController.create({
      header: 'แก้ไขข้อมูล',
      inputs: [
        {
          name: 'newName',
          type: 'text',
          value: oldName,
          placeholder: 'ชื่อใหม่'
        }
      ],
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { text: 'บันทึก', handler: (data) => {
            if (data.newName && data.newName.trim() !== oldName) {
              this.executeEditType(id, data.newName.trim());
            }
          } 
        }
      ]
    });
    await alert.present();
  }

  executeEditType(id: number, newName: string) {
    let apiType = '';
    switch (this.selectedSegment) {
      case 'dormType': apiType = 'dorm'; break;
      case 'roomType': apiType = 'room'; break;
      case 'bedType': apiType = 'bed'; break;
      case 'priceType': apiType = 'price'; break;
      case 'dormStatus': apiType = 'status'; break;
      case 'zone': apiType = 'zone'; break;
    }
    
    if (!apiType) return;

    this.isSaving = true;
    this.dormServices.updateMasterType(apiType, id, newName).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadAllData();
          this.newName = '';
        } else {
          this.alertController.create({
            header: 'ข้อผิดพลาด',
            message: res.message || 'ไม่สามารถแก้ไขข้อมูลได้',
            buttons: ['ตกลง']
          }).then(a => a.present());
        }
      },
      error: (err) => {
        console.error(err);
        this.alertController.create({
          header: 'เกิดข้อผิดพลาด',
          message: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้',
          buttons: ['ตกลง']
        }).then(a => a.present());
      },
      complete: () => this.isSaving = false
    });
  }

  deleteType(id: number) {
    let obs$;
    switch (this.selectedSegment) {
      case 'dormType': obs$ = this.dormServices.deleteDormType(id); break;
      case 'roomType': obs$ = this.dormServices.deleteRoomType(id); break;
      case 'bedType': obs$ = this.dormServices.deleteBedType(id); break;
      case 'priceType': obs$ = this.dormServices.deletePriceType(id); break;
      case 'dormStatus': obs$ = this.dormServices.deleteDormStatus(id); break;
      case 'zone': obs$ = this.dormServices.deleteZone(id); break;
    }

    if (obs$) {
      obs$.subscribe({
        next: () => {
          this.loadAllData();
          this.showToast('ลบเรียบร้อย!', 'success');
        },
        error: (err: any) => this.showToast('ไม่สามารถลบได้ อาจเป็นเพราะข้อมูลถูกใช้งานอยู่', 'warning')
      });
    }
  }

  async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastCtrl.create({ message, duration: 2200, color, position: 'bottom' });
    toast.present();
  }
}