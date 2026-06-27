import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular'; // ❌ เอา LoadingController ออก
import { Router, RouterModule } from '@angular/router';
import { DormitoryService } from '../../services/dormitory'; 
import { addIcons } from 'ionicons';
import { 
  checkmarkCircle, arrowBack, locationOutline, wifi, car, snow, 
  cashOutline, layersOutline, callOutline, checkmarkCircleOutline,
  logoFacebook, logoInstagram, logoTwitter, paperPlaneOutline, arrowForwardCircle, 
  location, closeCircle, call, chatbubbleEllipsesOutline, trashOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-compare',
  templateUrl: './compare.page.html',
  styleUrls: ['./compare.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule] 
})
export class ComparePage implements OnInit {

  allDorms: any[] = []; 
  selectedDorms: any[] = []; 
  isComparing: boolean = false;
  compareError: string = '';
  
  // ✅ 1. เพิ่ม State ควบคุม Loading แบบ Native ไม่มีทางค้าง!
  isLoading: boolean = false; 

  maxSelection: number = 3; 
  isLoggedIn: boolean = false;

  // จุดอ้างอิงระยะทาง (ม.มหาสารคาม มอใหม่ เป็น default)
  referencePoint = { lat: 16.246, lng: 103.252 };

  constructor(
    private dormService: DormitoryService,
    private router: Router,
    private alertCtrl: AlertController,
    private cdr: ChangeDetectorRef
  ) { 
    addIcons({ 
      checkmarkCircle, arrowBack, locationOutline, wifi, car, snow, 
      cashOutline, layersOutline, callOutline, checkmarkCircleOutline,
      logoFacebook, logoInstagram, logoTwitter, paperPlaneOutline, arrowForwardCircle, 
      location, closeCircle, call, chatbubbleEllipsesOutline, trashOutline
    });
    // โหลด referencePoint จาก localStorage ถ้ามี
    try {
      const stored = localStorage.getItem('userLocation');
      if (stored) {
        const loc = JSON.parse(stored);
        if (loc.lat && loc.lng) this.referencePoint = { lat: loc.lat, lng: loc.lng };
      }
    } catch(e) {}
  }

  // คำนวณระยะทาง Haversine (กม.)
  calcDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  ngOnInit() {
    this.checkUserQuota();
    this.fetchDorms();
  }

  checkUserQuota() {
    const stored = localStorage.getItem('loggedIn');
    if (stored) {
      this.isLoggedIn = true;
      this.maxSelection = 5; 
    } else {
      this.isLoggedIn = false;
      this.maxSelection = 3; 
    }
  }

  async fetchDorms() {
    this.compareError = '';
    try {
      const res = await this.dormService.getAllDorms();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        this.allDorms = res.data.map((d: any) => ({ ...d, isChecked: false }));
      } else {
        this.allDorms = [];
        this.compareError = 'ไม่สามารถโหลดข้อมูลหอพักได้ กรุณาลองใหม่อีกครั้ง';
      }
    } catch (err) {
      console.error(err);
      this.allDorms = [];
      this.compareError = 'เกิดข้อผิดพลาดขณะดึงข้อมูลหอพัก กรุณาลองใหม่อีกครั้ง';
    } finally {
      this.cdr.detectChanges();
    }
  }

  getSelectedCount() {
    return this.allDorms.filter(d => d.isChecked).length;
  }

  clearSelection() {
    this.allDorms.forEach(d => d.isChecked = false);
    this.cdr.detectChanges();
  }

  async onSelectDorm(dorm: any) {
    const selectedCount = this.getSelectedCount();

    if (dorm.isChecked && selectedCount > this.maxSelection) {
      setTimeout(() => { 
        dorm.isChecked = false;
        this.cdr.detectChanges();
      }, 50); 

      let header = 'เกินจำนวนที่กำหนด';
      let msg = this.isLoggedIn 
        ? 'สมาชิกเปรียบเทียบได้สูงสุด 5 หอพักครับ' 
        : 'บุคคลทั่วไปเปรียบเทียบได้สูงสุด 3 หอพัก\n(เข้าสู่ระบบเพื่อเปรียบเทียบได้มากขึ้น)';

      const alert = await this.alertCtrl.create({
        header: header,
        message: msg,
        buttons: ['ตกลง']
      });
      await alert.present();
    }
  }

  async startCompare() {
    const selectedBasic = this.allDorms.filter((d: any) => d.isChecked);

    if (selectedBasic.length < 2) {
      this.showAlert('แจ้งเตือน', 'กรุณาเลือกหอพักอย่างน้อย 2 แห่งเพื่อเปรียบเทียบ');
      return;
    }

    // ✅ 2. เปิดหน้ากาก Loading แท้
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const results: any[] = [];
      for (const d of selectedBasic) {
         try {
           const res = await this.dormService.getDormById(d.DORM_ID || d.id);
           if (res && res.success && res.data) {
              results.push({ ...d, ...res.data });
           } else {
              results.push(d); 
           }
         } catch (apiErr) {
           results.push(d); 
         }
      }

      // ✅ 3. คำนวณ distance + สลับหน้าเป็นตาราง
      this.selectedDorms = results.map((d: any) => ({
        ...d,
        calcDistance: (d.lat && d.lng)
          ? this.calcDistanceKm(this.referencePoint.lat, this.referencePoint.lng, Number(d.lat), Number(d.lng)).toFixed(1)
          : null
      }));
      this.isComparing = true;

    } catch (error) {
      console.error('Compare Error:', error);
      this.showAlert('ข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลเปรียบเทียบได้');
    } finally {
      // ✅ 4. พอดึงข้อมูลเสร็จค่อยดึงหน้ากาก Loading ออก
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  cancelCompare() {
    this.isComparing = false;
    this.selectedDorms = [];
    this.cdr.detectChanges();
  }

  goBack() {
    if (this.isComparing) {
      this.cancelCompare();
    } else {
      this.router.navigate(['/home']);
    }
  }

  async showAlert(header: string, msg: string) {
    const alert = await this.alertCtrl.create({
      header: header,
      message: msg,
      buttons: ['ตกลง'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  getWaterLump(item: any): string {
    const v = item.WATER_LUMP ?? item.water_lump;
    if (v === null || v === undefined) return '-';
    if (Number(v) === 0) return 'ไม่ระบุ';
    return v + ' บ./ด.';
  }

  // ✅ ฟังก์ชันรวม: ดึงค่าช่องทางติดต่อแบบ normalize ทุกกรณี
  // กัน null, undefined, '', '-', 'null' (string) ที่หลุดมาจาก backend/DB
  // และรองรับทั้งชื่อ field ตัวเล็ก (phone) และ OWNER_* (ตัวใหญ่)
  private normalizeContact(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value).trim();
    if (str === '' || str === '-' || str.toLowerCase() === 'null') return '';
    return str;
  }

  getContact(item: any, lowerKey: string, ownerKey: string): string {
    return (
      this.normalizeContact(item?.[lowerKey]) ||
      this.normalizeContact(item?.[ownerKey])
    );
  }

  hasContact(item: any, lowerKey: string, ownerKey: string): boolean {
    return this.getContact(item, lowerKey, ownerKey) !== '';
  }

  // ✅ ใส่ tel: ให้เบอร์โทรอัตโนมัติ ส่วนลิงก์อื่นใช้ตรงๆ
  getContactHref(item: any, lowerKey: string, ownerKey: string, isPhone: boolean = false): string {
    const value = this.getContact(item, lowerKey, ownerKey);
    return isPhone ? `tel:${value}` : value;
  }
}