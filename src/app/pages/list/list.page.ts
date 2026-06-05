import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController, AlertController, ViewWillEnter } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { bookmark, bookmarkOutline, locationSharp, home, search, arrowBack, star, locationOutline, menuOutline } from 'ionicons/icons';

import { DormitoryService, Dormitory } from '../../services/dormitory'; 
import { UserService } from '../../services/user'; 
import { HeaderComponent } from '../../components/header/header.component'; 

@Component({
  selector: 'app-list',
  templateUrl: './list.page.html',
  styleUrls: ['./list.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HeaderComponent] 
})
export class ListPage implements OnInit, ViewWillEnter {

  dorms: Dormitory[] = [];
  keyword: string = '';
  currentUserId: number = 0;
  currentUser: any = null; 
  isLoading: boolean = true; 

  constructor(
    private router: Router, 
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController, 
    private dormService: DormitoryService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) { 
    // ✅ เพิ่ม menuOutline เข้าไปในระบบไอคอน
    addIcons({ bookmark, bookmarkOutline, locationSharp, home, search, arrowBack, star, locationOutline, 'menu-outline': menuOutline });
  }

  ngOnInit() {
    this.checkLoginStatus();
    this.loadDorms();
  }

  ionViewWillEnter() {
    this.checkLoginStatus();
    this.syncFavoriteStatus();
  }

  checkLoginStatus() {
    this.currentUser = null;
    this.currentUserId = 0;
    const storedData = localStorage.getItem('loggedIn');
    if (storedData) {
      try {
        const userObj = JSON.parse(storedData);
        const user = userObj.user ? userObj.user : userObj;
        if ((user.id || user.USER_ID) && userObj.accout_status === 0) {
          this.currentUser = user;
          this.currentUserId = Number(user.id || user.USER_ID || 0);
        }
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }

  getDormMinPrice(dorm: any): number {
    if (!dorm) return 0;

    const directPrice = Number(dorm.start_price || dorm.START_PRICE || dorm.min_price || dorm.MIN_PRICE || 0);
    if (directPrice > 0) return directPrice;

    const rooms = dorm.rooms || dorm.ROOMS || [];
    if (Array.isArray(rooms) && rooms.length > 0) {
      const roomPrices = rooms
        .map((room: any) => Number(room.PRICE || room.price || 0))
        .filter((price: number) => price > 0);
      if (roomPrices.length > 0) return Math.min(...roomPrices);
    }

    return 0;
  }

  async syncFavoriteStatus() {
    if (!this.currentUserId || this.dorms.length === 0) return;

    try {
      const favorites = await this.dormService.getMyFavorites(this.currentUserId);
      const favoriteIds = new Set(favorites.map(f => Number(f.DORM_ID)));
      this.dorms.forEach(dorm => {
        dorm.isChecked = favoriteIds.has(Number(dorm.DORM_ID));
      });
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error syncing favorites:', error);
    }
  }

  async loadDorms() {
    this.isLoading = true;
    try {
      const res = await this.dormService.getAllDorms();
      if (res?.success && res.data) {
        this.dorms = res.data.map((dorm: any) => ({ ...dorm, isChecked: false }));
        await this.syncFavoriteStatus();
      } else {
        this.dorms = [];
      }
    } catch (error) {
      console.error('Error loading dorms:', error);
    } finally {
      setTimeout(() => { this.isLoading = false; }, 300);
    }
  }

  async onSearch(event?: any) {
    if (event !== undefined) { this.keyword = (typeof event === 'string' ? event : event?.target?.value || '').trim(); }
    if (!this.keyword) { this.loadDorms(); return; }

    this.isLoading = true;
    try {
      const res = await this.dormService.searchDorms(this.keyword);
      this.dorms = (res.data || []).map((dorm: any) => ({ ...dorm, isChecked: false }));
      await this.syncFavoriteStatus();
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  async toggleFavorite(event: Event, dorm: any) {
    event.stopPropagation();
    event.preventDefault();

    if (!this.currentUserId || this.currentUserId === 0) {
        const alert = await this.alertCtrl.create({
            header: 'แจ้งเตือน',
            message: 'กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อน เพื่อเลือกหอพักที่คุณสนใจครับ',
            buttons: [
                { text: 'ยกเลิก', role: 'cancel' },
                { text: 'เข้าสู่ระบบ', handler: () => this.router.navigate(['/login']) }
            ]
        });
        await alert.present();
        return;
    }

    if (dorm.isChecked) {
        const alert = await this.alertCtrl.create({
            header: 'ยกเลิกการสนใจ',
            message: 'คุณต้องการยกเลิกการสนใจหอพักนี้ใช่หรือไม่?',
            buttons: [
                { text: 'ไม่', role: 'cancel' },
                { 
                  text: 'ใช่, ยกเลิก', 
                  handler: async () => {
                    try {
                        await this.dormService.removeFavorite(this.currentUserId, dorm.DORM_ID || dorm.id);
                        dorm.isChecked = false;
                        this.showToast('ยกเลิกการสนใจเรียบร้อย', 'medium');
                        this.cdr.detectChanges();
                    } catch (error) {
                        this.showToast('เกิดข้อผิดพลาดในการยกเลิก', 'danger');
                    }
                  }
                }
            ]
        });
        await alert.present();
        return;
    }

    const alert = await this.alertCtrl.create({
        header: 'ยืนยัน',
        message: 'คุณสนใจหอพักนี้ใช่หรือไม่?',
        buttons: [
            { text: 'ยกเลิก', role: 'cancel' },
            { 
              text: 'ใช่, สนใจ', 
              handler: async () => {
                try {
                  await this.dormService.addFavorite(this.currentUserId, dorm.DORM_ID || dorm.id);
                  dorm.isChecked = true;
                  this.showToast(`เพิ่ม "${dorm.DORM_NAME}" ลงรายการสนใจเรียบร้อย!`, 'success');
                  this.cdr.detectChanges();
                } catch (error: any) {
                  if (error.status === 409 || (error.error && error.error.message === 'Duplicate')) {
                     dorm.isChecked = true;
                     this.showToast('หอพักนี้มีในรายการสนใจแล้วครับ', 'warning');
                  } else {
                     this.showToast('เกิดข้อผิดพลาดในการบันทึก', 'danger');
                  }
                }
              }
            }
        ]
    });
    await alert.present();
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg, duration: 2500, color: color, position: 'bottom',
      buttons: [{ text: 'ปิด', role: 'cancel' }] 
    });
    await toast.present(); 
  }

  goToDetail(dorm: any) { this.router.navigate(['/dorm-detail', dorm.DORM_ID]); }
  goBack() { this.navCtrl.back(); }

  // 🌟 ฟังก์ชันเปิดเมนูด้านข้าง
  openMenu() { window.dispatchEvent(new CustomEvent('toggle-sidebar')); }

  // 🌟 ฟังก์ชันแปลงสถานะ
  getStatusText(status: any): string {
    const s = Number(status);
    if (s === 3) return 'ห้องเต็ม';
    if (s === 2) return 'ปิดให้บริการ';
    return 'ว่าง';
  }

  getStatusClass(status: any): string {
    const s = Number(status);
    if (s === 3) return 'full';
    if (s === 2) return 'closed';
    return 'available';
  }
}