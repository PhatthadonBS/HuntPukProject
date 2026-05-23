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

      // ✅ 3. สลับหน้าเป็นตารางตอนที่หน้ากาก Loading ยังปิดจออยู่ (ลดอาการค้าง 100%)
      this.selectedDorms = results;
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
}