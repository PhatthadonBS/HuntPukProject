import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router'; 
import { addIcons } from 'ionicons';
import { person, mail, create, arrowBack, call, shieldCheckmark, home, documentText, close, alertCircle } from 'ionicons/icons';
import { UserService } from '../../services/user'; 
import { DormitoryService } from '../../services/dormitory';
import { Auth } from '../../services/auth';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonSpinner, LoadingController, ToastController, AlertController, IonModal } from '@ionic/angular/standalone';

@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.page.html',
  styleUrls: ['./my-account.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonSpinner, IonModal]
})
export class MyAccountPage implements OnInit {
  user: any = {};
  isLoading: boolean = false;
  isOwnProfile: boolean = true; 
  canEdit: boolean = false;
  
  myDorms: any[] = [];
  isDormModalOpen: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute, 
    private userService: UserService,
    private dormService: DormitoryService,
    private authService: Auth,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) { 
    addIcons({ person, mail, create, arrowBack, call, shieldCheckmark, home, documentText, close, alertCircle });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadUserData();
  }

  extractPhone(data: any): string {
    if (!data) return '-';
    
    // ✅ ครอบคลุมทุก case ที่เป็นไปได้จาก Backend
    const phoneFields = [
      data.PHONE_NUMBER,
      data.phone_number, 
      data.phone,
      data.PHONE,
      data.phoneNumber,
      data.tel,
      data.TEL
    ];

    for (const field of phoneFields) {
      if (field && field !== '-' && field !== 'null' && field.toString().trim() !== '') {
        const cleaned = field.toString().trim();
        console.log('✅ Found phone:', cleaned); // Debug
        return cleaned;
      }
    }

    console.warn('⚠️ No phone found in data:', data); // Debug
    return '-';
  }

  async loadUserData() {
    this.isLoading = true;

    // 1. ดึงข้อมูลจาก LocalStorage ไว้เป็นหลักสำรอง
    const stored = localStorage.getItem('loggedIn');
    let localPhone = '-'; // ✅ เบอร์โทรจาก localStorage (แหล่งที่เชื่อถือได้ 100%)
    let currentUser: any = null;
    let myRole: number = 1;
    let myId: number = 0;

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        currentUser = parsed.user ? parsed.user : parsed;
        myRole = currentUser.role_id || currentUser.role_type_id || currentUser.ROLE_TYPE_ID || 1; 
        myId = currentUser.id || currentUser.user_id || currentUser.USER_ID;

        // ✅ ดึงเบอร์โทรจาก localStorage และเก็บไว้ (ไม่ให้ API ทับ!)
        localPhone = this.extractPhone(currentUser);
        console.log('📱 Phone from localStorage:', localPhone);

        // นำขึ้นจอทันที
        this.user = {
          id: myId,
          username: currentUser.username || currentUser.USERNAME || 'ไม่ระบุชื่อ',
          email: currentUser.email || currentUser.EMAIL || '-',
          phone: localPhone, // ✅ ใช้เบอร์จาก localStorage เป็นหลัก
          role_id: myRole,
          status: currentUser.ACCOUNT_STATUS ?? currentUser.status ?? 0
        };
      } catch (e) { console.error(e); }
    }

    // 2. ดึงข้อมูลจาก API (อาจไม่มีเบอร์โทร)
    try {
      const routeId = this.route.snapshot.paramMap.get('id');

      if (routeId) {
        // กรณีดูโปรไฟล์คนอื่น
        this.isOwnProfile = false;
        const rawData = await this.userService.getUserProfile(Number(routeId));
        
        if (rawData && (rawData.EMAIL || rawData.email || rawData.PHONE_NUMBER || rawData.phone_number || rawData.PHONE || rawData.phone || rawData.USERNAME || rawData.username)) {
            this.user = {
              id: rawData.USER_ID || rawData.id || 0,
              username: rawData.USERNAME || rawData.username || 'ไม่ระบุชื่อ',
              email: rawData.EMAIL || rawData.email || '-',
              phone: rawData.PHONE_NUMBER || this.extractPhone(rawData),
              role_id: rawData.ROLE_TYPE_ID || rawData.role_id || 1,
              status: rawData.ACCOUNT_STATUS ?? rawData.status ?? 0,
              first_name: rawData.FIRST_NAME || rawData.first_name || '',
              last_name: rawData.LAST_NAME || rawData.last_name || '',
              profile_image: rawData.PROFILE_IMAGE || rawData.profile_image || ''
            };
        }
        this.canEdit = (myRole === 3); 
      } else {
        // กรณีดูโปรไฟล์ตัวเอง
        this.isOwnProfile = true;
        this.canEdit = true; 

        if (myId) {
          const rawData = await this.userService.getUserProfile(myId);

          const isRealData = rawData && (rawData.EMAIL || rawData.email ||rawData.PHONE_NUMBER || rawData.phone_number || rawData.PHONE || rawData.phone || rawData.USERNAME || rawData.username);

          if (isRealData) {
            const apiPhone = this.extractPhone(rawData);
            
            // ✅ ตรรกะสำคัญ: ถ้า API ไม่มีเบอร์ หรือส่งมาเป็น '-' ให้ใช้ของ localStorage
            const finalPhone = (apiPhone !== '-') ? apiPhone : localPhone;

            console.log('📞 API Phone:', apiPhone);
            console.log('📱 Final Phone (using):', finalPhone);

            this.user = {
              id: rawData.USER_ID || rawData.id || this.user.id || 0,
              username: rawData.USERNAME || rawData.username || this.user.username || 'ไม่ระบุชื่อ',
              email: rawData.EMAIL || rawData.email || this.user.email || '-',
              phone:rawData.PHONE_NUMBER || this.user.phone  || finalPhone, // ✅ ใช้เบอร์จาก localStorage ถ้า API ไม่มี
              role_id: rawData.ROLE_TYPE_ID || rawData.role_id || this.user.role_id || 1,
              status: rawData.ACCOUNT_STATUS ?? rawData.status ?? this.user.status,
              first_name: rawData.FIRST_NAME || rawData.first_name || '',
              last_name: rawData.LAST_NAME || rawData.last_name || '',
              profile_image: rawData.PROFILE_IMAGE || rawData.profile_image || ''
            };

            // อัปเดตกลับเข้า localStorage
            if (stored) {
              const parsedStore = JSON.parse(stored);
              if (parsedStore.user) {
                parsedStore.user.username = this.user.username;
                parsedStore.user.USERNAME = this.user.username;
                parsedStore.user.phone = this.user.phone;
                parsedStore.user.PHONE_NUMBER = this.user.phone;
              } else {
                parsedStore.username = this.user.username;
                parsedStore.USERNAME = this.user.username;
                parsedStore.phone = this.user.phone;
                parsedStore.PHONE_NUMBER = this.user.phone;
              }
              localStorage.setItem('loggedIn', JSON.stringify(parsedStore));
            }
          } else {
             console.warn("⚠️ API Error 401/403 — ใช้ข้อมูลจาก localStorage 100%");
             // this.user ยังคงใช้ข้อมูลจาก localStorage ที่ set ไว้ตอนแรก
          }
        }
      }
    } catch (e) {
      console.warn('❌ API Error:', e);
      console.log('✅ Falling back to localStorage data');
      // this.user ยังคงเป็นค่าจาก localStorage
    } finally {
      this.isLoading = false;
      if (this.user.role_id === 2) {
        this.loadOwnerDorms();
      }
    }
  }

  goToEditProfile() {
    this.router.navigate(['/edit-profile']); 
  }
  
  goBack() {
    if (!this.isOwnProfile) { this.router.navigate(['/manage-users']); } 
    else { this.router.navigate(['/home']); }
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2000, color: color, position: 'bottom' });
    toast.present();
  }

  async loadOwnerDorms() {
    try {
      const res: any = await this.dormService.getMyDorms(this.user.id);
      if (res && res.data) {
        const summaryDorms = res.data;
        // ดึงข้อมูลแบบละเอียดของแต่ละหอพัก เพื่อเอาชื่อเจ้าของ เบอร์ติดต่อ ไลน์ ฯลฯ
        const detailedDorms = await Promise.all(summaryDorms.map(async (dorm: any) => {
          try {
            const detailRes: any = await this.dormService.getDormById(dorm.DORM_ID || dorm.id);
            if (detailRes && detailRes.data) {
              const fullDorm = Array.isArray(detailRes.data) ? detailRes.data[0] : detailRes.data;
              return { 
                ...dorm, 
                ...fullDorm,
                OWNER_FIRST_NAME: fullDorm.FIRST_NAME || fullDorm.OWNER_FIRST_NAME || dorm.FIRST_NAME || this.user.first_name,
                OWNER_LAST_NAME: fullDorm.LAST_NAME || fullDorm.OWNER_LAST_NAME || dorm.LAST_NAME || this.user.last_name,
                OWNER_PHONE: fullDorm.PHONE || fullDorm.PHONE_NUMBER || dorm.PHONE || this.user.phone
              }; // รวมข้อมูลสรุปเข้ากับข้อมูลแบบละเอียด และแนบข้อมูลเจ้าของ
            }
          } catch (err) {
            console.error('Failed to load details for dorm', dorm.DORM_ID, err);
          }
          return {
            ...dorm,
            OWNER_FIRST_NAME: dorm.FIRST_NAME || this.user.first_name,
            OWNER_LAST_NAME: dorm.LAST_NAME || this.user.last_name,
            OWNER_PHONE: dorm.PHONE || dorm.PHONE_NUMBER || this.user.phone
          }; // ถ้าดึงแบบละเอียดไม่สำเร็จ ก็ใช้แบบสรุปไปก่อนและแนบชื่อเจ้าของ
        }));
        this.myDorms = detailedDorms;
      }
    } catch (e) {
      console.error('Failed to load owner dorms', e);
    }
  }

  openDormModal() {
    this.isDormModalOpen = true;
  }

  closeDormModal() {
    this.isDormModalOpen = false;
  }

  async deactivateAccount() {
    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการปิดใช้งานบัญชี',
      message: 'กรุณากรอกอีเมลของคุณเพื่อยืนยันการปิดบัญชีอย่างถาวร',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'กรอกอีเมลของคุณ...'
        }
      ],
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        {
          text: 'ยืนยัน',
          handler: async (data) => {
            if (data.email !== this.user.email) {
              this.showToast('อีเมลไม่ถูกต้อง', 'danger');
              return false; // ไม่ปิด alert
            }

            try {
              await this.authService.deactivateUser(this.user.id);
              this.showToast('ปิดบัญชีสำเร็จ', 'success');
              localStorage.removeItem('loggedIn');
              this.router.navigate(['/login']);
              return true;
            } catch (err: any) {
              this.showToast(err.error?.message || 'เกิดข้อผิดพลาดในการปิดบัญชี', 'danger');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }
}