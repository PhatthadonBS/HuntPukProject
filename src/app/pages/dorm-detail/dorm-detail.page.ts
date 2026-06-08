import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, NavController, AlertController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  star, starHalf, starOutline, locationOutline, callOutline, arrowBack,
  wifi, car, snow, checkmarkCircleOutline, personCircle, timeOutline, send,
  person, logoFacebook, logoInstagram, chatbubbleEllipses, bedOutline, imageOutline, locationSharp,
  navigateCircleOutline, waterOutline, flashOutline, // ✅ เพิ่มไอคอนใหม่
  logoTwitter,
  paperPlane
} from 'ionicons/icons';
import { DormitoryService } from '../../services/dormitory'; 

@Component({
  selector: 'app-dorm-detail',
  templateUrl: './dorm-detail.page.html',
  styleUrls: ['./dorm-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class DormDetailPage implements OnInit {

  @Input() dormData: any = null; 
  @Input() isPopup: boolean = false; 

  activeTab: string = 'info';
  
  reviews: any[] = [];
  isLoadingReviews: boolean = false;
  
  newReview = { score: 0, comment: '' };

  currentUserId: number = 0;
  currentUserRole: number = 0; 
  hasReviewed: boolean = false;
  ownerInfo: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private dormService: DormitoryService, 
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController, 
    private cdr: ChangeDetectorRef 
  ) { 
addIcons({ 
      star, 'star-half': starHalf, 'star-outline': starOutline, arrowBack, 'location-sharp': locationSharp,
      'location-outline': locationOutline, 'call-outline': callOutline, 
      wifi, car, snow, 'checkmark-circle-outline': checkmarkCircleOutline,
      'person-circle': personCircle, 'time-outline': timeOutline, send,
      person, 'logo-facebook': logoFacebook, 'logo-instagram': logoInstagram, 
      'chatbubble-ellipses': chatbubbleEllipses, 'bed-outline': bedOutline,
      'image-outline': imageOutline,
      'navigate-circle-outline': navigateCircleOutline, 'water-outline': waterOutline, 'flash-outline': flashOutline,
      'logo-twitter': logoTwitter, 'paper-plane': paperPlane 
    });
  }

  ngOnInit() {
    const storedData = localStorage.getItem('loggedIn');
    if (storedData) {
      try {
        const userObj = JSON.parse(storedData);
        if (userObj) {
          this.currentUserId = userObj.id || userObj.USER_ID || 0;
          this.currentUserRole = userObj.role_id || userObj.ROLE_TYPE_ID || userObj.role_type_id || 0;
        }
      } catch (e) { console.error('Error parsing user data'); }
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    
    if (idParam) {
      this.loadDormDetail(Number(idParam));
    } else if (this.dormData) {
      this.prepareOwnerInfo();
      this.loadReviews();
    }
  }

  async loadDormDetail(id: number) {
    try {
      const res = await this.dormService.getDormById(id);
      if (res && res.success && res.data) {
        this.dormData = Array.isArray(res.data) ? res.data[0] : res.data; 
        
        this.prepareOwnerInfo();
        this.loadReviews();
        this.cdr.detectChanges(); 
      } else {
        this.showToast('ไม่พบข้อมูลหอพัก', 'danger');
        this.navCtrl.back();
      }
    } catch (error) {
      console.error('Error loading dorm detail:', error);
      this.showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล (API Error)', 'danger');
      this.navCtrl.back();
    }
  }

  prepareOwnerInfo() {
    if (this.dormData) {
      this.ownerInfo = {
        firstName: this.dormData.FIRST_NAME || 'ไม่ระบุ',
        lastName: this.dormData.LAST_NAME || '',
        phone: this.dormData.phone || this.dormData.OWNER_PHONE || '-',
        line: this.dormData.line || this.dormData.OWNER_LINE || '-',
        facebook: this.dormData.facebook || this.dormData.OWNER_FACEBOOK || '-',
        instagram: this.dormData.instagram || this.dormData.OWNER_INSTAGRAM || '-',
        x: this.dormData.x || this.dormData.OWNER_X || '-',
        telegram: this.dormData.telegram || this.dormData.OWNER_TELEGRAM || '-',
      };
    }
  }

  switchTab(tab: string) { 
    this.activeTab = tab; 
    this.cdr.detectChanges(); 
  }

  // ✅ facilities จาก API คือ [{name: string, icon: string}]
  get facilitiesList(): { name: string; icon: string }[] {
    if (!this.dormData) return [];
    const facData = this.dormData.facilities || this.dormData.FACILITIES || this.dormData.facility;
    if (!facData || facData === 'null') return [];

    if (Array.isArray(facData)) {
      return facData.map((f: any) => {
        if (typeof f === 'string') return { name: f, icon: '' };
        return { name: f.name || f.FAC_TYPE_NAME || '', icon: f.icon || f.FAC_TYPE_ICON || '' };
      });
    }
    if (typeof facData === 'string') {
      return facData.split(',').map((s: string) => ({ name: s.trim(), icon: '' }));
    }
    return [];
  }

  async loadReviews() {
    if (!this.dormData || !this.dormData.DORM_ID) return;
    this.isLoadingReviews = true;
    this.cdr.detectChanges();

    try {
      const res = await this.dormService.getReviewsByDormId(this.dormData.DORM_ID);
      if (res && res.data) {
        this.reviews = res.data;
        if (this.currentUserId > 0) {
          const myReview = this.reviews.find((r: any) => r.USER_ID === this.currentUserId);
          this.hasReviewed = !!myReview; 
        }
      }
    } catch (error) { console.error('Load reviews failed', error); } 
    finally { 
      this.isLoadingReviews = false; 
      this.cdr.detectChanges(); 
    }
  }

  setRating(score: number) { 
    this.newReview.score = score; 
    this.cdr.detectChanges();
  }

  async submitReview() {
    if (this.newReview.score === 0) {
      this.showToast('กรุณาให้คะแนนดาวก่อนส่งรีวิว', 'warning'); return;
    }
    
    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการรีวิว',
      message: 'คุณต้องการส่งรีวิวนี้ใช่หรือไม่? ข้อควรระวัง:หากรีวิวถูกส่งไปแล้ว จะไม่สามารถแก้ไขหรือลบได้ในภายหลัง',
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { text: 'ยืนยัน', handler: () => { this.processSubmitReview(); } }
      ]
    });
    
    await alert.present();
  }

  async processSubmitReview() {
    const loading = await this.loadingCtrl.create({ message: 'กำลังส่งรีวิว...' });
    await loading.present();
    try {
      await this.dormService.addReview(this.currentUserId, this.dormData.DORM_ID, this.newReview.score, this.newReview.comment);
      this.showToast('ขอบคุณสำหรับการรีวิว!', 'success');
      this.newReview = { score: 0, comment: '' };
      this.loadReviews(); 
    } catch (error: any) {
      const msg = error.error?.message || 'ส่งรีวิวไม่สำเร็จ';
      this.showToast(msg, 'danger');
    } finally { loading.dismiss(); }
  }

  viewImage(imgUrl: string) { console.log('View full image:', imgUrl); }

  getStarsArray(score: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.round(score) ? 1 : 0);
  }

  get averageScore(): number {
    const rawScore = this.dormData?.SCORE || this.dormData?.score || 0;
    return parseFloat(rawScore);
  }

  goBack() { this.navCtrl.back(); }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2000, color: color, position: 'bottom' });
    toast.present();
  }

  // ==========================================
  // 🌟 ฟังก์ชันใหม่ 3 ตัว (สถานะ & นำทาง)
  // ==========================================
  
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

  goToNavigate() {
    // ดึงพิกัดออกมา
    const targetLat = this.dormData.lat || this.dormData.LATITUDE;
    const targetLng = this.dormData.lng || this.dormData.LONGITUDE;
    const dormId = this.dormData.DORM_ID || this.dormData.id;

    if (!targetLat || !targetLng) {
      this.showToast('ไม่พบข้อมูลพิกัดของหอพักนี้', 'warning');
      return;
    }

    // 🚀 สั่งให้เด้งกลับไปหน้า Home พร้อมแนบพิกัดไปกับ URL (QueryParams)
    this.router.navigate(['/home'], {
      queryParams: { navLat: targetLat, navLng: targetLng, dormId: dormId }
    });
  }
}