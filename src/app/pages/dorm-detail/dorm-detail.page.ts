import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  star, starHalf, starOutline, locationOutline, callOutline, 
  wifi, car, snow, checkmarkCircleOutline, personCircle, timeOutline, send,
  person, logoFacebook, logoInstagram, chatbubbleEllipses, bedOutline, imageOutline
} from 'ionicons/icons';
import { DormitoryService } from '../../services/dormitory'; 
import { UserService } from '../../services/user'; 

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
  
  newReview = {
    score: 0,
    comment: ''
  };

  currentUserId: number = 0;
  currentUserRole: number = 0; 
  
  hasReviewed: boolean = false;
  ownerInfo: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dormService: DormitoryService, 
    private userService: UserService, 
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) { 
    addIcons({ 
      star, 'star-half': starHalf, 'star-outline': starOutline,
      'location-outline': locationOutline, 'call-outline': callOutline, 
      wifi, car, snow, 'checkmark-circle-outline': checkmarkCircleOutline,
      'person-circle': personCircle, 'time-outline': timeOutline, send,
      person, 'logo-facebook': logoFacebook, 'logo-instagram': logoInstagram, 
      'chatbubble-ellipses': chatbubbleEllipses, 'bed-outline': bedOutline,
      'image-outline': imageOutline
    });
  }

  ngOnInit() {
    // 1. ดึง User
    const user = this.userService.getCurrentUser();
    if (user) {
      this.currentUserId = user.id;
      this.currentUserRole = user.role_id;
    }

    // 2. ดึง ID จาก URL
    const idParam = this.route.snapshot.paramMap.get('id');
    
    if (idParam) {
      this.loadDormDetail(Number(idParam));
    } else if (this.dormData) {
      // กรณีรับ Input มา
      this.prepareOwnerInfo();
      this.loadReviews();
    }
  }

  async loadDormDetail(id: number) {
    const loading = await this.loadingCtrl.create({ 
      message: 'กำลังโหลดข้อมูล...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const res = await this.dormService.getDormById(id);
      if (res && res.success) {
        this.dormData = res.data; 
        
        // เตรียมข้อมูลย่อย
        this.prepareOwnerInfo();
        this.loadReviews();
      } else {
        this.showToast('ไม่พบข้อมูลหอพัก', 'danger');
        this.router.navigate(['/home']);
      }
    } catch (error) {
      console.error('Error loading dorm detail:', error);
      this.showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'danger');
    } finally {
      loading.dismiss();
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
  }

  get facilitiesList(): string[] {
    if (!this.dormData) return [];
    const facData = this.dormData.facilities || this.dormData.FACILITIES; 
    if (!facData) return [];
    if (Array.isArray(facData)) return facData;
    if (typeof facData === 'string') return facData.split(',').map((item: string) => item.trim());
    return [];
  }

  async loadReviews() {
    if (!this.dormData || !this.dormData.DORM_ID) return;

    this.isLoadingReviews = true;
    try {
      const res = await this.dormService.getReviewsByDormId(this.dormData.DORM_ID);
      if (res && res.data) {
        this.reviews = res.data;
        
        // เช็คว่า User นี้รีวิวไปหรือยัง
        if (this.currentUserId > 0) {
          const myReview = this.reviews.find((r: any) => r.USER_ID === this.currentUserId);
          this.hasReviewed = !!myReview; 
        }
      }
    } catch (error) {
      console.error('Load reviews failed', error);
    } finally {
      this.isLoadingReviews = false;
    }
  }

  setRating(score: number) {
    this.newReview.score = score;
  }

  async submitReview() {
    if (this.newReview.score === 0) {
      this.showToast('กรุณาให้คะแนนดาวก่อนส่งรีวิว', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'กำลังส่งรีวิว...' });
    await loading.present();

    try {
      await this.dormService.addReview(
        this.currentUserId, 
        this.dormData.DORM_ID, 
        this.newReview.score, 
        this.newReview.comment 
      );

      this.showToast('ขอบคุณสำหรับการรีวิว!', 'success');
      this.newReview = { score: 0, comment: '' };
      this.loadReviews(); 

    } catch (error: any) {
      const msg = error.error?.message || 'ส่งรีวิวไม่สำเร็จ';
      this.showToast(msg, 'danger');
    } finally {
      loading.dismiss();
    }
  }

  viewImage(imgUrl: string) {
    console.log('View full image:', imgUrl);
  }

  getStarsArray(score: number): number[] {
    return Array(5).fill(0).map((_, i) => i < score ? 1 : 0);
  }

  get averageScore(): number {
    if (this.reviews.length === 0) return this.dormData?.SCORE || 0;
    const sum = this.reviews.reduce((a, b) => a + b.SCORE, 0);
    return sum / this.reviews.length;
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg, duration: 2000, color: color, position: 'bottom'
    });
    toast.present();
  }
}