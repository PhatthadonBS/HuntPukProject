import { Component, OnInit, Input, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, NavController, AlertController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  star, starHalf, starOutline, locationOutline, callOutline, arrowBack,
  wifi, car, snow, checkmarkCircleOutline, personCircle, timeOutline, send,
  person, logoFacebook, logoInstagram, chatbubbleEllipses, bedOutline, imageOutline, locationSharp,
  navigateCircleOutline, waterOutline, flashOutline, 
  logoTwitter, paperPlane,
  documentTextOutline, call, alertCircleOutline,
  close, chevronBackOutline, chevronForwardOutline, expandOutline
} from 'ionicons/icons';
import { DormitoryService } from '../../services/dormitory'; 

import { ThaiDatePipe } from '../../pipes/thai-date-pipe';

@Component({
  selector: 'app-dorm-detail',
  templateUrl: './dorm-detail.page.html',
  styleUrls: ['./dorm-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, ThaiDatePipe]
})
export class DormDetailPage implements OnInit, OnChanges {

  @Input() dormData: any = null; 
  @Input() isPopup: boolean = false; 
  facilitiesList: { name: string; icon: string }[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dormData'] && changes['dormData'].currentValue) {
      this.prepareOwnerInfo();
      this.parseFacilities();
      this.loadReviews();
    }
  }

  activeTab: string = 'info';
  isLoading: boolean = false;
  isError: boolean = false;
  errorMessage: string = '';
  
  reviews: any[] = [];
  isLoadingReviews: boolean = false;
  
  newReview = { score: 0, comment: '' };

  currentUserId: number = 0;
  currentUserRole: number = 0; 
  hasReviewed: boolean = false;
  ownerInfo: any = null;
  dormStatusList: any[] = [];

  // โ… Lightbox เธชเธณเธซเธฃเธฑเธเธเธขเธฒเธขเธฃเธนเธ โ€” เนเธเนเนเธ”เนเธ—เธฑเนเธเธฃเธนเธเธซเธเนเธฒเธซเธญเนเธฅเธฐเธฃเธนเธเนเธเธฅเน€เธฅเธญเธฃเธต
  isLightboxOpen: boolean = false;
  lightboxImages: string[] = [];
  lightboxIndex: number = 0;

  get lightboxCurrentImage(): string {
    return this.lightboxImages[this.lightboxIndex] || '';
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private dormService: DormitoryService, 
    private toastCtrl: ToastController,
    private alertCtrl: AlertController, 
    private cdr: ChangeDetectorRef, private modalCtrl: ModalController 
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
      'logo-twitter': logoTwitter, 'paper-plane': paperPlane,
      'document-text-outline': documentTextOutline, call,
      'alert-circle-outline': alertCircleOutline,
      close, 'chevron-back-outline': chevronBackOutline, 'chevron-forward-outline': chevronForwardOutline,
      'expand-outline': expandOutline
    });
  }

  ngOnInit() {
    this.fetchDormStatuses();
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

    // โ… เธเธฅเธฑเธเธกเธฒเนเธเน snapshot เนเธเธเน€เธ”เธดเธก (synchronous, เธญเนเธฒเธเธเนเธฒเธ—เธฑเธเธ—เธตเนเธกเนเธ•เนเธญเธเธเธถเนเธ observable emit)
    // เน€เธงเธญเธฃเนเธเธฑเธ subscribe เธเนเธญเธเธซเธเนเธฒเธเธตเนเธ—เธณเนเธซเน production build เธเธฒเธเธเธฃเธ“เธตเนเธกเน trigger callback เน€เธฅเธข
    this.isError = false;
    this.errorMessage = '';

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.loadDormDetail(Number(idParam));
    } else if (this.dormData) {
      this.prepareOwnerInfo();
      this.parseFacilities();
      this.loadReviews();
    }
  }

  fetchDormStatuses() {
    this.dormService.getDormStatuses().subscribe({
      next: (res: any) => this.dormStatusList = res.data || res,
      error: () => console.error('Failed to load dorm statuses')
    });
  }

  get waterDetail(): string {
    if (!this.dormData) return 'เธเธณเธฅเธฑเธเนเธซเธฅเธ”...';
    const lump = Number(this.dormData.water_lump || this.dormData.WATER_LUMP || 0);
    const unit = Number(this.dormData.water_unit || this.dormData.WATER_UNIT || 0);
    
    if (lump > 0 && unit > 0) return `เน€เธซเธกเธฒ ${lump} เธ./เธ”. เธซเธฃเธทเธญ ${unit} เธ./เธซเธเนเธงเธข`;
    if (lump > 0) return `เน€เธซเธกเธฒเธเนเธฒเธข ${lump} เธ./เน€เธ”เธทเธญเธ`;
    if (unit > 0) return `${unit} เธเธฒเธ—/เธซเธเนเธงเธข`;
    return 'เธเนเธฒเธขเธ•เธฒเธกเธเธดเธฅเธฃเธฑเธเธฏ / เธชเธญเธเธ–เธฒเธก';
  }

  get electDetail(): string {
    if (!this.dormData) return 'เธเธณเธฅเธฑเธเนเธซเธฅเธ”...';
    const unit = Number(this.dormData.elect_unit || this.dormData.ELECT_UNIT || 0);
    
    if (unit > 0) return `${unit} เธเธฒเธ—/เธซเธเนเธงเธข`;
    return 'เธเนเธฒเธขเธ•เธฒเธกเธเธดเธฅเธฃเธฑเธเธฏ / เธชเธญเธเธ–เธฒเธก';
  }

  async loadDormDetail(id: number) {
    this.isLoading = true;
    this.isError = false;
    this.errorMessage = '';
    this.dormData = null;
    this.cdr.detectChanges();

    let timeoutTriggered = false;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        timeoutTriggered = true;
        reject(new Error('TIMEOUT'));
      }, 12000);
    });

    try {
      const res: any = await Promise.race([
        this.dormService.getDormById(id),
        timeoutPromise
      ]);

      if (res && res.data) {
        const apiData = res.data;
        this.dormData = Array.isArray(apiData) ? apiData[0] : apiData;

        // โ… เธฃเธงเธกเธฃเธนเธเธชเนเธงเธเธ•เนเธฒเธเน เธเธญเธเธซเนเธญเธเธเธฑเธเน€เธเนเธฒเนเธเนเธ gallery เน€เธเธทเนเธญเนเธซเนเนเธชเธ”เธเธเธฅเนเธเธซเธเนเธฒ detail
        const roomImages = [
          this.dormData.ceiling_img, 
          this.dormData.wall_img, 
          this.dormData.floor_img, 
          this.dormData.bathroom_img, 
          this.dormData.balcony_img
        ].filter(img => img);
        
        if (!this.dormData.gallery) this.dormData.gallery = [];
        this.dormData.gallery = [...this.dormData.gallery, ...roomImages];

        this.prepareOwnerInfo();
        this.parseFacilities();
        this.loadReviews();
      } else {
        this.isError = true;
        this.errorMessage = 'เนเธกเนเธเธเธเนเธญเธกเธนเธฅเธซเธญเธเธฑเธ';
      }
    } catch (error: any) {
      this.isError = true;
      if (timeoutTriggered || error?.message === 'TIMEOUT') {
        this.errorMessage = 'เนเธซเธฅเธ”เธเนเธญเธกเธนเธฅเนเธกเนเนเธ”เน\nเธเธฃเธธเธ“เธฒเธเธ” "เธฅเธญเธเนเธซเธกเน" เธญเธตเธเธเธฃเธฑเนเธ';
      } else if (error?.status === 0) {
        this.errorMessage = 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เน€เธเธทเนเธญเธกเธ•เนเธญ Server เนเธ”เน';
      } else if (error?.status === 404) {
        this.errorMessage = 'เนเธกเนเธเธเธเนเธญเธกเธนเธฅเธซเธญเธเธฑเธเธเธตเน';
      } else if (error?.status === 500) {
        this.errorMessage = 'Server Error เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเน';
      } else {
        this.errorMessage = 'เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ” เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเน';
      }
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  prepareOwnerInfo() {
    if (this.dormData) {
      this.ownerInfo = {
        firstName: this.dormData.FIRST_NAME || 'เนเธกเนเธฃเธฐเธเธธ',
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

  parseFacilities() {
    this.facilitiesList = [];
    if (!this.dormData) return;
    const facData = this.dormData.facilities || this.dormData.FACILITIES || this.dormData.facility;
    if (!facData || facData === 'null') return;

    if (Array.isArray(facData)) {
      this.facilitiesList = facData.map((f: any) => {
        if (typeof f === 'string') return { name: f, icon: '' };
        return { name: f.name || f.FAC_TYPE_NAME || '', icon: f.icon || f.FAC_TYPE_ICON || '' };
      });
    } else if (typeof facData === 'string') {
      this.facilitiesList = facData.split(',').map((s: string) => ({ name: s.trim(), icon: '' }));
    }
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
    } catch (error) { 
      console.error('Load reviews failed', error); 
    } finally { 
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
      this.showToast('เธเธฃเธธเธ“เธฒเนเธซเนเธเธฐเนเธเธเธ”เธฒเธงเธเนเธญเธเธชเนเธเธฃเธตเธงเธดเธง', 'warning'); return;
    }
    
    const alert = await this.alertCtrl.create({
      header: 'เธขเธทเธเธขเธฑเธเธเธฒเธฃเธฃเธตเธงเธดเธง',
      message: 'เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธชเนเธเธฃเธตเธงเธดเธงเธเธตเนเนเธเนเธซเธฃเธทเธญเนเธกเน? เธเนเธญเธเธงเธฃเธฃเธฐเธงเธฑเธ:เธซเธฒเธเธฃเธตเธงเธดเธงเธ–เธนเธเธชเนเธเนเธเนเธฅเนเธง เธเธฐเนเธกเนเธชเธฒเธกเธฒเธฃเธ–เนเธเนเนเธเธซเธฃเธทเธญเธฅเธเนเธ”เนเนเธเธ เธฒเธขเธซเธฅเธฑเธ',
      buttons: [
        { text: 'เธขเธเน€เธฅเธดเธ', role: 'cancel' },
        { text: 'เธขเธทเธเธขเธฑเธ', handler: () => { this.processSubmitReview(); } }
      ]
    });
    
    await alert.present();
  }

  async processSubmitReview() {
    try {
      await this.dormService.addReview(this.currentUserId, this.dormData.DORM_ID, this.newReview.score, this.newReview.comment);
      this.showToast('เธเธญเธเธเธธเธ“เธชเธณเธซเธฃเธฑเธเธเธฒเธฃเธฃเธตเธงเธดเธง!', 'success');
      this.newReview = { score: 0, comment: '' };
      this.loadReviews(); 
    } catch (error: any) {
      const msg = error.error?.message || 'เธชเนเธเธฃเธตเธงเธดเธงเนเธกเนเธชเธณเน€เธฃเนเธ';
      this.showToast(msg, 'danger');
    }
  }

  // โ… เน€เธเธดเธ” Lightbox เธเธขเธฒเธขเธฃเธนเธ โ€” เธฃเธญเธเธฃเธฑเธเธ—เธฑเนเธเธฃเธนเธเธซเธเนเธฒเธซเธญ (เน€เธ”เธตเนเธขเธง) เนเธฅเธฐเธฃเธนเธเนเธเธฅเน€เธฅเธญเธฃเธต (เน€เธฅเธทเนเธญเธเธเนเธฒเธข-เธเธงเธฒเนเธ”เน)
  viewImage(imgUrl: string) {
    const gallery: string[] = (this.dormData?.gallery && this.dormData.gallery.length > 0)
      ? this.dormData.gallery
      : [];

    const heroImg = this.dormData?.image || 'assets/dorm-placeholder.jpg';

    // เธฃเธงเธกเธฃเธนเธเธซเธเนเธฒเธซเธญ + เนเธเธฅเน€เธฅเธญเธฃเธตเน€เธเนเธเธเธธเธ”เน€เธ”เธตเธขเธง เนเธกเนเธเนเธณเธเธฑเธ เน€เธเธทเนเธญเน€เธฅเธทเนเธญเธเธ”เธนเธ•เนเธญเน€เธเธทเนเธญเธเนเธ”เน
    const allImages = [heroImg, ...gallery].filter((img, idx, arr) => img && arr.indexOf(img) === idx);

    this.lightboxImages = allImages.length > 0 ? allImages : [imgUrl];
    const foundIndex = this.lightboxImages.indexOf(imgUrl);
    this.lightboxIndex = foundIndex >= 0 ? foundIndex : 0;
    this.isLightboxOpen = true;
    this.cdr.detectChanges();
  }

  closeLightbox() {
    this.isLightboxOpen = false;
  }

  nextLightboxImage(event?: Event) {
    event?.stopPropagation();
    if (this.lightboxImages.length === 0) return;
    this.lightboxIndex = (this.lightboxIndex + 1) % this.lightboxImages.length;
  }

  prevLightboxImage(event?: Event) {
    event?.stopPropagation();
    if (this.lightboxImages.length === 0) return;
    this.lightboxIndex = (this.lightboxIndex - 1 + this.lightboxImages.length) % this.lightboxImages.length;
  }

  getStarsArray(score: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.round(score) ? 1 : 0);
  }

  get averageScore(): number {
    const rawScore = this.dormData?.SCORE || this.dormData?.score || 0;
    return parseFloat(rawScore);
  }

    cancelPreview() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirmPreview() {
    this.modalCtrl.dismiss(null, 'confirm');
  }

  goBack() {
    this.navCtrl.back();
  }

  retryLoad() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadDormDetail(Number(idParam));
    }
  }

  async showToast(msg: string, color: string, duration: number = 2000) {
    const toast = await this.toastCtrl.create({ message: msg, duration: duration, color: color, position: 'bottom' });
    toast.present();
  }

  goToNavigate() {
    const d = this.dormData;
    const targetLat = Number(d.lat || d.LATITUDE || d.latitude || d.LAT || 0);
    const targetLng = Number(d.lng || d.LONGITUDE || d.longitude || d.LNG || 0);
    const dormId = d.DORM_ID || d.id || d.dorm_id;

    if (!targetLat || !targetLng) {
      console.error('Missing coordinates in dormData:', d);
      this.showToast('เนเธกเนเธเธเธเนเธญเธกเธนเธฅเธเธดเธเธฑเธ”เธเธญเธเธซเธญเธเธฑเธเธเธตเน', 'warning');
      return;
    }

    this.router.navigate(['/home'], {
      queryParams: { navLat: targetLat, navLng: targetLng, dormId: dormId }
    });
  }
}
