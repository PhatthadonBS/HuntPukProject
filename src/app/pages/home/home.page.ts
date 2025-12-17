import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, MenuController, ViewDidEnter, AlertController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient, HttpClientJsonpModule } from '@angular/common/http';
import { GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HeaderComponent } from '../../components/header/header.component';
import { DormitoryService, Dormitory } from '../../services/dormitory'; 
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import { DormDetailPage } from '../dorm-detail/dorm-detail.page';

// ✅ Import Icon ให้ครบทุกตัวที่ใช้ เพื่อแก้ Error สีแดง
import { 
  menuOutline, home, listOutline, personCircleOutline, search, 
  funnelOutline, layersOutline, close, caretDown, caretDownOutline, 
  chevronDown, chevronDownCircleOutline, checkmarkCircle,
  person, create, personOutline, callOutline, key, mail, shieldCheckmark
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonicModule, RouterModule, 
    HttpClientModule, HttpClientJsonpModule, GoogleMapsModule, HeaderComponent, DormDetailPage
  ]
})
export class HomePage implements OnInit, ViewDidEnter {
  
  apiLoaded: Observable<boolean>; 
  center: google.maps.LatLngLiteral = { lat: 16.246, lng: 103.252 };
  zoom = 14;
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false, zoomControl: false, mapTypeControl: false, 
    streetViewControl: false, fullscreenControl: false
  };

  searchText: string = '';
  dorms: Dormitory[] = []; 
  isModalOpen = false;

  // Filter Variables
  minPrice: number | null = null;
  maxPrice: number | null = null;
  selectedZone: string = '';
  zoneOptions: any[] = []; 

  selectedDormDetail: Dormitory | null = null;

  @ViewChild(MapInfoWindow) infoWindow: MapInfoWindow | undefined;
  selectedDorm: Dormitory | undefined;

  currentUser: any = null;

  constructor(
    private router: Router,
    private dormService: DormitoryService,
    private httpClient: HttpClient,
    private menuCtrl: MenuController,
    private alertCtrl: AlertController
  ) {
    // ✅ ลงทะเบียน Icon ให้ครบ (แก้ Error: Invalid base URL / Could not load icon)
    addIcons({
      'menu-outline': menuOutline, home, 'list-outline': listOutline,
      'person-circle-outline': personCircleOutline, search,
      'funnel-outline': funnelOutline, 'layers-outline': layersOutline,
      'close': close, 'caret-down': caretDown, 'caret-down-outline': caretDownOutline,
      'chevron-down': chevronDown, 'chevron-down-circle-outline': chevronDownCircleOutline,
      'checkmark-circle': checkmarkCircle,
      'person': person,
      'create': create,
      'person-outline': personOutline,
      'call-outline': callOutline,
      'key': key,
      'mail': mail,
      'shield-checkmark': shieldCheckmark
    });

    // Load Google Map
    if (typeof google === 'object' && typeof google.maps === 'object') {
        this.apiLoaded = of(true); 
    } else {
        this.apiLoaded = this.httpClient.jsonp(
          `https://maps.googleapis.com/maps/api/js?key=${environment.GGMAPI}`, 'callback'
        ).pipe(
            map(() => true), 
            catchError((err) => { 
                console.error('Map Load Error:', err); 
                return of(false); 
            })
        );
    }
  }

  ngOnInit() {
    this.fetchDorms();
    this.fetchZones(); 
    this.checkLoginStatus(); 
  }

  ionViewDidEnter() {
    // ลบ backdrop ที่อาจค้างอยู่
    const backdrops = document.querySelectorAll('ion-backdrop');
    backdrops.forEach(element => element.remove());
    this.checkLoginStatus(); 
  }

  // ✅ [แก้ไขจุดสำคัญ] เช็ค Login ให้ตรงกับโครงสร้างที่หน้า Login บันทึกมา
  checkLoginStatus() {
    const storedData = localStorage.getItem('loggedIn');
    
    if (storedData) {
      try {
        const userObj = JSON.parse(storedData);
        console.log('📦 Home Check User:', userObj);

        // เช็คว่ามี ID และสถานะปกติ (accout_status = 0)
        // ไม่ต้องเช็ค role_id แบบเจาะจง เพื่อให้ Admin (Role 3) ก็ถือว่า Login แล้ว
        if (userObj.id && userObj.accout_status === 0) {
           this.currentUser = userObj;
           console.log('✅ User Set:', this.currentUser);
        } else {
           console.warn('❌ User invalid status');
           this.currentUser = null;
        }

      } catch (e) {
        console.error('Parse Error', e);
        this.currentUser = null;
      }
    } else {
      this.currentUser = null;
    }
  }

  // ✅ เปิดเมนู (แก้ให้กดติดง่ายขึ้น)
  async toggleMenu() {
    console.log('🔘 กดปุ่ม Hamburger แล้ว!'); // เช็คใน Console ว่าขึ้นไหม

    // 1. บังคับ Enable เมนู 'home-menu' ก่อน (กันเหนียว)
    await this.menuCtrl.enable(true, 'home-menu');
    
    // 2. สั่งเปิดเมนู
    await this.menuCtrl.open('home-menu');
  }

  // ✅ ไปหน้าทั่วไป
  async navigate(path: string) {
    await this.menuCtrl.close('home-menu'); 
    this.router.navigate([path]);
  }

  // ✅ ไปหน้าส่วนตัว (ต้อง Login ก่อน)
  async checkAuthAndNavigate(path: string) {
    await this.menuCtrl.close('home-menu'); 

    if (this.currentUser) {
      // Login แล้ว -> ไปได้
      this.router.navigate([path]);
    } else {
      // ยังไม่ Login -> แจ้งเตือน
      const alert = await this.alertCtrl.create({
        header: 'แจ้งเตือน',
        message: 'กรุณาเข้าสู่ระบบเพื่อใช้งานฟังก์ชันนี้',
        buttons: [
          { text: 'ยกเลิก', role: 'cancel' },
          { 
            text: 'เข้าสู่ระบบ', 
            handler: () => {
              this.router.navigate(['/login']);
            } 
          }
        ]
      });
      await alert.present();
    }
  }

  // API Calls
  async fetchZones() {
    try {
      const res = await this.dormService.getZones();
      if (res.success) {
        this.zoneOptions = res.data;
      }
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  }

  async fetchDorms() {
    try {
      const res = await this.dormService.getAllDorms();
      if (res.success && res.data) {
          this.dorms = res.data;
          this.dorms.forEach(d => {
             d.lat = Number(d.lat);
             d.lng = Number(d.lng);
          });
      }
    } catch (err) {
      console.error('API Error:', err);
    }
  }

  // Search Logic
  async onSearch(text: any) {
    const searchValue = (typeof text === 'string' ? text : text?.target?.value || '').trim();
    this.searchText = searchValue;

    if (searchValue === '' && !this.selectedZone && !this.minPrice && !this.maxPrice) {
        this.fetchDorms(); 
        this.zoom = 14; 
        return;
    }
    this.performSearch();
  }

  applyFilter() {
      this.setOpen(false);
      this.performSearch(); 
  }

  async performSearch() {
      try {
          const res = await this.dormService.searchDorms(
              this.searchText, 
              this.selectedZone, 
              this.minPrice || undefined, 
              this.maxPrice || undefined
          );
          
          if (res.success && res.data) {
              this.dorms = res.data;
              this.dorms.forEach(d => {
                 d.lat = Number(d.lat);
                 d.lng = Number(d.lng);
              });

              if (this.dorms.length > 0) {
                  const target = this.dorms[0];
                  if (target && target.lat && target.lng) {
                      this.center = { lat: target.lat, lng: target.lng };
                      this.zoom = this.dorms.length < 3 ? 16 : 14; 
                  }
              }
          } else {
              this.dorms = [];
          }
      } catch (err) {
          console.error('Search Error:', err);
      }
  }

  // Map & Panel Logic
  openInfoWindow(marker: MapMarker, dorm: Dormitory) {
    this.selectedDorm = dorm;
    if (this.infoWindow) this.infoWindow.open(marker);
  }

  async goToDetail() { 
    if (this.selectedDorm) {
      try {
        const res = await this.dormService.getDormById(this.selectedDorm.DORM_ID);
        if (res.success) {
           this.selectedDormDetail = res.data;
        } else {
           this.selectedDormDetail = this.selectedDorm;
        }
      } catch (e) {
        this.selectedDormDetail = this.selectedDorm;
      }
      if (this.infoWindow) this.infoWindow.close();
    }
  }

  closeDetailPanel() { this.selectedDormDetail = null; }
  goToCompare() { this.router.navigate(['/compare']); }
  
  // Filter Modal
  setOpen(isOpen: boolean) { this.isModalOpen = isOpen; }
  openFilter() { this.setOpen(true); }
  
  selectZone(zoneName: string) { 
      if (this.selectedZone === zoneName) { 
        this.selectedZone = ''; 
      } else { 
        this.selectedZone = zoneName; 
      } 
  }
}