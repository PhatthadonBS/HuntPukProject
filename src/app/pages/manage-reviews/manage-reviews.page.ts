import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // เพิ่ม DatePipe
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonButtons, IonButton, IonIcon, IonSpinner, IonBadge,
  AlertController, ToastController, LoadingController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, trash, star, personCircle, timeOutline, chatbubbleEllipses, chatbubblesOutline, personOutline, trashOutline, starOutline, chatboxOutline } from 'ionicons/icons';
import { ActivatedRoute, Router } from '@angular/router';
import { DormitoryService } from '../../services/dormitory';

@Component({
  selector: 'app-manage-reviews',
  templateUrl: './manage-reviews.page.html',
  styleUrls: ['./manage-reviews.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonButtons, IonButton, IonIcon, IonSpinner, IonBadge,
    CommonModule, FormsModule
  ],
  providers: [DatePipe]
})
export class ManageReviewsPage implements OnInit {

  dormId: number = 0;
  reviews: any[] = [];
  isLoading = false;
  dormName: string = ''; // เก็บชื่อหอพักเพื่อแสดงหัวข้อ

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dormService: DormitoryService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) { 
    addIcons({ arrowBack, trash, star, personCircle, timeOutline, chatbubbleEllipses, chatbubblesOutline, personOutline, trashOutline, starOutline, chatboxOutline });
  }

  ngOnInit() {
    // รับ ID หอพักจาก URL
    this.dormId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.dormId) {
      this.loadReviews();
      // *Option: อาจจะเรียก getDormById เพื่อเอาชื่อหอมาโชว์หัวข้อก็ได้
      this.loadDormName();
    }
  }

  goBack() {
    this.router.navigate(['/home']); // หรือ path ก่อนหน้า
  }

  async loadDormName() {
    try {
      const res = await this.dormService.getDormById(this.dormId);
      if(res.success) {
        this.dormName = res.data.DORM_NAME;
      }
    } catch (error) {
      console.log('Cannot get dorm name');
    }
  }

  async loadReviews() {
    this.isLoading = true;
    try {
      const res = await this.dormService.getReviewsByDormId(this.dormId);
      if (res && res.data) {
        this.reviews = res.data;
      } else {
        this.reviews = [];
      }
    } catch (error) {
      console.error('Load Reviews Error:', error);
      this.showToast('ไม่สามารถโหลดรีวิวได้', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // สร้าง Array สำหรับวนลูปแสดงดาว (เช่น score=4 ก็จะได้ [1,1,1,1,0])
  getStars(score: number): number[] {
    return Array(5).fill(0).map((_, i) => i < score ? 1 : 0);
  }

  async confirmDelete(review: any) {
    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการลบ',
      message: `ต้องการลบรีวิวของ "${review.USERNAME}" ใช่หรือไม่?`,
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        {
          text: 'ลบรีวิว',
          role: 'destructive',
          handler: () => {
            this.executeDelete(review.REVIEW_ID);
          }
        }
      ]
    });
    await alert.present();
  }

  async executeDelete(reviewId: number) {
    const loading = await this.loadingCtrl.create({ message: 'กำลังลบ...' });
    await loading.present();
    try {
      await this.dormService.deleteReview(reviewId);
      this.showToast('ลบรีวิวเรียบร้อย', 'success');
      this.loadReviews(); // โหลดใหม่
    } catch (error) {
      this.showToast('เกิดข้อผิดพลาดในการลบ', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg, duration: 2000, color: color, position: 'bottom'
    });
    toast.present();
  }
}