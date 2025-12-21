import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, MenuController, ViewDidEnter, AlertController, IonMenu } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient, HttpClientJsonpModule } from '@angular/common/http';
// ✅ Import MapCircle เพิ่มเข้ามา
import { GoogleMapsModule, MapInfoWindow, MapMarker, MapCircle } from '@angular/google-maps';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HeaderComponent } from '../../components/header/header.component';
import { DormitoryService, Dormitory } from '../../services/dormitory'; 
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import { DormDetailPage } from '../dorm-detail/dorm-detail.page';

// Icons ... (เหมือนเดิม)
import { 
  menuOutline, home, listOutline, personCircleOutline, search, 
  funnelOutline, layersOutline, close, caretDown, caretDownOutline, 
  chevronDown, chevronDownCircleOutline, checkmarkCircle,
  person, create, personOutline, callOutline, key, mail, shieldCheckmark,
  logOutOutline, locationOutline // เพิ่มไอคอน location
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
  // จุดกึ่งกลาง (สมมติว่าเป็นตำแหน่งเรา หรือ Default)
  center: google.maps.LatLngLiteral = { lat: 16.246, lng: 103.252 };
  zoom = 14;
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false, zoomControl: false, mapTypeControl: false, 
    streetViewControl: false, fullscreenControl: false
  };

  searchText: string = '';
  dorms: Dormitory[] = []; 
  
  // เก็บข้อมูลทั้งหมดไว้สำรองเพื่อทำ Filter client-side
  allDorms: Dormitory[] = []; 

  isModalOpen = false;

  // Filter Variables
  minPrice: number | null = null;
  maxPrice: number | null = null;
  selectedZone: string = '';
  // ✅ ตัวแปรระยะทาง (กิโลเมตร)
  maxDistance: number | null = null;
  
  zoneOptions: any[] = []; 

  selectedDormDetail: Dormitory | null = null;
  selectedDorm: Dormitory | undefined;
  currentUser: any = null;

  // ✅ ตัวแปรสำหรับวงกลม (Circle)
  circleCenter: google.maps.LatLngLiteral | undefined;
  circleRadius: number = 0; // หน่วยเป็นเมตร
  circleOptions: google.maps.CircleOptions = {
    fillColor: '#FFD600',
    fillOpacity: 0.2,
    strokeColor: '#FFD600',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    clickable: false, // ไม่ให้กดโดนวงกลม (ให้กดทะลุไป Map ได้)
  };

  @ViewChild(MapInfoWindow) infoWindow: MapInfoWindow | undefined;
  @ViewChild('homeMenu') menuRef: IonMenu | undefined;

  constructor(
    private router: Router,
    private dormService: DormitoryService,
    private httpClient: HttpClient,
    private menuCtrl: MenuController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      'menu-outline': menuOutline, home, 'list-outline': listOutline,
      'person-circle-outline': personCircleOutline, search,
      'funnel-outline': funnelOutline, 'layers-outline': layersOutline,
      'close': close, 'caret-down': caretDown, 'caret-down-outline': caretDownOutline,
      'chevron-down': chevronDown, 'chevron-down-circle-outline': chevronDownCircleOutline,
      'checkmark-circle': checkmarkCircle,
      'person': person, 'create': create, 'person-outline': personOutline,
      'call-outline': callOutline, 'key': key, 'mail': mail, 'shield-checkmark': shieldCheckmark,
      'log-out-outline': logOutOutline, 'location-outline': locationOutline
    });

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

  get userRole(): number {
    if (!this.currentUser) return 0;
    return this.currentUser.role_id || this.currentUser.ROLE_TYPE_ID || this.currentUser.role_type_id || 1;
  }

  ngOnInit() {
    this.fetchDorms();
    this.fetchZones(); 
    this.checkLoginStatus(); 
    // ถ้าอยากดึง Location จริงของ User ให้เรียกฟังก์ชัน Geolocation ตรงนี้
    // this.getCurrentLocation(); 
  }

  async ionViewDidEnter() {
    const backdrops = document.querySelectorAll('ion-backdrop');
    backdrops.forEach(element => element.remove());
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    const storedData = localStorage.getItem('loggedIn');
    if (storedData) {
      try {
        const userObj = JSON.parse(storedData);
        if ((userObj.id || userObj.USER_ID) && userObj.accout_status === 0) {
           this.currentUser = userObj;
        } else {
           this.currentUser = null;
        }
      } catch (e) {
        this.currentUser = null;
      }
    } else {
      this.currentUser = null;
    }
  }

  async toggleMenu() {
    if (this.menuRef) await this.menuRef.toggle();
  }

  async navigate(path: string) {
    if (this.menuRef) await this.menuRef.close();
    this.router.navigate([path]);
  }

  async checkAuthAndNavigate(path: string) {
    if (this.menuRef) await this.menuRef.close();
    if (this.currentUser) {
      this.router.navigate([path]);
    } else {
      const alert = await this.alertCtrl.create({
        header: 'แจ้งเตือน',
        message: 'กรุณาเข้าสู่ระบบเพื่อใช้งานฟังก์ชันนี้',
        buttons: [
          { text: 'ยกเลิก', role: 'cancel' },
          { text: 'เข้าสู่ระบบ', handler: () => { this.router.navigate(['/login']); } }
        ]
      });
      await alert.present();
    }
  }

  async logout() {
    const alert = await this.alertCtrl.create({
        header: 'ยืนยัน',
        message: 'ต้องการออกจากระบบใช่หรือไม่?',
        buttons: [
            { text: 'ยกเลิก', role: 'cancel' },
            {
                text: 'ออกจากระบบ',
                role: 'destructive',
                handler: async () => {
                    localStorage.removeItem('loggedIn');
                    this.currentUser = null;
                    if (this.menuRef) await this.menuRef.close();
                    this.router.navigate(['/login']);
                }
            }
        ]
    });
    await alert.present();
  }

  async fetchZones() {
    try {
      const res = await this.dormService.getZones();
      if (res.success) this.zoneOptions = res.data;
    } catch (error) { console.error('Fetch Zones Error:', error); }
  }

  async fetchDorms() {
    try {
      const res = await this.dormService.getAllDorms();
      if (res.success && res.data) {
          // เก็บข้อมูลทั้งหมดไว้ใน allDorms เพื่อใช้คำนวณระยะทาง
          this.allDorms = res.data.map(d => ({...d, lat: Number(d.lat), lng: Number(d.lng)}));
          this.dorms = [...this.allDorms];
      }
    } catch (err) { console.error('Fetch Dorms Error:', err); }
  }

  async onSearch(text: any) {
    const searchValue = (typeof text === 'string' ? text : text?.target?.value || '').trim();
    this.searchText = searchValue;
    this.performSearch();
  }

  applyFilter() {
      this.setOpen(false);
      this.performSearch(); 
  }


  async performSearch() {
      try {
          const res = await this.dormService.searchDorms(
              this.searchText, this.selectedZone, 
              this.minPrice || undefined, this.maxPrice || undefined
          );
          
          if (res.success && res.data) {
              let tempDorms = res.data.map(d => ({...d, lat: Number(d.lat), lng: Number(d.lng)}));

              // กรองระยะทาง (Client-side)
              if (this.maxDistance) {
                 tempDorms = tempDorms.filter(dorm => {
                    const distKm = this.calculateDistance(
                        this.center.lat, this.center.lng, 
                        dorm.lat, dorm.lng
                    );
                    return distKm <= this.maxDistance!;
                 });
              }

              this.dorms = tempDorms;

              if (this.dorms.length > 0) {
                  // ถ้าไม่ได้กรองระยะทาง ให้ย้าย Map ไปหาหอแรก
                  if (!this.maxDistance) {
                     const target = this.dorms[0];
                     
                     // 🔴🔴🔴 แก้ตรงนี้ครับ: เช็คว่า target มีค่าจริงก่อนใช้ 🔴🔴🔴
                     if (target) {
                        this.center = { lat: target.lat, lng: target.lng };
                     }
                  }
                  this.zoom = this.maxDistance ? 12 : 14; 
              }
          } else {
              this.dorms = [];
          }
      } catch (err) { console.error('Search Error:', err); }
  }

  // ✅ ฟังก์ชันคำนวณระยะทาง (Haversine Formula) หน่วยเป็น กม.
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // รัศมีโลก (km)
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // ระยะทาง (km)
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // ✅ เมื่อคลิกที่ Marker
  openInfoWindow(marker: MapMarker, dorm: Dormitory) {
    this.selectedDorm = dorm;
    
    // 1. ตั้งค่าวงกลม
    this.circleCenter = { lat: dorm.lat, lng: dorm.lng };
    this.circleRadius = 1000; 
    
    this.center = { lat: dorm.lat, lng: dorm.lng };
    this.zoom = 11; 

    if (this.infoWindow) this.infoWindow.open(marker);
  }

  async goToDetail() { 
    if (this.selectedDorm) {
      try {
        const res = await this.dormService.getDormById(this.selectedDorm.DORM_ID);
        this.selectedDormDetail = res.success ? res.data : this.selectedDorm;
      } catch (e) { this.selectedDormDetail = this.selectedDorm; }
      if (this.infoWindow) this.infoWindow.close();
      
      // ลบวงกลมออกเมื่อเข้าหน้า Detail (ถ้าต้องการ)
      // this.circleCenter = undefined; 
    }
  }

  closeDetailPanel() { this.selectedDormDetail = null; }
  goToCompare() { this.router.navigate(['/compare']); }
  setOpen(isOpen: boolean) { this.isModalOpen = isOpen; }
  openFilter() { this.setOpen(true); }
  selectZone(zoneName: string) { 
      this.selectedZone = this.selectedZone === zoneName ? '' : zoneName; 
  }
}