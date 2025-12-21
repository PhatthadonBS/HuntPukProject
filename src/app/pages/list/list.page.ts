import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { bookmark, bookmarkOutline, locationSharp, home, search } from 'ionicons/icons';

import { DormitoryService, Dormitory } from '../../services/dormitory'; 

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
    private dormService: DormitoryService
  ) { 
    addIcons({ bookmark, bookmarkOutline, locationSharp, home, search });
  }

  ngOnInit() {
    this.getUserInfo();

    this.loadDorms();
  }

getUserInfo() {
    // เปลี่ยนจาก sessionStorage.getItem('user') เป็น localStorage.getItem('loggedIn')
    const userStr = localStorage.getItem('loggedIn'); 
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        
        // เช็คชื่อ field ให้ตรงกับที่บันทึกในหน้า Login
        // หน้า Login บันทึก: id, email, username, role_id, accout_status
        this.currentUserId = user.id || 0;
        
        console.log('Current User ID:', this.currentUserId);
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    } else {
      console.warn('User not logged in');
      this.currentUserId = 0; // ตั้งค่าเป็น 0 ถ้าไม่มีข้อมูล
    }
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
         console.log('API Response:', this.dorms);
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

    // ตรวจสอบว่าล็อกอินหรือยัง
    if (!this.currentUserId) {
        this.showToast('กรุณาเข้าสู่ระบบก่อน', 'warning');
        return;
    }

    // ถ้าเป็นรายการโปรดอยู่แล้ว
    if (dorm.isChecked) {
      this.showToast('รายการนี้อยู่ในรายการโปรดแล้ว', 'medium');
      return;
    }

    try {
      // เรียก API Add Favorite โดยใช้ currentUserId
      await this.dormService.addFavorite(this.currentUserId, dorm.DORM_ID);
      
      dorm.isChecked = true;
      this.showToast('เพิ่มลงในรายการโปรดแล้ว', 'success');

    } catch (error: any) {
      // เช็คว่า Error เพราะซ้ำหรือเปล่า
      if (error.status === 409) {
         dorm.isChecked = true;
         this.showToast('หอพักนี้มีอยู่แล้ว', 'warning');
      } else {
         console.error(error);
         this.showToast('ไม่สามารถเพิ่มรายการโปรดได้', 'danger');
      }
    }
  }

  // Helper สำหรับแสดง Toast
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
  goToDetail(dorm: Dormitory) {
    this.router.navigate(['/dorm-detail'], { 
      state: { dormData: dorm } 
    });
  }

  goBack() {
    this.navCtrl.back();
  }
}