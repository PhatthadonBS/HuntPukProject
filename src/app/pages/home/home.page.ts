import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, MenuController, ViewDidEnter, AlertController, IonMenu } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient, HttpClientJsonpModule } from '@angular/common/http';
import { GoogleMapsModule, MapInfoWindow, MapMarker, MapCircle } from '@angular/google-maps';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HeaderComponent } from '../../components/header/header.component';
import { DormitoryService, Dormitory } from '../../services/dormitory'; 
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import { DormDetailPage } from '../dorm-detail/dorm-detail.page';

import { 
  menuOutline, home, listOutline, personCircleOutline, search, 
  funnelOutline, layersOutline, close, caretDown, caretDownOutline, 
  chevronDown, chevronDownCircleOutline, checkmarkCircle,
  person, create, personOutline, callOutline, key, mail, shieldCheckmark,
  logOutOutline, locationOutline, chatbubbleEllipsesOutline,
  logoFacebook, logoInstagram, paperPlaneOutline // ✅ เพิ่มไอคอน Social Media
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
  allDorms: Dormitory[] = []; 
  isModalOpen = false;

  // Filter Variables
  minPrice: number | null = null;
  maxPrice: number | null = null;
  selectedZone: string = '';
  maxDistance: number | null = null;
  zoneOptions: any[] = []; 

  selectedDormDetail: Dormitory | null = null;
  selectedDorm: Dormitory | undefined;
  currentUser: any = null;

  circleCenter: google.maps.LatLngLiteral | undefined;
  circleRadius: number = 0; 
  circleOptions: google.maps.CircleOptions = {
    fillColor: '#FFD600',
    fillOpacity: 0.2,
    strokeColor: '#FFD600',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    clickable: false, 
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
      'log-out-outline': logOutOutline, 'location-outline': locationOutline,
      'chatbubble-ellipses-outline': chatbubbleEllipsesOutline,
      'logo-facebook': logoFacebook,
      'logo-instagram': logoInstagram,
      'paper-plane-outline': paperPlaneOutline
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
    const isOpen = await this.menuCtrl.isOpen('home-menu');
    if (isOpen) {
      await this.menuCtrl.close('home-menu');
    } else {
      await this.menuCtrl.open('home-menu');
    }
  }

  async navigate(path: string) {
    await this.menuCtrl.close('home-menu');
    this.router.navigate([path]);
  }

  async checkAuthAndNavigate(path: string) {
    await this.menuCtrl.close('home-menu');
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
                    await this.menuCtrl.close('home-menu');
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
                  if (!this.maxDistance) {
                     const target = this.dorms[0];
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

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; 
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async openInfoWindow(marker: MapMarker, dorm: Dormitory) {
    this.selectedDorm = dorm;
    this.center = { lat: dorm.lat, lng: dorm.lng };
    this.zoom = 16; 
    
    this.circleCenter = { lat: dorm.lat, lng: dorm.lng };
    this.circleRadius = 400; 

    if (this.infoWindow) this.infoWindow.open(marker);

    try {
      const res = await this.dormService.getDormById(dorm.DORM_ID);
      if (res.success && res.data) {
         this.selectedDorm = { ...this.selectedDorm, ...res.data }; 
      }
    } catch (e) {
      console.error("Fetch pop-up detail error: ", e);
    }
  }

async goToDetail() { 
    if (this.selectedDorm) {
      // ✅ 1. บังคับเคลียร์ข้อมูลเก่าทิ้งก่อน (ตั้งเป็น null) เพื่อให้ Component โดนทำลายและวาดใหม่
      const targetDorm = this.selectedDorm;
      this.selectedDormDetail = null; 

      try {
        const res = await this.dormService.getDormById(targetDorm.DORM_ID);
        
        // ✅ 2. ใช้ setTimeout หน่วงเวลาไว้ 50 มิลลิวินาที ค่อยยัดข้อมูลหอใหม่เข้าไป
        setTimeout(() => {
           this.selectedDormDetail = res.success ? res.data : targetDorm;
        }, 50);

      } catch (e) { 
        setTimeout(() => {
           this.selectedDormDetail = targetDorm;
        }, 50);
      }
      
      if (this.infoWindow) this.infoWindow.close();
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