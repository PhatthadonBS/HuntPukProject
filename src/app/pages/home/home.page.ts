import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, MenuController, ViewDidEnter } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient, HttpClientJsonpModule } from '@angular/common/http';

import {
  GoogleMapsModule,
  GoogleMap,
  MapInfoWindow,
  MapMarker,
  MapCircle,
  MapDirectionsRenderer,
} from '@angular/google-maps';

import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HeaderComponent } from '../../components/header/header.component';
import { DormitoryService, Dormitory } from '../../services/dormitory';
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import { DormDetailPage } from '../dorm-detail/dorm-detail.page';

import {
  menuOutline, caretDownOutline, layersOutline, close,
  locationOutline, checkmarkCircle, chevronDownCircleOutline,
  callOutline, chatbubbleEllipsesOutline, logoFacebook,
  logoInstagram, paperPlaneOutline, optionsOutline,
  navigateCircleOutline, timeOutline, walkOutline, carOutline,
  locate, navigate, createOutline, star, lockClosedOutline,
  bedOutline, checkmarkCircleOutline, locationSharp, chevronForwardOutline,listOutline,starOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonicModule, RouterModule,
    HttpClientModule, HttpClientJsonpModule, GoogleMapsModule,
    HeaderComponent, DormDetailPage, MapDirectionsRenderer,
  ],
})
export class HomePage implements OnInit, ViewDidEnter {
  apiLoaded: Observable<boolean>;
  @ViewChild('mapRef') googleMapComponent!: GoogleMap;
  // 🗺️ แผนที่
  center: google.maps.LatLngLiteral = { lat: 16.246, lng: 103.252 };
  zoom = 15; 
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false, zoomControl: false, mapTypeControl: false,
    streetViewControl: false, fullscreenControl: false,
  };

  // 🔍 ระบบ Filter ค้นหา
  searchText: string = '';
  dorms: Dormitory[] = [];
  allDorms: Dormitory[] = [];
  isModalOpen = false;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  selectedZone: string = '';
  maxDistance: number | null = null;
  zoneOptions: any[] = [];

  // 🏢 ข้อมูลหอพัก และ Side Panel
  selectedDormDetail: Dormitory | null = null;
  selectedDorm: any = null;
  currentUser: any = null;
  nearbyDorms: any[] = [];  // หอพักใกล้เคียง 1 กม.
  
  // ✅ สถานะสำหรับแท็บใน Side Panel
  sidePanelTab: 'info' | 'reviews' = 'info';
  reviews: any[] = [];
  isLoadingReviews: boolean = false;

  // ⭕ จุดอ้างอิงและวงกลม
  circleCenter: google.maps.LatLngLiteral | undefined;
  circleRadius: number = 0;
  circleOptions: google.maps.CircleOptions = {
    fillColor: '#FFD600', fillOpacity: 0.2, strokeColor: '#FFD600',
    strokeOpacity: 0.8, strokeWeight: 2, clickable: false,
  };
  referencePoint: google.maps.LatLngLiteral = { lat: 16.246, lng: 103.252 };

  // 🧭 ระบบนำทาง (แยกเดิน / ขับรถ / เส้นทางสำรอง)
  directionsService: google.maps.DirectionsService | undefined;
  directionsResult: google.maps.DirectionsResult | undefined;
  
  walkingTime = '-';
  walkingDistance = '-';
  drivingTime = '-';
  drivingDistance = '-';
  possibleRoutesCount = 0;
  activeTravelMode: 'WALKING' | 'DRIVING' = 'DRIVING';

  mainRouteOptions: google.maps.DirectionsRendererOptions = {
    suppressMarkers: true,
    polylineOptions: { strokeColor: '#ff4d4d', strokeOpacity: 0.9, strokeWeight: 6, zIndex: 5 }
  };
  altRouteRenderers: google.maps.DirectionsResult[] = []; 

  @ViewChild(MapInfoWindow) infoWindow: MapInfoWindow | undefined;

  constructor(
    private router: Router,
    private dormService: DormitoryService,
    private httpClient: HttpClient,
    private menuCtrl: MenuController, 
    private cdr: ChangeDetectorRef,
  ) {
    // ✅ ลงทะเบียนไอคอนใหม่ทั้งหมด
    addIcons({
      'menu-outline': menuOutline, 'caret-down-outline': caretDownOutline, 'layers-outline': layersOutline,
      'close': close, 'location-outline': locationOutline, 'checkmark-circle': checkmarkCircle,
      'chevron-down-circle-outline': chevronDownCircleOutline, 'call-outline': callOutline,
      'chatbubble-ellipses-outline': chatbubbleEllipsesOutline, 'logo-facebook': logoFacebook,
      'logo-instagram': logoInstagram, 'paper-plane-outline': paperPlaneOutline,
      'options-outline': optionsOutline, 'navigate-circle-outline': navigateCircleOutline,
      'time-outline': timeOutline, 'walk-outline': walkOutline, 'car-outline': carOutline,
      'locate': locate, 'navigate': navigate, 'create-outline': createOutline, 'star': star,
      'lock-closed-outline': lockClosedOutline, 'bed-outline': bedOutline,
      'checkmark-circle-outline': checkmarkCircleOutline, 'location-sharp': locationSharp,
      'chevron-forward-outline': chevronForwardOutline,'list-outline': listOutline,'star-outline': starOutline
    });

    if (typeof google === 'object' && typeof google.maps === 'object') {
      this.apiLoaded = of(true);
    } else {
      this.apiLoaded = this.httpClient
        .jsonp(`https://maps.googleapis.com/maps/api/js?key=${environment.GGMAPI}`, 'callback')
        .pipe(
          map(() => true),
          catchError((err) => {
            console.error('Map Load Error:', err);
            return of(false);
          }),
        );
    }
  }

  ngOnInit() {
    this.fetchDorms();
    this.fetchZones();
    this.checkLoginStatus();
  }

  ionViewDidEnter() {
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

  openMenu() {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  }

  focusRouteOnMap() {
    if (this.directionsResult && this.googleMapComponent && this.directionsResult.routes.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      const route = this.directionsResult.routes[0];
      
      route?.legs?.forEach(leg => {
        if (leg.start_location) bounds.extend(leg.start_location);
        if (leg.end_location) bounds.extend(leg.end_location);
      });
      
      // สั่งให้แผนที่ซูมพอดีกับกรอบที่เราวาด
      this.googleMapComponent.fitBounds(bounds);
      
      // ถอยการซูมออกมานิดนึงเผื่อชนขอบจอ
      setTimeout(() => {
        const currentZoom = this.googleMapComponent.getZoom();
        if (currentZoom) this.googleMapComponent.options = { ...this.mapOptions, zoom: currentZoom - 1 };
      }, 100);
    }
  }

  // ✅ ระบบดึงตำแหน่งปัจจุบัน (GPS)
  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newPos: google.maps.LatLngLiteral = { lat, lng };

          this.referencePoint = newPos;
          this.center = newPos;
          this.zoom = 15;
          // วงกลมแสดงรอบตำแหน่งของเรา (ถ้าไม่ได้เลือกหอพักอยู่)
          if (!this.selectedDorm) {
            this.circleCenter = newPos;
            this.circleRadius = 1000;
          }

          this.directionsResult = undefined;
          this.altRouteRenderers = [];

          // ✅ บังคับให้แผนที่เลื่อนมาที่ตำแหน่งจริง ไม่รอ binding
          if (this.googleMapComponent?.googleMap) {
            this.googleMapComponent.googleMap.panTo(newPos);
            this.googleMapComponent.googleMap.setZoom(15);
          }

          this.cdr.detectChanges();

          if (this.selectedDorm) {
            this.calculateAllTravelModes(this.selectedDorm.lat, this.selectedDorm.lng);
          }
        },
        (error) => {
          console.error('Error getting location', error);
          alert('กรุณาเปิดอนุญาตให้เบราว์เซอร์เข้าถึงตำแหน่งของคุณ (Allow Location)');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('เบราว์เซอร์นี้ไม่รองรับการดึงตำแหน่ง (GPS)');
    }
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    // ปิดการสร้างจุดสีฟ้าจากการคลิกแผนที่แบบมั่วซั่วตามที่คุณขอ
    if (this.infoWindow) this.infoWindow.close();
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
        this.allDorms = res.data.map((d) => ({ ...d, lat: Number(d.lat), lng: Number(d.lng) }));
        this.dorms = [...this.allDorms];
      }
    } catch (err) { console.error('Fetch Dorms Error:', err); }
  }

  onSearch(text: any) {
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
        this.searchText, this.selectedZone, this.minPrice || undefined, this.maxPrice || undefined
      );

      if (res.success && res.data) {
        let tempDorms = res.data.map((d) => ({ ...d, lat: Number(d.lat), lng: Number(d.lng) }));

        if (this.maxDistance) {
          tempDorms = tempDorms.filter((dorm) => {
            const distKm = this.calculateDistance(this.referencePoint.lat, this.referencePoint.lng, dorm.lat, dorm.lng);
            return distKm <= this.maxDistance!;
          });
        }
        this.dorms = tempDorms;

        if (this.dorms.length > 0) {
          if (!this.maxDistance) {
            const firstDorm = this.dorms[0];
            if (firstDorm) this.center = { lat: firstDorm.lat, lng: firstDorm.lng };
          }
          this.zoom = 15; 
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
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg: number): number { return deg * (Math.PI / 180); }

// ✅ เมื่อคลิกหมุดหอพักบนแผนที่ (เปิด Side Panel) ปรับให้ลื่นไหล ไม่ค้าง
  openInfoWindow(marker: MapMarker, dorm: Dormitory) {
    // 1. โชว์ข้อมูลเบื้องต้นทันที (แผงจะสไลด์ขึ้นมาแบบไม่กระตุก)
    this.selectedDorm = { ...dorm };
    this.center = { lat: dorm.lat, lng: dorm.lng };
    this.zoom = 16;
    this.circleCenter = { lat: dorm.lat, lng: dorm.lng };
    this.circleRadius = 1000; // 1 กม.

    this.sidePanelTab = 'info';
    this.reviews = [];
    this.nearbyDorms = [];

    // คำนวณหอพักใกล้เคียงภายใน 1 กม. (คำนวณเร็ว ทำก่อนได้เลย)
    this.nearbyDorms = this.allDorms
      .filter(d => {
        if (d.DORM_ID === dorm.DORM_ID) return false;
        const dist = this.calculateDistance(dorm.lat, dorm.lng, d.lat, d.lng);
        return dist <= 1;
      })
      .slice(0, 5); // แสดงสูงสุด 5 รายการ

    this.cdr.detectChanges(); // สั่งให้อัปเดต UI ทันที แผงจะเด้งขึ้นมาทันที

    // 2. หน่วงเวลา 350ms รอให้ Animation แผงสไลด์เด้งเสร็จก่อน ค่อยดึงข้อมูลหนักๆ
    setTimeout(async () => {
      // ดึงข้อมูลเชิงลึก (ห้อง / สิ่งอำนวยความสะดวก / ข้อมูลเจ้าของ)
      try {
        const res = await this.dormService.getDormById(dorm.DORM_ID);
        if (res.success && res.data) {
          this.selectedDorm = { ...this.selectedDorm, ...res.data };
          this.cdr.detectChanges(); // อัปเดตข้อมูลอีกรอบเมื่อโหลดเสร็จ (เช่น โชว์เบอร์โทร)
        }
      } catch (e) { 
        console.error('Fetch pop-up detail error: ', e); 
      }

      // คำนวณเส้นทาง (Google Maps API)
      this.calculateAllTravelModes(dorm.lat, dorm.lng);
      
      // ดึงรีวิว
      this.loadReviews(dorm.DORM_ID);
    }, 350);
  }

  // เลือกหอพักใกล้เคียง
  selectNearbyDorm(dorm: any) {
    this.openInfoWindow(null as any, dorm);
  }

  // คืนค่าระยะทางเป็น text เมตร/กม.
  getDistanceText(dorm: any): string {
    if (!this.selectedDorm) return '';
    const dist = this.calculateDistance(
      this.selectedDorm.lat, this.selectedDorm.lng, dorm.lat, dorm.lng
    );
    return dist < 1 ? `${Math.round(dist * 1000)} ม.` : `${dist.toFixed(1)} กม.`;
  }

  // ✅ โหลดรีวิวผู้เช่ามาแสดงใน Side Panel
  async loadReviews(dormId: number) {
    this.isLoadingReviews = true;
    try {
      const res = await this.dormService.getReviewsByDormId(dormId);
      if (res && res.data) {
        this.reviews = res.data;
      } else {
        this.reviews = [];
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      this.reviews = [];
    } finally {
      this.isLoadingReviews = false;
      this.cdr.detectChanges();
    }
  }

  // 🧭 คำนวณเส้นทางทั้งเดินและขับรถ
  calculateAllTravelModes(destLat: number, destLng: number) {
    if (!this.directionsService) {
      this.directionsService = new google.maps.DirectionsService();
    }
    const origin = this.referencePoint;
    const destination = { lat: destLat, lng: destLng };

    // 🚶 โหมดเดิน
    this.directionsService.route({
      origin, destination, travelMode: google.maps.TravelMode.WALKING
    }, (res, status) => {
      if (status === google.maps.DirectionsStatus.OK && res) {
        this.walkingTime = res.routes[0]?.legs[0]?.duration?.text || '-';
        this.walkingDistance = res.routes[0]?.legs[0]?.distance?.text || '-';
        if (this.activeTravelMode === 'WALKING') this.renderRoutesOnMap(res);
      }
    });

    // 🚗 โหมดขับรถ
    this.directionsService.route({
      origin, destination, travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: true
    }, (res, status) => {
      if (status === google.maps.DirectionsStatus.OK && res) {
        this.drivingTime = res.routes[0]?.legs[0]?.duration?.text || '-';
        this.drivingDistance = res.routes[0]?.legs[0]?.distance?.text || '-';
        this.possibleRoutesCount = res.routes.length;
        if (this.activeTravelMode === 'DRIVING') this.renderRoutesOnMap(res);
      }
    });
  }

  renderRoutesOnMap(result: google.maps.DirectionsResult) {
    this.directionsResult = result;
    this.altRouteRenderers = [];

    if (result.routes.length > 1) {
      for (let i = 1; i < result.routes.length; i++) {
        const altResult = { 
          ...result, 
          routes: [result.routes[i]] 
        } as google.maps.DirectionsResult;
        
        this.altRouteRenderers.push(altResult);
      }
    }
    this.cdr.detectChanges();
  }

  changeTravelMode(mode: 'WALKING' | 'DRIVING') {
    this.activeTravelMode = mode;
    if (this.selectedDorm) {
      this.calculateAllTravelModes(this.selectedDorm.lat, this.selectedDorm.lng);
    }
  }

  getAltRouteOptions() {
    return {
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#a4b0be', strokeOpacity: 0.7, strokeWeight: 4, zIndex: 2 }
    };
  }

  closeDetailPanel() { 
    this.selectedDorm = null;
    this.directionsResult = undefined;
    this.altRouteRenderers = [];
    this.nearbyDorms = [];
  }

  goToDetail() {
    if (this.selectedDorm) {
      const dormId = this.selectedDorm.DORM_ID || this.selectedDorm.id;
      if (dormId) {
        this.router.navigate(['/dorm-detail', dormId]);
      } else {
        console.error('goToDetail: ไม่พบ DORM_ID ใน selectedDorm', this.selectedDorm);
      }
    }
  }

  goToLogin() { this.router.navigate(['/login']); }

  goToCompare() { this.router.navigate(['/compare']); }
  setOpen(isOpen: boolean) { this.isModalOpen = isOpen; }
  openFilter() { this.setOpen(true); }
  selectZone(zoneName: string) { this.selectedZone = this.selectedZone === zoneName ? '' : zoneName; }
}