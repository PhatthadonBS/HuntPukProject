import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack, trashOutline, locationSharp, home, star, heartDislikeOutline } from 'ionicons/icons';
import { DormitoryService, Dormitory } from '../../services/dormitory';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class FavoritesPage implements OnInit {

  favDorms: any[] = [];
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
    // ✅ FIX: เพิ่ม heartDislikeOutline ที่ขาดหายไป
    addIcons({
      'arrow-back': arrowBack,
      'trash-outline': trashOutline,
      'location-sharp': locationSharp,
      'home': home,
      'star': star,
      'heart-dislike-outline': heartDislikeOutline
    });
  }

  ngOnInit() { this.getUserInfo(); }

  ionViewWillEnter() {
    if (this.currentUserId) this.loadFavorites();
  }

  // ✅ FIX: อ่านจาก localStorage เหมือน page อื่น
  getUserInfo() {
    const userStr = localStorage.getItem('loggedIn');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserId = Number(user.id || user.user_id || user.USER_ID || 0);
        console.log('✅ Favorites userId:', this.currentUserId);
        if (this.currentUserId) this.loadFavorites();
      } catch (e) { console.error('Parse user error:', e); }
    }
  }

  // ✅ FIX: รองรับ response ทุก format
async loadFavorites() {
  this.isLoading = true;
  try {
    const data = await this.dormService.getMyFavorites(this.currentUserId);
    // ✅ data ตอนนี้เป็น array เสมอ (service จัดการให้แล้ว)
    this.favDorms = data || [];
    console.log('✅ Favorites loaded:', this.favDorms.length, 'items');
  } catch (error) {
    console.error('Error loading favorites:', error);
    this.favDorms = [];
  } finally {
    this.isLoading = false;
  }
}

  async removeFavorite(event: Event, dorm: any) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการลบ',
      message: `ต้องการลบ "${dorm.DORM_NAME}" ออกจากรายการโปรดใช่หรือไม่?`,
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { text: 'ลบ', role: 'destructive', handler: () => { this.performRemove(dorm); } }
      ]
    });
    await alert.present();
  }

  async performRemove(dorm: any) {
    const loading = await this.loadingCtrl.create({ message: 'กำลังลบ...', spinner: 'crescent' });
    await loading.present();
    try {
      await this.dormService.removeFavorite(this.currentUserId, dorm.DORM_ID);
      this.favDorms = this.favDorms.filter(d => d.DORM_ID !== dorm.DORM_ID);
      this.showToast('ลบรายการสำเร็จ', 'success');
    } catch (error) {
      console.error(error);
      this.showToast('เกิดข้อผิดพลาดในการลบ', 'danger');
    } finally { loading.dismiss(); }
  }

  goToDetail(dorm: any) { this.router.navigate(['/dorm-detail', dorm.DORM_ID]); }
  goBack() { this.navCtrl.back(); }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg, duration: 2000, color, position: 'bottom'
    });
    toast.present();
  }
}