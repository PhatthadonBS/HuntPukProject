import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, MenuController, ViewDidEnter } from '@ionic/angular';
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
import { 
  menuOutline, home, listOutline, personCircleOutline, search, 
  funnelOutline, layersOutline, close, caretDown, caretDownOutline, chevronDown, chevronDownCircleOutline
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

  minPrice: number | null = null;
  maxPrice: number | null = null;
  selectedZone: string = '';

  selectedDormDetail: Dormitory | null = null;

  @ViewChild(MapInfoWindow) infoWindow: MapInfoWindow | undefined;
  selectedDorm: Dormitory | undefined;

  // ✅ ตัวแปรเก็บข้อมูล User ที่ผ่านการตรวจสอบแล้ว
  currentUser: any = null;

  constructor(
    private router: Router,
    private dormService: DormitoryService,
    private httpClient: HttpClient,
    private menuCtrl: MenuController
  ) {
    addIcons({
      'menu-outline': menuOutline, home, 'list-outline': listOutline,
      'person-circle-outline': personCircleOutline, search,
      'funnel-outline': funnelOutline, 'layers-outline': layersOutline,
      'close': close, 'caret-down': caretDown, 'caret-down-outline': caretDownOutline,
      'chevron-down': chevronDown, 'chevron-down-circle-outline': chevronDownCircleOutline
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

  ngOnInit() {
    this.fetchDorms();
    this.checkLoginStatus(); // เช็คสถานะตอนเริ่ม
  }

  ionViewDidEnter() {
    const backdrops = document.querySelectorAll('ion-backdrop');
    backdrops.forEach(element => element.remove());

    this.checkLoginStatus(); // เช็คสถานะอีกครั้งเมื่อกลับมาหน้านี้
  }

  // ✅ ฟังก์ชันเช็คสถานะการล็อกอินและเงื่อนไข Role/Status
  checkLoginStatus() {
    const storedData = localStorage.getItem('loggedIn');
    
    if (storedData) {
      try {
        const userObj = JSON.parse(storedData);
        
        // เงื่อนไข: (Role เป็น 1 หรือ 2) AND (Status เป็น 0)
        // หมายเหตุ: ใช้ชื่อ 'accout_status' ตาม JSON ของคุณ (ระวังคำว่า account ตก n)
        const isRoleValid = (userObj.role_id === 1 || userObj.role_id === 2);
        const isStatusValid = (userObj.accout_status === 0);

        if (isRoleValid && isStatusValid) {
          console.log('User Valid:', userObj.username);
          this.currentUser = userObj; // ผ่านเงื่อนไข -> เก็บค่า User
        } else {
          console.log('User Invalid Role or Status');
          this.currentUser = null; // ไม่ผ่าน -> เคลียร์ค่า
        }
      } catch (e) {
        console.error('Error parsing user data', e);
        this.currentUser = null;
      }
    } else {
      this.currentUser = null;
    }
  }

  async toggleMenu() {
    console.log('Toggling Global Menu...');
    await this.menuCtrl.enable(true, 'main-menu');
    await this.menuCtrl.toggle('main-menu');
  }

  async navigateTo(path: string) {
    await this.menuCtrl.close('home-menu'); 
    this.router.navigate([path]);
  }

  async fetchDorms() {
    try {
      const res = await this.dormService.getAllDorms();
      if (res.success && res.data) {
          this.dorms = res.data;
          const firstDorm = this.dorms[0];
          if (firstDorm && firstDorm.lat && firstDorm.lng) {
              this.center = { lat: firstDorm.lat, lng: firstDorm.lng };
          }
      }
    } catch (err) {
      console.error('API Error:', err);
    }
  }

  async onSearch(text: any) {
    const searchValue = (typeof text === 'string' ? text : text?.target?.value || '').trim();
    this.searchText = searchValue;

    if (searchValue === '') {
        this.fetchDorms(); 
        this.zoom = 14; 
        return;
    }

    try {
        const res = await this.dormService.searchDorms(searchValue);
        
        if (res.success && res.data && res.data.length > 0) {
            console.log('เจอหอพัก:', res.data.length, 'แห่ง');

            this.dorms = res.data;
            const targetDorm = this.dorms[0];

            if (targetDorm && targetDorm.lat && targetDorm.lng) {
                this.center = { 
                    lat: Number(targetDorm.lat), 
                    lng: Number(targetDorm.lng) 
                };
                this.zoom = 18; 
            }
        } else {
            console.log('ไม่พบหอพักที่ค้นหา');
            this.dorms = []; 
        }
    } catch (err) {
        console.error('Search Error:', err);
    }
  }

  openInfoWindow(marker: MapMarker, dorm: Dormitory) {
    this.selectedDorm = dorm;
    if (this.infoWindow) this.infoWindow.open(marker);
  }

  goToDetail() { 
    if (this.selectedDorm) {
      console.log('Open Side Panel:', this.selectedDorm);
      this.selectedDormDetail = this.selectedDorm;
      if (this.infoWindow) this.infoWindow.close();
    }
  }

  closeDetailPanel() {
    this.selectedDormDetail = null;
  }

  goToLogin() { this.router.navigate(['/login']); }
  goToCompare() { this.router.navigate(['/compare']); }
  
  setOpen(isOpen: boolean) { this.isModalOpen = isOpen; }
  openFilter() { this.setOpen(true); }
  
  selectZone(zone: string) { 
      if (this.selectedZone === zone) { this.selectedZone = ''; } else { this.selectedZone = zone; } 
  }

  applyFilter() {
      console.log('Filter Data:', { minPrice: this.minPrice, maxPrice: this.maxPrice, zone: this.selectedZone });
      this.setOpen(false);
  }
}