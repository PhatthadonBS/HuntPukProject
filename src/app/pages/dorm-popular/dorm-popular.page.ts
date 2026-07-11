import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular'; 
import { Router } from '@angular/router'; 
import { DormitoryService } from '../../services/dormitory'; 
import { addIcons } from 'ionicons';
import { 
  arrowBack, star, trophy, bookmark, bookmarkOutline,
  call, callOutline, documentTextOutline, chatbubbleEllipsesOutline, 
  logoFacebook, locationOutline, checkmarkCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-dorm-popular',
  templateUrl: './dorm-popular.page.html',
  styleUrls: ['./dorm-popular.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class DormPopularPage implements OnInit {

  popularDorms: any[] = [];
  compareError: string = '';
  currentUserId: number = 0;
  dormStatusList: any[] = [];
  
  constructor(
    private dormService: DormitoryService,
    private router: Router,  
    private cdr: ChangeDetectorRef,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController // ✅ นำเข้า AlertController
  ) { 
    addIcons({ 
      arrowBack, star, trophy, bookmark, 'bookmark-outline': bookmarkOutline,
      call, 'call-outline': callOutline, 'document-text-outline': documentTextOutline,
      'chatbubble-ellipses-outline': chatbubbleEllipsesOutline, 'logo-facebook': logoFacebook,
      'location-outline': locationOutline, 'checkmark-circle-outline': checkmarkCircleOutline,
      eyeOutline: 'eye-outline' // For views
    });
  }

  ngOnInit() {
    this.checkLoginStatus();
    this.fetchDormStatuses();
    this.fetchPopularDorms();
  }

  fetchDormStatuses() {
    this.dormService.getDormStatuses().subscribe({
      next: (res: any) => this.dormStatusList = res.data || res,
      error: () => console.error('Failed to load dorm statuses')
    });
  }

  checkLoginStatus() {
    this.currentUserId = 0;
    const storedData = localStorage.getItem('loggedIn');
    if (storedData) {
      try {
        const userObj = JSON.parse(storedData);
        const currentUser = userObj.user ? userObj.user : userObj;
        this.currentUserId = Number(currentUser?.id || currentUser?.USER_ID || 0);
      } catch (e) { console.error(e); }
    }
  }

  async fetchPopularDorms() {
    this.compareError = '';
    try {
      // Get up to 1000 to mimic "unlimited"
      const res = await this.dormService.getPopularDorms(1000);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        let processedDorms = res.data.map((dorm: any) => {
          const rawScore = dorm.SCORE || dorm.score || 0;
          const parsedScore = parseFloat(rawScore);
          return { 
            ...dorm, 
            scoreDisplay: (!isNaN(parsedScore)) ? parsedScore.toFixed(1) : '0.0',
            isChecked: false 
          };
        });
        
        // Sort by VIEW_COUNT primarily, then SCORE if needed
        processedDorms = processedDorms
          .sort((a: any, b: any) => {
            const viewsA = a.VIEW_COUNT || a.views || 0;
            const viewsB = b.VIEW_COUNT || b.views || 0;
            if (viewsB !== viewsA) {
               return viewsB - viewsA;
            }
            return parseFloat(b.SCORE || b.score || 0) - parseFloat(a.SCORE || a.score || 0);
          });

        this.popularDorms = processedDorms;
      } else { this.compareError = 'ยังไม่มีข้อมูลหอพักยอดนิยมในขณะนี้'; }
    } catch (err) { this.compareError = 'เกิดข้อผิดพลาดในการดึงข้อมูล'; } 
    finally { this.cdr.detectChanges(); }
  }

  goBack() { this.router.navigate(['/home']); }

  goToDetail(dorm: any, event?: any) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (document.activeElement instanceof HTMLElement) { document.activeElement.blur(); }
    if (dorm && (dorm.DORM_ID || dorm.id)) { this.router.navigate(['/dorm-detail', dorm.DORM_ID || dorm.id]); }
  }

  // 🌟 ระบบกดสนใจ (แบบมี Popup ยืนยัน)
  async toggleFavorite(event: Event, dorm: any) {
    event.preventDefault(); 
    event.stopPropagation(); 

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
            message: 'ต้องการยกเลิกการสนใจหอพักนี้ใช่หรือไม่?',
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
                    } catch (error) { this.showToast('เกิดข้อผิดพลาดในการยกเลิก', 'danger'); }
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
                  } else { this.showToast('เกิดข้อผิดพลาดในการบันทึก', 'danger'); }
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

}