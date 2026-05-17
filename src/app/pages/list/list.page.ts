import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { bookmark, bookmarkOutline, locationSharp, home, search, arrowBack } from 'ionicons/icons';

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
  isLoading: boolean = true; // ✅ เพิ่มตัวแปรสำหรับคุม Skeleton Loading

  constructor(
    private router: Router, 
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private dormService: DormitoryService,
    private userService: UserService
  ) { 
    addIcons({ bookmark, bookmarkOutline, locationSharp, home, search, arrowBack });
  }

  ngOnInit() {
    this.currentUserId = this.userService.getMyUserId();
    this.loadDorms();
  }

  // ✅ เปลี่ยนจาก Loading หมุนๆ กลางจอ มาใช้ Skeleton แทน
  async loadDorms() {
    this.isLoading = true; 
    try {
      const res = await this.dormService.getAllDorms();
      if (res) { 
         this.dorms = res.data || []; 
      }
    } catch (error) {
      console.error('Error loading dorms:', error);
    } finally {
      // หน่วงเวลาให้เห็น Skeleton นิดนึง (ลบ setTimeout ออกได้ถ้าอยากให้ไวสุดๆ)
      setTimeout(() => { this.isLoading = false; }, 500);
    }
  }

  async onSearch() {
    if(!this.keyword.trim()) {
      this.loadDorms(); 
      return;
    }

    this.isLoading = true; // เปิด Skeleton ตอนค้นหา
    try {
       const res = await this.dormService.searchDorms(this.keyword);
       this.dorms = res.data || [];
    } catch (error) {
       console.error(error);
    } finally {
       this.isLoading = false;
    }
  }

  async toggleFavorite(event: Event, dorm: any) {
    event.stopPropagation(); 

    if (!this.currentUserId || this.currentUserId === 0) {
        this.showToast('กรุณาเข้าสู่ระบบก่อน', 'warning');
        return;
    }

    if (dorm.isChecked) {
      this.showToast('รายการนี้อยู่ในรายการโปรดแล้ว', 'medium');
      return;
    }

    try {
      await this.dormService.addFavorite(this.currentUserId, dorm.DORM_ID);
      dorm.isChecked = true; 
      this.showToast('เพิ่มลงในรายการโปรดแล้ว', 'success');
    } catch (error: any) {
      if (error.status === 409 || (error.error && error.error.message === 'Duplicate')) {
         dorm.isChecked = true;
         this.showToast('หอพักนี้มีอยู่แล้ว', 'warning');
      } else {
         this.showToast('ไม่สามารถเพิ่มรายการโปรดได้', 'danger');
      }
    }
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: color,
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    toast.present();
  }

  goToDetail(dorm: any) {
    this.router.navigate(['/dorm-detail', dorm.DORM_ID]); 
  }

  goBack() {
    this.navCtrl.back();
  }
}