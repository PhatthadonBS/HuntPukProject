import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, MenuController, ViewDidEnter } from '@ionic/angular'; // ✅ นำ MenuController กลับมา
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient, HttpClientJsonpModule } from '@angular/common/http';

// นำเข้าระบบแผนที่
import {
  GoogleMapsModule,
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
  navigateCircleOutline, timeOutline,
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
  center: google.maps.LatLngLiteral = { lat: 16.246, lng: 103.252 };
  zoom = 15; 
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false, zoomControl: false, mapTypeControl: false,
    streetViewControl: false, fullscreenControl: false,
  };

  searchText: string = '';
  dorms: Dormitory[] = [];
  allDorms: Dormitory[] = [];
  isModalOpen = false;

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
    fillColor: '#FFD600', fillOpacity: 0.2, strokeColor: '#FFD600',
    strokeOpacity: 0.8, strokeWeight: 2, clickable: false,
  };

  referencePoint: google.maps.LatLngLiteral = { lat: 16.246, lng: 103.252 };
  travelInfo: { [key: number]: { distance: string; duration: string } } = {};

  directionsService: google.maps.DirectionsService | undefined;
  directionsResult: google.maps.DirectionsResult | undefined;

  @ViewChild(MapInfoWindow) infoWindow: MapInfoWindow | undefined;

  constructor(
    private router: Router,
    private dormService: DormitoryService,
    private httpClient: HttpClient,
    private menuCtrl: MenuController, // ✅ ต้องประกาศใช้งานที่นี่
    private cdr: ChangeDetectorRef,
  ) {
    addIcons({
      'menu-outline': menuOutline, 'caret-down-outline': caretDownOutline, 'layers-outline': layersOutline,
      'close': close, 'location-outline': locationOutline, 'checkmark-circle': checkmarkCircle,
      'chevron-down-circle-outline': chevronDownCircleOutline, 'call-outline': callOutline,
      'chatbubble-ellipses-outline': chatbubbleEllipsesOutline, 'logo-facebook': logoFacebook,
      'logo-instagram': logoInstagram, 'paper-plane-outline': paperPlaneOutline,
      'options-outline': optionsOutline, 'navigate-circle-outline': navigateCircleOutline,
      'time-outline': timeOutline,
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

// ✅ ท่าไม้ตายใหม่: โยน Event ไปบอกให้ Sidebar เปิด (ไม่ต้องง้อ Ionic)
openMenu() {
    // ยิง Event ไปบอกเมนูให้เปิด
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  }

  // ✅ ฟังก์ชันให้ผู้ใช้คลิกบนแผนที่เพื่อสร้างจุดอ้างอิงใหม่
  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.referencePoint = event.latLng.toJSON();
      this.circleCenter = this.referencePoint;
      this.directionsResult = undefined; // ล้างเส้นทางเก่าทิ้ง
      if (this.infoWindow) this.infoWindow.close();
      this.cdr.detectChanges();
    }
  }

  // ✅ ฟังก์ชันคำนวณระยะทาง + วาดเส้นทาง
  async getTravelData(destLat: number, destLng: number, dormId: number) {
    if (typeof google === 'undefined' || typeof google.maps === 'undefined')
      return;

    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [this.referencePoint],
        destinations: [{ lat: destLat, lng: destLng }],
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === 'OK' && response) {
          const result = response.rows?.[0]?.elements?.[0];
          if (result && result.status === 'OK' && result.distance && result.duration) {
            this.travelInfo[dormId] = {
              distance: result.distance.text,
              duration: result.duration.text,
            };
            this.cdr.detectChanges();
          }
        }
      },
    );

    if (!this.directionsService) {
      this.directionsService = new google.maps.DirectionsService();
    }

    this.directionsService.route(
      {
        origin: this.referencePoint,
        destination: { lat: destLat, lng: destLng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          this.directionsResult = result || undefined;
        } else {
          this.directionsResult = undefined;
        }
        this.cdr.detectChanges();
      },
    );
  }

  async fetchZones() {
    try {
      const res = await this.dormService.getZones();
      if (res.success) this.zoneOptions = res.data;
    } catch (error) {
      console.error('Fetch Zones Error:', error);
    }
  }

  async fetchDorms() {
    try {
      const res = await this.dormService.getAllDorms();
      if (res.success && res.data) {
        this.allDorms = res.data.map((d) => ({ ...d, lat: Number(d.lat), lng: Number(d.lng) }));
        this.dorms = [...this.allDorms];
      }
    } catch (err) {
      console.error('Fetch Dorms Error:', err);
    }
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
            if (firstDorm) {
              this.center = { lat: firstDorm.lat, lng: firstDorm.lng };
            }
          }
          this.zoom = 15; 
        }
      } else {
        this.dorms = [];
      }
    } catch (err) {
      console.error('Search Error:', err);
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
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
    this.getTravelData(dorm.lat, dorm.lng, dorm.DORM_ID);

    try {
      const res = await this.dormService.getDormById(dorm.DORM_ID);
      if (res.success && res.data) {
        this.selectedDorm = { ...this.selectedDorm, ...res.data };
      }
    } catch (e) {
      console.error('Fetch pop-up detail error: ', e);
    }
  }

  async goToDetail() {
    if (this.selectedDorm) {
      const targetDorm = this.selectedDorm;
      this.selectedDormDetail = null;

      try {
        const res = await this.dormService.getDormById(targetDorm.DORM_ID);
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
  selectZone(zoneName: string) { this.selectedZone = this.selectedZone === zoneName ? '' : zoneName; }
}