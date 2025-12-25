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
  bedOutline, trashOutline, addCircleOutline, locationOutline, cloudUploadOutline 
} from 'ionicons/icons';
import { ActivatedRoute, Router } from '@angular/router';
import { DormitoryService } from '../../services/dormitory';

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
  activeSegment: string = 'general'; // 'general' | 'facilities' | 'rooms' | 'images'
  isLoading = false;

  // Form Data
  formData: any = {
    name: '',
    address: '',
    phone: '',
    line: '',
    facebook: '',
    water_unit: 0,
    elect_unit: 0,
    description: '',
    lat: 0,
    lng: 0,
    zone_id: 1,
    type_id: 1 // 1=ชาย, 2=หญิง, 3=รวม
  };

  // Lists
  zones: any[] = [];
  facilities: any[] = [
    { id: 1, name: 'เครื่องปรับอากาศ', checked: false },
    { id: 2, name: 'พัดลม', checked: false },
    { id: 3, name: 'เครื่องทำน้ำอุ่น', checked: false },
    { id: 4, name: 'เฟอร์นิเจอร์-ตู้-เตียง', checked: false },
    { id: 5, name: 'อินเทอร์เน็ตไร้สาย (Wifi)', checked: false },
    { id: 6, name: 'ที่จอดรถมอเตอร์ไซค์/รถยนต์', checked: false },
    { id: 7, name: 'เครื่องซักผ้าหยอดเหรียญ', checked: false },
    { id: 8, name: 'ตู้น้ำหยอดเหรียญ', checked: false },
    { id: 9, name: 'ระบบรักษาความปลอดภัย (Keycard/CCTV)', checked: false },
    { id: 10, name: 'ลิฟต์', checked: false },
    { id: 11, name: 'อนุญาตให้เลี้ยงสัตว์', checked: false }
  ];

  // Room Types (Dynamic Array)
  roomTypes: any[] = [];

  // Image Files
  selectedFiles: any = {
    FRONT_DORM_IMG: null,
    LICENSE_IMG: null,
    BED_IMG: null,
    BATHROOM_IMG: null,
    BALCONY_IMG: null,
    OTHER_IMG: [] // Array for gallery
  };

  // Image Previews (for UI)
  previews: any = {
    FRONT_DORM_IMG: null,
    LICENSE_IMG: null,
    BED_IMG: null,
    BATHROOM_IMG: null,
    BALCONY_IMG: null,
    OTHER_IMG: []
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dormService: DormitoryService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) { 
    addIcons({ saveOutline, imageOutline, homeOutline, wifi, bedOutline, trashOutline, addCircleOutline, locationOutline, cloudUploadOutline });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.dormId = Number(id);
      this.loadInitialData();
    } else {
      this.showToast('ไม่พบรหัสหอพัก', 'danger');
      this.router.navigate(['/my-dorms']);
    }
  }

  async loadInitialData() {
    this.isLoading = true;
    try {
      // 1. Get Zones
      const zonesRes = await this.dormService.getZones();
      this.zones = zonesRes.data || [];

      // 2. Get Dorm Data
      const res = await this.dormService.getDormById(this.dormId);
      if (res && res.success) {
        const d = res.data;
        
        // Map General Data
        this.formData = {
          name: d.DORM_NAME,
          address: d.ADDRESS,
          phone: d.phone || '',
          line: d.line || '',
          facebook: d.facebook || '',
          water_unit: d.WATER_UNIT,
          elect_unit: d.ELECT_UNIT,
          description: d.ADD_DORM_DATA || d.description,
          lat: d.lat,
          lng: d.lng,
          zone_id: d.ZONE_ID,
          type_id: d.DORM_TYPE_ID
        };

        // Map Facilities (Backend sends array of names string or IDs, need to match logic)
        // Assuming backend sends names in `d.facilities` array of strings
        if (d.facilities && Array.isArray(d.facilities)) {
           this.facilities.forEach(f => {
             f.checked = d.facilities.includes(f.name); // Simple text match
           });
        }

        // Map Room Types
        if (d.rooms && Array.isArray(d.rooms)) {
          this.roomTypes = d.rooms.map((r: any) => ({
            roomTypeId: r.ROOM_TYPE_ID, // Important for update logic
            roomType: r.ROOM_TYPE_NAME,
            bedType: 'Single Bed', // Default or fetch if available
            perMonth: r.PRICE, // Assuming monthly price
            perTerm: 0 // Fetch if available
          }));
        } else {
          this.addRoomType(); // Add at least one empty
        }

        // Set Existing Images as Previews
        if(d.image) this.previews.FRONT_DORM_IMG = d.image;
        if(d.gallery) this.previews.OTHER_IMG = d.gallery; 
        // Note: Specific room images (bed, bath) might need separate logic to fetch if not in main gallery list
      }

    } catch (error) {
      console.error('Load Error:', error);
      this.showToast('โหลดข้อมูลล้มเหลว', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // --- Segment Control ---
  segmentChanged(ev: any) {
    this.activeSegment = ev.detail.value;
  }

  // --- Room Type Logic ---
  addRoomType() {
    this.roomTypes.push({
      roomTypeId: null, // New room
      roomType: '',
      bedType: 'Single Bed',
      perMonth: null,
      perTerm: null
    });
  }

  removeRoomType(index: number) {
    this.roomTypes.splice(index, 1);
  }

  // --- Image Handling ---
  onFileSelect(event: any, key: string) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFiles[key] = file;
      
      // Preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previews[key] = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onGallerySelect(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles.OTHER_IMG = Array.from(files); // Convert FileList to Array
      
      this.previews.OTHER_IMG = []; // Reset preview or append
      Array.from(files).forEach((file: any) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.previews.OTHER_IMG.push(reader.result);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  // --- Submit ---
  async onSubmit() {
    const loading = await this.loadingCtrl.create({ message: 'กำลังบันทึกข้อมูล...' });
    await loading.present();

    try {
      const form = new FormData();

      // 1. General Data
      form.append('name', this.formData.name);
      form.append('address', this.formData.address);
      form.append('detail', this.formData.description);
      form.append('lat', this.formData.lat.toString());
      form.append('lng', this.formData.lng.toString());
      form.append('zone_id', this.formData.zone_id);
      form.append('type_id', this.formData.type_id);
      form.append('water_unit', this.formData.water_unit);
      form.append('elect_unit', this.formData.elect_unit);
      
      // 2. Facilities (Send IDs Array)
      const selectedFacIds = this.facilities.filter(f => f.checked).map(f => f.id);
      form.append('facilities', JSON.stringify(selectedFacIds));

      // 3. Room Types (JSON String)
      form.append('roomTypes', JSON.stringify(this.roomTypes));

      // 4. Images
      if (this.selectedFiles.FRONT_DORM_IMG) form.append('FRONT_DORM_IMG', this.selectedFiles.FRONT_DORM_IMG);
      if (this.selectedFiles.LICENSE_IMG) form.append('LICENSE_IMG', this.selectedFiles.LICENSE_IMG);
      if (this.selectedFiles.BED_IMG) form.append('BED_IMG', this.selectedFiles.BED_IMG);
      if (this.selectedFiles.BATHROOM_IMG) form.append('BATHROOM_IMG', this.selectedFiles.BATHROOM_IMG);
      
      // Gallery (Multiple)
      if (this.selectedFiles.OTHER_IMG && this.selectedFiles.OTHER_IMG.length > 0) {
        this.selectedFiles.OTHER_IMG.forEach((file: any) => {
          form.append('OTHER_IMG', file);
        });
      }

      // Call Service
      await this.dormService.updateDorm(this.dormId, form);
      
      this.showToast('บันทึกข้อมูลสำเร็จ!', 'success');
      // this.router.navigate(['/my-dorms']); // Optional: Go back

    } catch (error: any) {
      console.error(error);
      this.showToast('เกิดข้อผิดพลาดในการบันทึก', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg, duration: 2000, color: color, position: 'bottom'
    });
    toast.present();
  }
}