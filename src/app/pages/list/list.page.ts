import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { bookmark, bookmarkOutline, locationSharp, home, search } from 'ionicons/icons';

import { DormitoryService, Dormitory } from '../../services/dormitory'; 
import { UserService } from '../../services/user'; 
@Component({
  selector: 'app-list',
  templateUrl: './list.page.html',
  styleUrls: ['./list.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ListPage implements OnInit {

  dorms: Dormitory[] = [];
  keyword: string = '';
  currentUserId: number = 0;

  constructor(
    private router: Router, 
    private navCtrl: NavController,
    private loadingCtrl: LoadingController, 
    private toastCtrl: ToastController,
    private dormService: DormitoryService,
    private userService: UserService // ✅ 2. Inject Service เข้ามา
  ) { 
    addIcons({ bookmark, bookmarkOutline, locationSharp, home, search });
  }

  ngOnInit() {
    // ✅ 3. ใช้ Service ดึง ID (แทนการเขียนฟังก์ชันเอง)
    this.currentUserId = this.userService.getMyUserId();
    console.log('Current User ID:', this.currentUserId);

    this.loadDorms();
  }

  async loadDorms() {
    const loading = await this.loadingCtrl.create({
      message: 'กำลังโหลดข้อมูล...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const res = await this.dormService.getAllDorms();
      
      if (res) { 
         this.dorms = res.data || []; 
         // console.log('API Response:', this.dorms);
      }

    } catch (error) {
      console.error('Error loading dorms:', error);
    } finally {
      loading.dismiss();
    }
  }

  // ฟังก์ชันค้นหา
  async onSearch() {
    if(!this.keyword) {
      this.loadDorms(); // ถ้าว่างให้โหลดทั้งหมด
      return;
    }

    try {
       const res = await this.dormService.searchDorms(this.keyword);
       this.dorms = res.data || [];
    } catch (error) {
       console.error(error);
    }
  }

  // ✅ ฟังก์ชันกดหัวใจ/ริบบิ้น
  async toggleFavorite(event: Event, dorm: any) {
    event.stopPropagation(); // กันไม่ให้เด้งไปหน้า Detail

    // ตรวจสอบว่าล็อกอินหรือยัง (เช็คจากตัวแปรที่ดึงมาจาก Service)
    if (!this.currentUserId || this.currentUserId === 0) {
        this.showToast('กรุณาเข้าสู่ระบบก่อน', 'warning');
        return;
    }

    // ถ้าเป็นรายการโปรดอยู่แล้ว (เช็คจาก Frontend Flag ชั่วคราว)
    if (dorm.isChecked) {
      this.showToast('รายการนี้อยู่ในรายการโปรดแล้ว', 'medium');
      return;
    }

    try {
      // เรียก API Add Favorite โดยใช้ currentUserId
      await this.dormService.addFavorite(this.currentUserId, dorm.DORM_ID);
      
      dorm.isChecked = true; // อัปเดต UI
      this.showToast('เพิ่มลงในรายการโปรดแล้ว', 'success');

    } catch (error: any) {
      // เช็คว่า Error เพราะซ้ำหรือเปล่า
      if (error.status === 409 || (error.error && error.error.message === 'Duplicate')) {
         dorm.isChecked = true;
         this.showToast('หอพักนี้มีอยู่แล้ว', 'warning');
      } else {
         console.error(error);
         this.showToast('ไม่สามารถเพิ่มรายการโปรดได้', 'danger');
      }
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

  // ไปหน้า Detail
 goToDetail(dorm: any) {
  this.router.navigate(['/dorm-detail', dorm.DORM_ID]); 
}

  goBack() {
    this.navCtrl.back();
  }
}