import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular'; 
import { Router } from '@angular/router'; 
import { DormitoryService } from '../../services/dormitory'; 
import { addIcons } from 'ionicons';
import { 
  arrowBack, star, trophy, bookmark, bookmarkOutline,
  call, callOutline, documentTextOutline, chatbubbleEllipsesOutline, 
  logoFacebook, locationOutline, checkmarkCircleOutline // ✅ นำเข้าไอคอนที่ทำให้เกิด Error ทั้งหมดมาไว้ที่นี่
} from 'ionicons/icons';

@Component({
  selector: 'app-dorm-popular',
  templateUrl: './dorm-popular.page.html',
  styleUrls: ['./dorm-popular.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class DormPopularPage implements OnInit {

  topDorm: any = null;
  otherDorms: any[] = [];
  compareError: string = '';
  currentUserId: number = 0;
  
  constructor(
    private dormService: DormitoryService,
    private router: Router,  
    private cdr: ChangeDetectorRef,
    private toastCtrl: ToastController
  ) { 
    // ✅ ลงทะเบียนไอคอนทั้งหมดเพื่อป้องกันระบบ UI ช็อก (TypeError)
    addIcons({ 
      arrowBack, star, trophy,
      bookmark, 'bookmark-outline': bookmarkOutline,
      call, 'call-outline': callOutline, 'document-text-outline': documentTextOutline,
      'chatbubble-ellipses-outline': chatbubbleEllipsesOutline, 'logo-facebook': logoFacebook,
      'location-outline': locationOutline, 'checkmark-circle-outline': checkmarkCircleOutline
    });
  }

  ngOnInit() {
    this.checkLoginStatus();
    this.fetchPopularDorms();
  }

  checkLoginStatus() {
    const storedData = localStorage.getItem('loggedIn');
    if (storedData) {
      try {
        const userObj = JSON.parse(storedData);
        this.currentUserId = userObj.id || userObj.USER_ID || 0;
      } catch (e) { console.error(e); }
    }
  }

  async fetchPopularDorms() {
    this.compareError = '';
    try {
      const res = await this.dormService.getPopularDorms();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        
        let processedDorms = res.data.map((dorm: any) => {
          const rawScore = dorm.SCORE || dorm.score || 0;
          const parsedScore = parseFloat(rawScore);
          return { 
            ...dorm, 
            scoreDisplay: (!isNaN(parsedScore)) ? parsedScore.toFixed(1) : '-',
            isChecked: false 
          };
        });
        
        processedDorms = processedDorms
          .filter((d: any) => parseFloat(d.SCORE || d.score || 0) > 0)
          .sort((a: any, b: any) => parseFloat(b.SCORE || b.score || 0) - parseFloat(a.SCORE || a.score || 0));

        if(processedDorms.length > 0) {
           this.topDorm = processedDorms[0];
           this.otherDorms = processedDorms.slice(1);
        }

      } else {
        this.compareError = 'ยังไม่มีข้อมูลหอพักยอดนิยมในขณะนี้';
      }
    } catch (err) {
      this.compareError = 'เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง';
    } finally {
      this.cdr.detectChanges(); 
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  goToDetail(dorm: any, event?: any) {
    if (event) {
      event.preventDefault();
      event.stopPropagation(); 
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (dorm && (dorm.DORM_ID || dorm.id)) {
      this.router.navigate(['/dorm-detail', dorm.DORM_ID || dorm.id]);
    }
  }

  // ✅ ระบบกดสนใจ (Bookmark) 
  async toggleFavorite(event: Event, dorm: any) {
    event.preventDefault(); // บล็อกไม่ให้มันเด้งไปหน้าอื่น
    event.stopPropagation(); // บล็อกการคลิกทะลุ 

    if (!this.currentUserId || this.currentUserId === 0) {
        this.showToast('กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนบันทึกรายการโปรด', 'warning');
        return;
    }

    if (dorm.isChecked) {
      this.showToast('หอพักนี้อยู่ในรายการโปรดของคุณแล้ว', 'medium');
      return;
    }

    try {
      await this.dormService.addFavorite(this.currentUserId, dorm.DORM_ID || dorm.id);
      dorm.isChecked = true; 
      this.showToast(`เพิ่ม "${dorm.DORM_NAME}" ลงรายการโปรดเรียบร้อย!`, 'success');
    } catch (error: any) {
      if (error.status === 409 || (error.error && error.error.message === 'Duplicate')) {
         dorm.isChecked = true;
         this.showToast('หอพักนี้มีในรายการโปรดแล้วครับ', 'warning');
      } else {
         this.showToast('เกิดข้อผิดพลาดในการบันทึกรายการโปรด', 'danger');
      }
    }
    this.cdr.detectChanges(); // สั่งให้หน้าจอรีเฟรชปุ่มเปลี่ยนสีทันที!
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      color: color,
      position: 'top', // ✅ แจ้งเตือนลอยอยู่ด้านบนตามที่ขอ
      buttons: [{ text: 'ปิด', role: 'cancel' }]
    });
    toast.present();
  }
}