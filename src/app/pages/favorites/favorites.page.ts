import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack, trashOutline, locationSharp, home, star } from 'ionicons/icons';

// Import Service & Interface
import { DormitoryService, Dormitory } from '../../services/dormitory';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class FavoritesPage implements OnInit {

  favDorms: Dormitory[] = [];
  currentUserId: number = 0;
  isLoading: boolean = false;

  constructor(
    private navCtrl: NavController,
    private dormService: DormitoryService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private router: Router
  ) { 
    addIcons({ arrowBack, trashOutline, locationSharp, home, star });
  }

  ngOnInit() {
    this.getUserInfo();
  }

  ionViewWillEnter() {
    // โหลดข้อมูลใหม่ทุกครั้งที่กลับมาหน้านี้ (เผื่อมีการลบจากหน้าอื่น)
    if (this.currentUserId) {
      this.loadFavorites();
    }
  }

  getUserInfo() {
    // เช็คทั้ง session และ local (เผื่อไว้)
    const userStr = sessionStorage.getItem('user') || localStorage.getItem('loggedIn');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserId = user.id || user.user_id || user.USER_ID || 0;
        
        if (this.currentUserId) {
           this.loadFavorites();
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  // ✅ 1. โหลดรายการโปรด
  async loadFavorites() {
    this.isLoading = true;
    try {
      // เรียก Service ที่เรา Map ข้อมูลไว้แล้ว
      const data = await this.dormService.getMyFavorites(this.currentUserId);
      this.favDorms = data || [];
      console.log('My Favorites:', this.favDorms);
    } catch (error) {
      console.error('Error loading favorites:', error);
      // ถ้า Error 400 จาก Backend (แปลว่าไม่พบข้อมูล) ให้เคลียร์ Array
      this.favDorms = [];
    } finally {
      this.isLoading = false;
    }
  }

  // ✅ 2. ปุ่มลบ (Popup ยืนยัน)
  async removeFavorite(event: Event, dorm: Dormitory) {
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการลบ',
      message: `ต้องการลบ "${dorm.DORM_NAME}" ออกจากรายการโปรดใช่หรือไม่?`,
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        {
          text: 'ลบ',
          role: 'destructive',
          handler: () => {
            this.performRemove(dorm);
          }
        }
      ]
    });
    await alert.present();
  }

  // ✅ 3. ลบข้อมูลจริง
  async performRemove(dorm: Dormitory) {
    const loading = await this.loadingCtrl.create({ message: 'กำลังลบ...', spinner: 'crescent' });
    await loading.present();

    try {
      await this.dormService.removeFavorite(this.currentUserId, dorm.DORM_ID);
      
      // ลบออกจากหน้าจอทันที
      this.favDorms = this.favDorms.filter(d => d.DORM_ID !== dorm.DORM_ID);
      
      this.showToast('ลบรายการสำเร็จ', 'success');
    } catch (error) {
      console.error(error);
      this.showToast('เกิดข้อผิดพลาดในการลบ', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  goToDetail(dorm: Dormitory) {
    this.router.navigate(['/dorm-detail'], { state: { dormData: dorm } });
  }

  goBack() {
    this.navCtrl.back();
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2000, color: color, position: 'bottom' });
    toast.present();
  }
}