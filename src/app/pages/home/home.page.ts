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
  funnelOutline, layersOutline, close, caretDown, caretDownOutline, 
  chevronDown, chevronDownCircleOutline, checkmarkCircle 
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
  
  // พิกัดเริ่มต้น (ม.สารคาม)
  center: google.maps.LatLngLiteral = { lat: 16.246, lng: 103.252 };
  zoom = 14;
  
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false, zoomControl: false, mapTypeControl: false, 
    streetViewControl: false, fullscreenControl: false
  };

  searchText: string = '';
  dorms: Dormitory[] = []; 
  isModalOpen = false;

  // ตัวแปรสำหรับ Filter
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
    private menuCtrl: MenuController
  ) {
    addIcons({
      'menu-outline': menuOutline, home, 'list-outline': listOutline,
      'person-circle-outline': personCircleOutline, search,
      'funnel-outline': funnelOutline, 'layers-outline': layersOutline,
      'close': close, 'caret-down': caretDown, 'caret-down-outline': caretDownOutline,
      'chevron-down': chevronDown, 'chevron-down-circle-outline': chevronDownCircleOutline,
      'checkmark-circle': checkmarkCircle
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
    this.fetchZones(); 
    this.checkLoginStatus(); 
  }

  ionViewDidEnter() {
    const backdrops = document.querySelectorAll('ion-backdrop');
    backdrops.forEach(element => element.remove());
    this.checkLoginStatus(); 
  }

  checkLoginStatus() {
    const storedData = localStorage.getItem('loggedIn');
    if (storedData) {
      try {
        const userObj = JSON.parse(storedData);
        const isRoleValid = (userObj.role_id === 1 || userObj.role_id === 2);
        const isStatusValid = (userObj.accout_status === 0);
        if (isRoleValid && isStatusValid) {
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

  async toggleMenu() {
    await this.menuCtrl.enable(true, 'main-menu');
    await this.menuCtrl.toggle('main-menu');
  }

  async navigateTo(path: string) {
    await this.menuCtrl.close('home-menu'); 
    this.router.navigate([path]);
  }

  // โหลดหอพักทั้งหมด (ค่าเริ่มต้น)
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

  // ✅ ฟังก์ชันค้นหาหลัก (รับ Search Text จาก Header)
  async onSearch(text: any) {
    const searchValue = (typeof text === 'string' ? text : text?.target?.value || '').trim();
    this.searchText = searchValue;

    // ถ้าช่องค้นหาว่าง และไม่มีการกรองโซน/ราคา ให้โหลดทั้งหมด
    if (searchValue === '' && !this.selectedZone && !this.minPrice && !this.maxPrice) {
        this.fetchDorms(); 
        this.zoom = 14; 
        return;
    }

    // เรียกฟังก์ชันกลาง
    this.performSearch();
  }

  // ✅ ฟังก์ชัน Apply Filter (กดปุ่มยืนยันใน Modal)
  applyFilter() {
      console.log('Filter Data:', { minPrice: this.minPrice, maxPrice: this.maxPrice, zone: this.selectedZone });
      this.setOpen(false);
      this.performSearch(); // เรียกฟังก์ชันกลางเพื่อค้นหาและซูม
  }

  // ✅ ฟังก์ชันกลางสำหรับการค้นหาและซูมแผนที่
  async performSearch() {
      try {
          // ส่งค่าทุกอย่างไปที่ Service
          const res = await this.dormService.searchDorms(
              this.searchText, 
              this.selectedZone, 
              this.minPrice || undefined, 
              this.maxPrice || undefined
          );
          
          if (res.success && res.data) {
              console.log('Found:', res.data.length);
              this.dorms = res.data;
              
              // แปลงพิกัด
              this.dorms.forEach(d => {
                 d.lat = Number(d.lat);
                 d.lng = Number(d.lng);
              });

              // ✅ LOGIC ย้ายแผนที่ (Re-center) ไปหาจุดแรกที่เจอ
              if (this.dorms.length > 0) {
                  const target = this.dorms[0];
                  if (target && target.lat && target.lng) {
                      // สร้าง Object ใหม่เพื่อให้ Map รู้ว่าค่าเปลี่ยน
                      this.center = { 
                          lat: target.lat, 
                          lng: target.lng 
                      };
                      // ปรับ Zoom: ถ้าน้อยกว่า 3 แห่งให้ซูมใกล้, ถ้าเยอะให้ซูมห่าง
                      this.zoom = this.dorms.length < 3 ? 16 : 14; 
                  }
              } else {
                  console.log('No dorms match criteria');
                  // อาจจะใส่ Alert แจ้งเตือนว่าไม่พบข้อมูลก็ได้
              }
          } else {
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

  closeDetailPanel() {
    this.selectedDormDetail = null;
  }

  goToLogin() { this.router.navigate(['/login']); }
  goToCompare() { this.router.navigate(['/compare']); }
  
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