import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, MenuController, ViewDidEnter, AlertController, IonMenu } from '@ionic/angular';
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

// Icons
import { 
  menuOutline, home, listOutline, personCircleOutline, search, 
  funnelOutline, layersOutline, close, caretDown, caretDownOutline, 
  chevronDown, chevronDownCircleOutline, checkmarkCircle,
  person, create, personOutline, callOutline, key, mail, shieldCheckmark,
  logOutOutline // เพิ่มไอคอน logout
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
  selectedDorm: Dormitory | undefined;
  currentUser: any = null;

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
      'log-out-outline': logOutOutline
    });

    // Load Google Maps API
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

  // ✅ Getter สำหรับเช็ค Role ง่ายๆ ใน HTML
  // 0 = Guest, 1 = User, 2 = Owner, 3 = Admin
  get userRole(): number {
    if (!this.currentUser) return 0;
    // เช็คครอบคลุมทั้งตัวเล็กตัวใหญ่
    return this.currentUser.role_id || this.currentUser.ROLE_TYPE_ID || this.currentUser.role_type_id || 1;
  }

  ngOnInit() {
    this.fetchDorms();
    this.fetchZones(); 
    this.checkLoginStatus(); 
  }

  async ionViewDidEnter() {
    // ลบ Backdrop ค้าง (ถ้ามี)
    const backdrops = document.querySelectorAll('ion-backdrop');
    backdrops.forEach(element => element.remove());
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    const storedData = localStorage.getItem('loggedIn');
    if (storedData) {
      try {
        const userObj = JSON.parse(storedData);
        // เช็คว่า User Valid และไม่โดนแบน
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
    if (this.menuRef) {
        await this.menuRef.toggle();
    }
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

  // ✅ ฟังก์ชันออกจากระบบ
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
          this.dorms = res.data;
          this.dorms.forEach(d => { d.lat = Number(d.lat); d.lng = Number(d.lng); });
      }
    } catch (err) { console.error('Fetch Dorms Error:', err); }
  }

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
              this.searchText, this.selectedZone, 
              this.minPrice || undefined, this.maxPrice || undefined
          );
          
          if (res.success && res.data) {
              this.dorms = res.data;
              this.dorms.forEach(d => { d.lat = Number(d.lat); d.lng = Number(d.lng); });

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
      } catch (err) { console.error('Search Error:', err); }
  }

  openInfoWindow(marker: MapMarker, dorm: Dormitory) {
    this.selectedDorm = dorm;
    if (this.infoWindow) this.infoWindow.open(marker);
  }

  async goToDetail() { 
    if (this.selectedDorm) {
      try {
        const res = await this.dormService.getDormById(this.selectedDorm.DORM_ID);
        this.selectedDormDetail = res.success ? res.data : this.selectedDorm;
      } catch (e) { this.selectedDormDetail = this.selectedDorm; }
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