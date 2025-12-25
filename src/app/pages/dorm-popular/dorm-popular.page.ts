import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonButtons, IonButton, IonIcon, IonSpinner, 
  ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, heart } from 'ionicons/icons';
import { Router } from '@angular/router';
import { DormitoryService } from '../../services/dormitory'; 
import { UserService } from '../../services/user'; // ✅ Import UserService

@Component({
  selector: 'app-dorm-popular',
  templateUrl: './dorm-popular.page.html',
  styleUrls: ['./dorm-popular.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonButtons, IonButton, IonIcon, IonSpinner, 
    CommonModule, FormsModule
  ]
})
export class DormPopularPage implements OnInit {

  topDorm: any = null;       // อันดับ 1
  otherDorms: any[] = [];    // อันดับ 2-6
  isLoading = false;
  currentUserId: number = 0;

  constructor(
    private dormService: DormitoryService,
    private userService: UserService, // ✅ Inject Service
    private router: Router,
    private toastCtrl: ToastController
  ) { 
    addIcons({ arrowBack, heart });
  }

  ngOnInit() {
    // 1. ดึง User ID จาก Service
    this.currentUserId = this.userService.getMyUserId();
    console.log('Current User ID:', this.currentUserId);
    
    // 2. โหลดข้อมูลหอพัก
    this.loadPopularDorms();
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  async loadPopularDorms() {
    this.isLoading = true;
    try {
      // ดึงมา 6 อันดับ (1 อันดับแรก + 5 อันดับรอง)
      const res = await this.dormService.getPopularDorms(6); 
      if (res && res.data && res.data.length > 0) {
        this.topDorm = res.data[0];
        this.otherDorms = res.data.slice(1);
      }
    } catch (error) {
      console.error('Load Popular Error:', error);
    } finally {
      this.isLoading = false;
    }
  }

 goToDetail(dorm: any) {
  this.router.navigate(['/dorm-detail', dorm.DORM_ID]); 
}

  // ✅ ฟังก์ชันกด "สนใจ" (เพิ่มรายการโปรด)
  async addToFavorite(event: Event, dorm: any) {
    event.stopPropagation(); // ⚠️ หยุดไม่ให้คลิกทะลุไปโดนตัวการ์ด

    // เช็คว่าล็อกอินหรือยัง
    if (this.currentUserId === 0) {
      this.showToast('กรุณาเข้าสู่ระบบเพื่อกดถูกใจ', 'warning');
      return;
    }

    try {
      await this.dormService.addFavorite(this.currentUserId, dorm.DORM_ID);
      this.showToast(`เพิ่ม "${dorm.DORM_NAME}" ในรายการโปรดแล้ว`, 'success');
    } catch (error: any) {
      // ✅ เช็ค Error ให้ละเอียดขึ้น (เผื่อกดซ้ำ)
      if (error.status === 409 || (error.error && error.error.message === 'Duplicate')) {
        this.showToast('คุณกดถูกใจหอพักนี้ไปแล้ว', 'medium');
      } else {
        console.error(error);
        this.showToast('เกิดข้อผิดพลาด ไม่สามารถเพิ่มรายการได้', 'danger');
      }
    }
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg, duration: 2000, color: color, position: 'bottom'
    });
    toast.present();
  }

  // Helper: สีป้ายอันดับ
  getRankColor(index: number): string {
    if (index === 0) return '#FFD700'; // ทอง
    if (index === 1) return '#C0C0C0'; // เงิน
    if (index === 2) return '#CD7F32'; // ทองแดง
    return '#8ecae6'; // ฟ้า (อันดับอื่นๆ)
  }
}