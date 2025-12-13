import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ActionSheetController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient, HttpClientJsonpModule } from '@angular/common/http';
import { GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { DormitoryService, DormitoryData } from '../../services/dormitory';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonicModule, 
    RouterModule, 
    HttpClientModule,
    HttpClientJsonpModule, 
    GoogleMapsModule
  ]
})
export class HomePage implements OnInit {
  
  apiLoaded: Observable<boolean>; 
  center: google.maps.LatLngLiteral = { lat: 16.246, lng: 103.252 }; // ม.มหาสารคาม
  zoom = 14;
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: false, 
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  searchText: string = '';
  dorms: DormitoryData[] = [];

  @ViewChild(MapInfoWindow) infoWindow: MapInfoWindow | undefined;
  selectedDorm: DormitoryData | undefined;

  constructor(
    private router: Router,
    private actionSheetCtrl: ActionSheetController,
    private dormService: DormitoryService,
    private httpClient: HttpClient
  ) {
    this.apiLoaded = this.httpClient.jsonp(
      `https://maps.googleapis.com/maps/api/js?key=${environment.GGMAPI}`, 
      'callback'
    ).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  ngOnInit() {
    this.fetchDorms();
  }

  fetchDorms() {
    this.dormService.getAllDorms().subscribe({
        next: (res) => {
            if (res.success) {
                this.dorms = res.data;
                
                // --- จุดที่แก้ไข 1 ---
                // ดึงตัวแรกออกมาใส่ตัวแปรก่อน เพื่อให้ TypeScript รู้ว่ามีตัวตนจริง
                const firstDorm = this.dorms[0];
                
                // เช็คว่า firstDorm มีอยู่จริง และมีค่า lat/lng ครบ
                if (firstDorm && firstDorm.lat && firstDorm.lng) {
                    this.center = { lat: firstDorm.lat, lng: firstDorm.lng };
                }
            }
        },
        error: (err: any) => console.error('API Error:', err)
    });
  }

  onSearch() {
    if(this.searchText.trim() !== '') {
        this.dormService.searchDorms(this.searchText).subscribe((res: { success: any; data: DormitoryData[]; }) => {
            if(res.success) {
                this.dorms = res.data;
                
                // --- จุดที่แก้ไข 2 ---
                const firstDorm = this.dorms[0];
                
                if(firstDorm && firstDorm.lat && firstDorm.lng) {
                    this.center = { lat: firstDorm.lat, lng: firstDorm.lng };
                    this.zoom = 16; 
                }
            }
        });
    } else {
        this.fetchDorms(); 
    }
  }

  openInfoWindow(marker: MapMarker, dorm: DormitoryData) {
    this.selectedDorm = dorm;
    if (this.infoWindow) this.infoWindow.open(marker);
  }

  goToDetail() {
    if (this.selectedDorm) this.router.navigate(['/dorms', this.selectedDorm.DORM_ID]);
  }
  
  goToLogin() { this.router.navigate(['/login']); }
  goToCompare() { this.router.navigate(['/compare']); }
  
  async openFilter() { 
      const actionSheet = await this.actionSheetCtrl.create({
          header: 'กรองข้อมูล',
          buttons: [{ text: 'ยกเลิก', role: 'cancel' }]
      });
      await actionSheet.present();
  }
}