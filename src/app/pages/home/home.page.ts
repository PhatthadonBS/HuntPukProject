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

  // ✅ [เพิ่ม] ตัวแปรสำหรับเก็บข้อมูลหอพักที่จะโชว์ด้านขวา (Side Panel)
  selectedDormDetail: Dormitory | null = null;

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
    this.fetchDorms();
  }

  ionViewDidEnter() {
    const backdrops = document.querySelectorAll('ion-backdrop');
    backdrops.forEach(element => element.remove());
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
    if (typeof text !== 'string') text = text.target.value;
    this.searchText = text;
    
    if(this.searchText.trim() !== '') {
        try {
          const res = await this.dormService.searchDorms(this.searchText);
          if(res.success && res.data) {
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

  // ✅ [แก้ไข] ไม่ให้เปลี่ยนหน้า แต่ให้เปิด Side Panel แทน
  goToDetail() { 
    if (this.selectedDorm) {
      console.log('Open Side Panel:', this.selectedDorm);
      // ส่งข้อมูลเข้าตัวแปรนี้ เพื่อให้ HTML ฝั่งขวาแสดงผล
      this.selectedDormDetail = this.selectedDorm;
      
      // (ตัวเลือก) ปิด InfoWindow เล็กๆ บนแผนที่ เพื่อความสะอาดตา
      if (this.infoWindow) this.infoWindow.close();
    }
  }

  // ✅ [เพิ่ม] ฟังก์ชันสำหรับปุ่มกากบาท เพื่อปิดหน้าต่างขวา
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