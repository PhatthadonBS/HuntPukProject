import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, MenuController, ViewDidEnter, ToastController, AlertController } from '@ionic/angular';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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
import { WelcomeModalComponent } from '../../components/welcome-modal/welcome-modal.component';

import {
  menuOutline, caretDownOutline, layersOutline, close,
  locationOutline, checkmarkCircle, chevronDownCircleOutline,
  call, chatbubbleEllipsesOutline, logoFacebook,
  logoInstagram, paperPlaneOutline, optionsOutline,
  navigateCircleOutline, timeOutline, walkOutline, carOutline,
  locate, navigate, createOutline, star, lockClosedOutline,
  bedOutline, checkmarkCircleOutline, locationSharp, chevronForwardOutline,
  listOutline, starOutline, arrowForwardOutline, gitBranchOutline, logoTwitter, chatbubblesOutline, location, closeCircle,
  personCircleOutline, alertCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonicModule, RouterModule,
    HttpClientModule, HttpClientJsonpModule, GoogleMapsModule,
    HeaderComponent, DormDetailPage, MapDirectionsRenderer, MapCircle, MapMarker, MapInfoWindow,
    WelcomeModalComponent,
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
  minScore: number | null = null;
  maxWater: number | null = null;
  maxElect: number | null = null;

  // 🏢 ข้อมูลหอพัก และ Side Panel
  selectedDormDetail: Dormitory | null = null;
  selectedDorm: any = null;
  currentUser: any = null;
  nearbyDorms: any[] = [];  
  
  sidePanelTab: 'info' | 'reviews' = 'info';
  reviews: any[] = [];
  isLoadingReviews: boolean = false;
  isPanelMinimized: boolean = false;

  // ⭕ จุดอ้างอิงและวงกลม
  circleCenter: google.maps.LatLngLiteral | undefined = undefined;
  circleRadius: number = 0;
  circleOptions: google.maps.CircleOptions = {
    fillColor: '#FFD600', fillOpacity: 0.2, strokeColor: '#FFD600',
    strokeOpacity: 0.8, strokeWeight: 2, clickable: false,
  };
  referencePoint: google.maps.LatLngLiteral = { lat: 16.246, lng: 103.252 };
  userLocationGranted: boolean = false;

  // 🧭 ระบบนำทาง
  directionsService: google.maps.DirectionsService | undefined;
  directionsResult: google.maps.DirectionsResult | undefined = undefined;
  
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

  // 🎉 Welcome Modal
  showWelcomeModal = false;

  // 🔵 วงกลมครอบโซน
  zoneCircleCenter: google.maps.LatLngLiteral | undefined = undefined;
  zoneCircleRadius: number = 0;
  
  // 🌟 แก้ไข: เอา strokeDashArray ออก เพื่อล้าง Error
  zoneCircleOptions: google.maps.CircleOptions = {
    fillColor: '#2196F3', fillOpacity: 0.08,
    strokeColor: '#2196F3', strokeOpacity: 0.6,
    strokeWeight: 2,
    clickable: false,
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dormService: DormitoryService,
    private httpClient: HttpClient,
    private menuCtrl: MenuController, 
    private cdr: ChangeDetectorRef,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController 
  ) {
    addIcons({
      'menu-outline': menuOutline, 'caret-down-outline': caretDownOutline, 'layers-outline': layersOutline, 'close': close, 'close-circle': closeCircle, 'location': location, 'location-outline': locationOutline, 'location-sharp': locationSharp, 'checkmark-circle': checkmarkCircle, 'checkmark-circle-outline': checkmarkCircleOutline, 'chevron-down-circle-outline': chevronDownCircleOutline, 'chevron-forward-outline': chevronForwardOutline, 'call': call, 'chatbubbles-outline': chatbubblesOutline, 'chatbubble-ellipses-outline': chatbubbleEllipsesOutline, 'logo-facebook': logoFacebook, 'logo-instagram': logoInstagram, 'logo-twitter': logoTwitter, 'paper-plane-outline': paperPlaneOutline, 'options-outline': optionsOutline, 'navigate-circle-outline': navigateCircleOutline, 'time-outline': timeOutline, 'walk-outline': walkOutline, 'car-outline': carOutline, 'locate': locate, 'navigate': navigate, 'create-outline': createOutline, 'star': star, 'star-outline': starOutline, 'lock-closed-outline': lockClosedOutline, 'bed-outline': bedOutline, 'list-outline': listOutline, 'arrow-forward-outline': arrowForwardOutline, 'git-branch-outline': gitBranchOutline, 'person-circle-outline': personCircleOutline, 'alert-circle-outline': alertCircleOutline 
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
    this.checkLoginStatus();
    this.fetchZones();
    
    this.fetchDorms().then(() => {
      this.checkForNavigationIntent();
    });

    this.getCurrentLocation(true);
  }

  ionViewDidEnter() {
    const storedData = localStorage.getItem('loggedIn');
    if (storedData) {
      try {
        const userObj = JSON.parse(storedData);
        if ((userObj.id || userObj.USER_ID) && userObj.accout_status === 0) {
          this.currentUser = userObj.user ? userObj.user : userObj;
          this.cdr.detectChanges();
        }
      } catch (e) {}
    }
  }

  checkLoginStatus() {
    const storedData = localStorage.getItem('loggedIn');
    if (storedData) {
      try {
        const userObj = JSON.parse(storedData);
        if ((userObj.id || userObj.USER_ID) && userObj.accout_status === 0) {
          this.currentUser = userObj.user ? userObj.user : userObj;

          if (userObj.showWelcome === true) {
            userObj.showWelcome = false;
            localStorage.setItem('loggedIn', JSON.stringify(userObj));
            setTimeout(() => {
              this.showWelcomeModal = true;
              this.cdr.detectChanges();
            }, 200);
          }
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

  checkForNavigationIntent() {
    this.route.queryParams.subscribe(params => {
      if (params['navLat'] && params['navLng'] && params['dormId']) {
        const dId = Number(params['dormId']);
        const targetDorm = this.allDorms.find(d => d.DORM_ID === dId || d.id === dId);
        
        if (targetDorm) {
          setTimeout(() => {
            this.openInfoWindow(null as any, targetDorm);
            if (!this.userLocationGranted) {
               this.getCurrentLocation(false); 
            }
          }, 800);
        }
      }
    });
  }

  getCurrentLocation(isSilent = false) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocationGranted = true;
          const newPos: google.maps.LatLngLiteral = { lat: position.coords.latitude, lng: position.coords.longitude };
          this.referencePoint = newPos;
          this.center = newPos;
          this.zoom = 15;
          if (!this.selectedDorm) {
            this.circleCenter = newPos;
            this.circleRadius = 1000;
          }
          
          this.directionsResult = undefined;
          this.altRouteRenderers = [];

          if (this.googleMapComponent?.googleMap) {
            this.googleMapComponent.googleMap.panTo(newPos);
            this.googleMapComponent.googleMap.setZoom(15);
          }
          this.cdr.detectChanges();
          
          if (this.selectedDorm) {
            this.calculateActiveTravelMode(this.selectedDorm.lat, this.selectedDorm.lng);
          }
          
          if (!isSilent) this.showToast('ดึงตำแหน่งปัจจุบันสำเร็จ', 'success', 'location-outline');
        },
        (error) => { 
          this.userLocationGranted = false;
          if (!isSilent) this.showLocationAlert(); 
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else { 
      if (!isSilent) this.showToast('เบราว์เซอร์นี้ไม่รองรับการดึงตำแหน่ง (GPS)', 'danger', 'alert-circle-outline'); 
    }
  }

  async showLocationAlert() {
    const alert = await this.alertCtrl.create({
      header: 'ต้องการเปิด GPS',
      message: 'เพื่อประสบการณ์ที่ดีที่สุดในการคำนวณเส้นทางและค้นหาหอพักใกล้เคียง กรุณาอนุญาตการเข้าถึงตำแหน่งของอุปกรณ์ด้วยครับ',
      buttons: ['รับทราบ']
    });
    await alert.present();
  }

  async showToast(msg: string, color: string, icon: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      color: color,
      duration: 3000,
      position: 'top', 
      icon: icon
    });
    toast.present();
  }

  openMenu() { window.dispatchEvent(new CustomEvent('toggle-sidebar')); }

  onMapClick(event: google.maps.MapMouseEvent) { if (this.infoWindow) this.infoWindow.close(); }

  async fetchZones() {
    try { const res = await this.dormService.getZones(); if (res.success) this.zoneOptions = res.data; } 
    catch (error) { console.error('Fetch Zones Error:', error); }
  }

  async fetchDorms() {
    try {
      const res = await this.dormService.getAllDorms();
      if (res.success && res.data) {
        this.allDorms = res.data.map((d: any) => ({ ...d, lat: Number(d.lat), lng: Number(d.lng) })) as any[];        
        this.dorms = [...this.allDorms];
      }
    } catch (err) { console.error('Fetch Dorms Error:', err); }
  }

  onSearch(text: any) {
    const searchValue = (typeof text === 'string' ? text : text?.target?.value || '').trim();
    this.searchText = searchValue;
    this.performSearch();
  }

  applyFilter() { this.setOpen(false); this.performSearch(); }

  async performSearch() {
    try {
      const res = await this.dormService.searchDorms(this.searchText, this.selectedZone, this.minPrice || undefined, this.maxPrice || undefined);
      if (res.success && res.data) {
        let tempDorms = res.data.map((d: any) => ({ ...d, lat: Number(d.lat), lng: Number(d.lng) })) as any[];
        
        if (this.selectedZone) {
          const targetZone = this.zoneOptions.find(z => z.ZONE_NAME === this.selectedZone);
          if (targetZone && targetZone.lat && targetZone.lng) {
            const newCenter = { lat: Number(targetZone.lat), lng: Number(targetZone.lng) };
            this.referencePoint = newCenter;
            this.center = newCenter;
            this.zoom = 14;
            if (this.googleMapComponent?.googleMap) {
              this.googleMapComponent.googleMap.panTo(newCenter);
              this.googleMapComponent.googleMap.setZoom(14);
            }

            const dormsInZone = tempDorms;
            if (dormsInZone.length > 0) {
              const maxDist = Math.max(...dormsInZone.map((d: any) =>
                this.calculateDistance(newCenter.lat, newCenter.lng, d.lat, d.lng) * 1000
              ));
              this.zoneCircleCenter = newCenter;
              this.zoneCircleRadius = Math.max(maxDist + 300, 800); 
            } else {
              this.zoneCircleCenter = newCenter;
              this.zoneCircleRadius = 1000;
            }
          }
        } else {
          this.zoneCircleCenter = undefined;
          this.zoneCircleRadius = 0;
        }

        if (this.maxDistance) {
          this.circleCenter = this.referencePoint;
          this.circleRadius = this.maxDistance * 1000;
          tempDorms = tempDorms.filter((dorm: any) =>
            this.calculateDistance(this.referencePoint.lat, this.referencePoint.lng, dorm.lat, dorm.lng) <= this.maxDistance!
          );
        } else {
          this.circleCenter = undefined;
        }

        if (this.minScore) tempDorms = tempDorms.filter((dorm: any) => dorm.SCORE >= this.minScore!);
        if (this.maxWater) tempDorms = tempDorms.filter((dorm: any) => dorm.WATER_UNIT <= this.maxWater! || dorm.WATER_LUMP <= this.maxWater!);
        if (this.maxElect) tempDorms = tempDorms.filter((dorm: any) => dorm.ELECT_UNIT <= this.maxElect!);

        this.dorms = tempDorms as any[];

        if (!this.selectedZone && this.dorms.length > 0) {
          if (!this.maxDistance) {
            const firstDorm = this.dorms[0];
            if (firstDorm) this.center = { lat: firstDorm.lat, lng: firstDorm.lng };
          }
          this.zoom = 15;
          if (this.googleMapComponent?.googleMap) {
            this.googleMapComponent.googleMap.panTo(this.center);
            this.googleMapComponent.googleMap.setZoom(15);
          }
        }
      } else {
        this.dorms = [];
        this.circleCenter = undefined;
        this.zoneCircleCenter = undefined;
      }
    } catch (err) { console.error('Search Error:', err); }
  }

  getDormMinPrice(dorm: any): number {
    if (!dorm) return 0;
    return Number(dorm.start_price || dorm.START_PRICE || 0);
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

  togglePanelSize() {
    this.isPanelMinimized = !this.isPanelMinimized;
  }

  openInfoWindow(marker: MapMarker, dorm: any) {
    this.selectedDorm = { ...dorm };
    this.sidePanelTab = 'info';
    this.isPanelMinimized = false; 
    
    if (this.googleMapComponent?.googleMap) {
      this.googleMapComponent.googleMap.panTo({ lat: dorm.lat, lng: dorm.lng });
      this.googleMapComponent.googleMap.setZoom(16);
      setTimeout(() => {
        this.googleMapComponent?.googleMap?.panBy(0, 150); 
      }, 300);
    } else {
      this.center = { lat: dorm.lat, lng: dorm.lng };
      this.zoom = 16;
    }

    this.circleCenter = { lat: dorm.lat, lng: dorm.lng };
    this.circleRadius = 1000;
    this.directionsResult = undefined;
    this.altRouteRenderers = [];
    this.walkingTime = '-';
    this.walkingDistance = '-';
    this.drivingTime = '-';
    this.drivingDistance = '-';

    this.nearbyDorms = this.allDorms.filter((d: any) => Number(d.DORM_ID) !== Number(dorm.DORM_ID) && this.calculateDistance(dorm.lat, dorm.lng, d.lat, d.lng) <= 1).slice(0, 5);
    this.cdr.detectChanges(); 

    setTimeout(async () => {
      try {
        const res = await this.dormService.getDormById(dorm.DORM_ID);
        if (res.success && res.data) {
          this.selectedDorm = { ...this.selectedDorm, ...res.data };
          this.cdr.detectChanges();
        }
      } catch (e) { console.error(e); }

      const dist = this.calculateDistance(this.referencePoint.lat, this.referencePoint.lng, dorm.lat, dorm.lng);
      if (dist <= 15) {
        this.calculateActiveTravelMode(dorm.lat, dorm.lng);
      } else {
        this.drivingTime = 'ระยะทางไกลเกินไป';
        this.drivingDistance = `> ${dist.toFixed(0)} กม.`;
        this.walkingTime = 'ระยะทางไกลเกินไป';
        this.walkingDistance = `> ${dist.toFixed(0)} กม.`;
      }
      this.loadReviews(dorm.DORM_ID);
    }, 300); 
  }

  closeDetailPanel() { 
    this.selectedDorm = null; 
    this.isPanelMinimized = false; 
    this.directionsResult = undefined; 
    this.altRouteRenderers = []; 
    this.nearbyDorms = [];
    this.router.navigate([], { queryParams: {} });
  }

  selectNearbyDorm(dorm: any) { this.openInfoWindow(null as any, dorm); }

  getDistanceText(dorm: any): string {
    if (!this.selectedDorm) return '';
    const dist = this.calculateDistance(this.selectedDorm.lat, this.selectedDorm.lng, dorm.lat, dorm.lng);
    return dist < 1 ? `${Math.round(dist * 1000)} ม.` : `${dist.toFixed(1)} กม.`;
  }

  async loadReviews(dormId: number) {
    this.isLoadingReviews = true;
    try {
      const res = await this.dormService.getReviewsByDormId(dormId);
      this.reviews = (res && res.data) ? res.data : [];
    } catch (error) { this.reviews = []; } 
    finally { this.isLoadingReviews = false; this.cdr.detectChanges(); }
  }

  calculateActiveTravelMode(destLat: number, destLng: number) {
    if (!this.directionsService) this.directionsService = new google.maps.DirectionsService();
    
    const origin = this.referencePoint;
    const destination = { lat: destLat, lng: destLng };
    const straightDist = this.calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    
    const provideAlt = false; 

    if (this.activeTravelMode === 'WALKING' && straightDist > 10) {
      this.walkingTime = 'ไกลเกินเดินไหว';
      this.walkingDistance = `> ${straightDist.toFixed(1)} กม.`;
      this.directionsResult = undefined;
      this.altRouteRenderers = [];
      this.cdr.detectChanges();
      return; 
    }

    this.directionsService.route({
      origin, destination, travelMode: google.maps.TravelMode[this.activeTravelMode], provideRouteAlternatives: provideAlt
    }, (res, status) => {
      if (status === google.maps.DirectionsStatus.OK && res) {
        if (this.activeTravelMode === 'DRIVING') {
          this.drivingTime = res.routes[0]?.legs[0]?.duration?.text || '-';
          this.drivingDistance = res.routes[0]?.legs[0]?.distance?.text || '-';
          this.possibleRoutesCount = 1; 
        } else {
          this.walkingTime = res.routes[0]?.legs[0]?.duration?.text || '-';
          this.walkingDistance = res.routes[0]?.legs[0]?.distance?.text || '-';
        }
        this.renderRoutesOnMap(res);
      }
    });
  }

  renderRoutesOnMap(result: google.maps.DirectionsResult) {
    this.directionsResult = result;
    this.altRouteRenderers = []; 
    this.cdr.detectChanges();
  }

  changeTravelMode(mode: 'WALKING' | 'DRIVING') {
    if (this.activeTravelMode === mode) return; 
    this.activeTravelMode = mode;
    this.directionsResult = undefined; 
    this.altRouteRenderers = [];
    if (this.selectedDorm) { this.calculateActiveTravelMode(this.selectedDorm.lat, this.selectedDorm.lng); }
  }

  getAltRouteOptions() {
    return { suppressMarkers: true, polylineOptions: { strokeColor: '#a4b0be', strokeOpacity: 0.7, strokeWeight: 4, zIndex: 2 } };
  }

  goToDetail() {
    if (this.selectedDorm) {
      const dormId = this.selectedDorm.DORM_ID || this.selectedDorm.id;
      if (dormId) this.router.navigate(['/dorm-detail', dormId]);
    }
  }

  goToLogin() { this.router.navigate(['/login']); }
  goToCompare() { this.router.navigate(['/compare']); }
  setOpen(isOpen: boolean) { this.isModalOpen = isOpen; }
  openFilter() { this.setOpen(true); }
  selectZone(zoneName: string) {
    this.selectedZone = this.selectedZone === zoneName ? '' : zoneName;
    if (!this.selectedZone) {
      this.zoneCircleCenter = undefined;
      this.zoneCircleRadius = 0;
    }
  }

  getStatusText(status: any): string {
    const s = Number(status);
    if (s === 3) return 'ห้องเต็ม';
    if (s === 2) return 'ปิดให้บริการ';
    return 'ว่าง';
  }

  getStatusClass(status: any): string {
    const s = Number(status);
    if (s === 3) return 'full';
    if (s === 2) return 'closed';
    return 'available';
  }
}