import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, MenuController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient, HttpClientJsonpModule } from '@angular/common/http';
import { GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HeaderComponent } from '../../components/header/header.component';
import { DormitoryService, DormitoryData } from '../../services/dormitory';
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
export class HomePage implements OnInit {
  
  apiLoaded: Observable<boolean>; 
  center: google.maps.LatLngLiteral = { lat: 16.246, lng: 103.252 };
  zoom = 14;
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false, zoomControl: false, mapTypeControl: false, 
    streetViewControl: false, fullscreenControl: false
  };

  searchText: string = '';
  dorms: DormitoryData[] = [];
  isModalOpen = false;

  minPrice: number | null = null;
  maxPrice: number | null = null;
  selectedZone: string = '';

  @ViewChild(MapInfoWindow) infoWindow: MapInfoWindow | undefined;
  selectedDorm: DormitoryData | undefined;

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
        ).pipe(map(() => true), catchError((err) => { console.error('Map Load Error:', err); return of(false); }));
    }
  }

  ngOnInit() {
    this.menuCtrl.enable(true, 'home-menu');
    this.fetchDorms();
  }

  async toggleMenu() {
    await this.menuCtrl.enable(true, 'home-menu');
    await this.menuCtrl.toggle('home-menu');
  }

  async navigateTo(path: string) {
    await this.menuCtrl.close('home-menu'); 
    this.router.navigate([path]);
  }

  fetchDorms() {
    this.dormService.getAllDorms().subscribe({
        next: (res) => {
            if (res.success) {
                this.dorms = res.data;
                const firstDorm = this.dorms[0];
                if (firstDorm && firstDorm.lat && firstDorm.lng) {
                    this.center = { lat: firstDorm.lat, lng: firstDorm.lng };
                }
            }
        },
        error: (err: any) => console.error('API Error:', err)
    });
  }

  onSearch(text: any) {
    if (typeof text !== 'string') text = text.target.value;
    this.searchText = text;
    if(this.searchText.trim() !== '') {
        this.dormService.searchDorms(this.searchText).subscribe((res: { success: any; data: DormitoryData[]; }) => {
            if(res.success) {
                this.dorms = res.data;
                const firstDorm = this.dorms[0];
                if(firstDorm && firstDorm.lat && firstDorm.lng) {
                    this.center = { lat: firstDorm.lat, lng: firstDorm.lng };
                    this.zoom = 16; 
                }
            }
        });
    } else { this.fetchDorms(); }
  }

  openInfoWindow(marker: MapMarker, dorm: DormitoryData) {
    this.selectedDorm = dorm;
    if (this.infoWindow) this.infoWindow.open(marker);
  }

  goToDetail() { if (this.selectedDorm) this.router.navigate(['/dorms', this.selectedDorm.DORM_ID]); }
  goToLogin() { this.router.navigate(['/login']); }
  goToCompare() { this.router.navigate(['/compare']); }
  
  setOpen(isOpen: boolean) { this.isModalOpen = isOpen; }
  openFilter() { this.setOpen(true); }
  selectZone(zone: string) { if (this.selectedZone === zone) { this.selectedZone = ''; } else { this.selectedZone = zone; } }

  applyFilter() {
      console.log('Filter Data:', { minPrice: this.minPrice, maxPrice: this.maxPrice, zone: this.selectedZone });
      this.setOpen(false);
  }
}