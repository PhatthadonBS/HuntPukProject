import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonButton, IonIcon, IonInput, IonItemDivider, AlertController } from '@ionic/angular/standalone';
import { DormitoryService } from '../../services/dormitory';
import { MasterType, DormZone } from '../../model/dorm.model';
import { addIcons } from 'ionicons';
import { trashOutline, addCircleOutline, locateOutline, locationOutline } from 'ionicons/icons';
import { GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-type-management',
  templateUrl: './type-management.page.html',
  styleUrls: ['./type-management.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonButton, IonIcon, IonInput, IonItemDivider, CommonModule, FormsModule, GoogleMapsModule]
})
export class TypeManagementPage implements OnInit {
  selectedSegment: string = 'dormType';
  
  lists: { [key: string]: any[] } = {
    dormType: [],
    roomType: [],
    bedType: [],
    priceType: [],
    dormStatus: [],
    zone: []
  };

  newName: string = '';
  newLat: number | null = null;
  newLng: number | null = null;

  center: google.maps.LatLngLiteral = { lat: 16.245279, lng: 103.250106 };
  zoom = 14;
  markerPosition: google.maps.LatLngLiteral = { lat: 16.245279, lng: 103.250106 };
  mapOptions: google.maps.MapOptions = { streetViewControl: false, mapTypeControl: false };
  markerOptions: google.maps.MarkerOptions = { draggable: true };

  segments = [
    { value: 'dormType', label: 'ประเภทหอพัก' },
    { value: 'roomType', label: 'ประเภทห้องพัก' },
    { value: 'bedType', label: 'ประเภทเตียง' },
    { value: 'priceType', label: 'ประเภทราคา' },
    { value: 'dormStatus', label: 'สถานะหอพัก' },
    { value: 'zone', label: 'โซนหอพัก' }
  ];

  constructor(
    private dormServices: DormitoryService,
    private alertController: AlertController
  ) {
    addIcons({ trashOutline, addCircleOutline, locateOutline, locationOutline });
  }

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.dormServices.getDormTypes().subscribe((res: any) => this.lists['dormType'] = res.data || res);
    this.dormServices.getRoomTypes().subscribe((res: any) => this.lists['roomType'] = res.data || res);
    this.dormServices.getBedTypes().subscribe((res: any) => this.lists['bedType'] = res.data || res);
    this.dormServices.getPriceTypes().subscribe((res: any) => this.lists['priceType'] = res.data || res);
    this.dormServices.getDormStatuses().subscribe((res: any) => this.lists['dormStatus'] = res.data || res);
    // getZones returns Promise but TypeManagement expects Observable, we'll fix it here
    this.dormServices.getZones().then((res: any) => this.lists['zone'] = res.data || []);
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
    this.newName = '';
    this.newLat = null;
    this.newLng = null;
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.newLat = position.coords.latitude;
          this.newLng = position.coords.longitude;
          this.center = { lat: this.newLat, lng: this.newLng };
          this.markerPosition = { ...this.center };
        },
        () => { console.error('ไม่สามารถดึงตำแหน่งได้'); }
      );
    }
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.newLat = parseFloat(event.latLng.lat().toFixed(6));
      this.newLng = parseFloat(event.latLng.lng().toFixed(6));
      this.markerPosition = { lat: this.newLat, lng: this.newLng };
    }
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.newLat = parseFloat(event.latLng.lat().toFixed(6));
      this.newLng = parseFloat(event.latLng.lng().toFixed(6));
    }
  }

  onInputCoordChange() {
    if (this.newLat && this.newLng) {
      this.markerPosition = { lat: Number(this.newLat), lng: Number(this.newLng) };
      this.center = { ...this.markerPosition };
    }
  }



  get currentList() {
    return this.lists[this.selectedSegment];
  }

  get currentLabel() {
    return this.segments.find(s => s.value === this.selectedSegment)?.label || '';
  }

  addType() {
    if (!this.newName.trim()) return;

    let obs$;
    switch (this.selectedSegment) {
      case 'dormType': obs$ = this.dormServices.addDormType(this.newName); break;
      case 'roomType': obs$ = this.dormServices.addRoomType(this.newName); break;
      case 'bedType': obs$ = this.dormServices.addBedType(this.newName); break;
      case 'priceType': obs$ = this.dormServices.addPriceType(this.newName); break;
      case 'dormStatus': obs$ = this.dormServices.addDormStatus(this.newName); break;
      case 'zone': obs$ = this.dormServices.addZone(this.newName, this.newLat || 0, this.newLng || 0); break;
    }

    if (obs$) {
      obs$.subscribe({
        next: () => {
          this.newName = '';
          this.newLat = null;
          this.newLng = null;
          this.loadAllData();
        },
        error: (err: any) => console.error(`Failed to add ${this.selectedSegment}`, err)
      });
    }
  }

  async confirmDelete(item: any) {
    // For zone it's ZONE_ID, ZONE_NAME, else id, name
    const id = item.id || item.ZONE_ID;
    const name = item.name || item.ZONE_NAME;

    const alert = await this.alertController.create({
      header: 'ยืนยันการลบ',
      message: `คุณต้องการลบ "${name}" ใช่หรือไม่?`,
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { text: 'ลบ', role: 'destructive', handler: () => this.deleteType(id) }
      ]
    });
    await alert.present();
  }

  deleteType(id: number) {
    let obs$;
    switch (this.selectedSegment) {
      case 'dormType': obs$ = this.dormServices.deleteDormType(id); break;
      case 'roomType': obs$ = this.dormServices.deleteRoomType(id); break;
      case 'bedType': obs$ = this.dormServices.deleteBedType(id); break;
      case 'priceType': obs$ = this.dormServices.deletePriceType(id); break;
      case 'dormStatus': obs$ = this.dormServices.deleteDormStatus(id); break;
      case 'zone': obs$ = this.dormServices.deleteZone(id); break;
    }

    if (obs$) {
      obs$.subscribe({
        next: () => this.loadAllData(),
        error: (err: any) => console.error(`Failed to delete ${this.selectedSegment}`, err)
      });
    }
  }
}
