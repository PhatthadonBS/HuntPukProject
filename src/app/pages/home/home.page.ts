import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, MenuController, ViewDidEnter } from '@ionic/angular'; // ✅ เพิ่ม ViewDidEnter
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient, HttpClientJsonpModule } from '@angular/common/http';
import { GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HeaderComponent } from '../../components/header/header.component';
import { DormitoryService, Dormitory } from '../../services/dormitory'; 
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
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
    HttpClientModule, HttpClientJsonpModule, GoogleMapsModule, HeaderComponent
  ]
})
export class HomePage implements OnInit, ViewDidEnter { // ✅ เพิ่ม implements ViewDidEnter
  
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

  @ViewChild(MapInfoWindow) infoWindow: MapInfoWindow | undefined;
  selectedDorm: Dormitory | undefined;

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
    this.menuCtrl.enable(true, 'home-menu');
    this.fetchDorms();
  }

  // 🔥🔥🔥 ไม้ตาย: สั่งลบม่านดำทิ้งทันทีเมื่อเข้าหน้านี้ 🔥🔥🔥
  ionViewDidEnter() {
    console.log('🚀 กำลังบังคับลบม่านดำ (Backdrop)...');

    // 1. สร้าง Style tag บังคับซ่อน Backdrop
    const style = document.createElement('style');
    style.innerHTML = `
      ion-backdrop {
        display: none !important;
        opacity: 0 !important;
        z-index: -9999 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);

    // 2. หา Element แล้วลบทิ้งเลย
    const backdrops = document.querySelectorAll('ion-backdrop');
    backdrops.forEach(element => {
      element.remove();
    });
    
    console.log(`✅ ลบ Backdrop ไปแล้ว ${backdrops.length} ตัว`);
  }

  async toggleMenu() {
    console.log('Toggling menu...');
    await this.menuCtrl.enable(true, 'home-menu');
    await this.menuCtrl.toggle('home-menu');
  }

  async navigateTo(path: string) {
    await this.menuCtrl.close('home-menu'); 
    this.router.navigate([path]);
  }

  async fetchDorms() {
    try {
      const res = await this.dormService.getAllDorms();
      if (res.success) {
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
    if (typeof text !== 'string') text = text.target.value;
    this.searchText = text;
    
    if(this.searchText.trim() !== '') {
        try {
          const res = await this.dormService.searchDorms(this.searchText);
          if(res.success) {
              this.dorms = res.data;
              const firstDorm = this.dorms[0];
              if(firstDorm && firstDorm.lat && firstDorm.lng) {
                  this.center = { lat: firstDorm.lat, lng: firstDorm.lng };
                  this.zoom = 16; 
              }
          }
        } catch (err) {
          console.error('Search Error:', err);
        }
    } else { 
      this.fetchDorms(); 
    }
  }

  openInfoWindow(marker: MapMarker, dorm: Dormitory) {
    this.selectedDorm = dorm;
    if (this.infoWindow) this.infoWindow.open(marker);
  }

  goToDetail() { if (this.selectedDorm) this.router.navigate(['/dorms', this.selectedDorm.DORM_ID]); }
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