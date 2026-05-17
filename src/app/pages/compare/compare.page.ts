import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { DormitoryService } from '../../services/dormitory'; 
import { addIcons } from 'ionicons';
import { 
  checkmarkCircle, arrowBack, locationOutline, wifi, car, snow, 
  cashOutline, layersOutline, callOutline, checkmarkCircleOutline,
  logoFacebook, logoInstagram, logoTwitter, paperPlaneOutline, arrowForwardCircle
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

  maxSelection: number = 3; 
  isLoggedIn: boolean = false;

  constructor(
    private dormService: DormitoryService,
    private router: Router,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController 
  ) { 
    addIcons({ 
      checkmarkCircle, arrowBack, locationOutline, wifi, car, snow, 
      cashOutline, layersOutline, callOutline, checkmarkCircleOutline,
      logoFacebook, logoInstagram, logoTwitter, paperPlaneOutline, arrowForwardCircle
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
    try {
      const res = await this.dormService.getAllDorms();
      if (res.success) {
        this.allDorms = res.data.map((d: any) => ({ ...d, isChecked: false }));
      }
    } catch (err) {
      console.error(err);
    }
  }

  getSelectedCount() {
    return this.allDorms.filter(d => d.isChecked).length;
  }

  async onSelectDorm(dorm: any) {
    const selectedCount = this.getSelectedCount();

    if (dorm.isChecked && selectedCount > this.maxSelection) {
      setTimeout(() => { dorm.isChecked = false; }, 50); 

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

    const loading = await this.loadingCtrl.create({
      message: 'กำลังวิเคราะห์และดึงข้อมูล...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // ✅ เปลี่ยนจาก Promise.all เป็น for loop 
      // เพื่อค่อยๆ ทยอยดึงทีละหอพัก ป้องกันฐานข้อมูลทำงานหนักจนล่ม!
      const results = [];
      for (const d of selectedBasic) {
         const res = await this.dormService.getDormById(d.DORM_ID);
         if (res && res.success) {
            results.push(res.data);
         }
      }

      this.selectedDorms = results;

      if (this.selectedDorms.length > 0) {
        this.isComparing = true;
      }

    } catch (error) {
      console.error('Compare Error:', error);
      this.showAlert('ข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลเปรียบเทียบได้');
    } finally {
      loading.dismiss();
    }
  }
  cancelCompare() {
    this.isComparing = false;
    this.selectedDorms = [];
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
      buttons: ['ตกลง']
    });
    await alert.present();
  }
}