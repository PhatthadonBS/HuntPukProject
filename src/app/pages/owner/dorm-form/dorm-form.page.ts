import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButtons, IonBackButton, IonButton, IonIcon,
  IonLabel, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonCheckbox, IonList, IonSpinner, LoadingController, ToastController, AlertController, ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline, imageOutline, homeOutline, wifi,
  bedOutline, trashOutline, addCircleOutline, locationOutline, cloudUploadOutline, closeCircle,
  locateOutline, documentTextOutline, arrowBackOutline, arrowForwardOutline, imagesOutline,
  personOutline, personAddOutline, bulbOutline, checkmarkCircle, timeOutline, snowOutline, waterOutline, shirtOutline, shieldCheckmarkOutline, flashOutline, carOutline, pawOutline, barbellOutline, restaurantOutline, cubeOutline,
  refreshOutline, listOutline, homeOutline as homeOutlineIcon, checkmarkCircleOutline
} from 'ionicons/icons';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DormitoryService } from '../../../services/dormitory';
import { lastValueFrom } from 'rxjs';
import { GoogleMapsModule, MapInfoWindow, MapMarker, MapCircle } from '@angular/google-maps';
import { SuccessModalComponent } from '../../../components/success-modal/success-modal.component';
import { DormDetailPage } from '../../dorm-detail/dorm-detail.page';
import { UserService } from '../../../services/user';

addIcons({
  saveOutline, homeOutline, locationOutline, wifi,
  bedOutline, addCircleOutline, trashOutline, imageOutline,
  cloudUploadOutline, closeCircle, locateOutline, documentTextOutline,
  arrowBackOutline, arrowForwardOutline, imagesOutline, personOutline, personAddOutline,
  bulbOutline, checkmarkCircle, timeOutline, snowOutline, waterOutline, shirtOutline,
  shieldCheckmarkOutline, flashOutline, carOutline, pawOutline, barbellOutline,
  restaurantOutline, cubeOutline, refreshOutline, listOutline, checkmarkCircleOutline
});

@Component({
  selector: 'app-dorm-form',
  templateUrl: './dorm-form.page.html',
  styleUrls: ['./dorm-form.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButtons, IonBackButton, IonButton, IonIcon,
    IonLabel, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonCheckbox, IonList, IonSpinner, CommonModule, FormsModule, GoogleMapsModule, MapInfoWindow, MapMarker, MapCircle,
    SuccessModalComponent, DormDetailPage, RouterModule
  ]
})
export class DormFormPage implements OnInit {
  @ViewChild('infoWindow') infoWindow!: MapInfoWindow;
  @ViewChild('dormInfoWindow') dormInfoWindow!: MapInfoWindow;
  @ViewChild('userMarker') marker!: MapMarker;

  duplicateDormName: string | null = null;
  selectedDormForMap: any = null;

  currentStep: number = 1;
  dormId: number = 0;
  isResubmitMode: boolean = false;
  existingGallery: string[] = [];

  // โ… เธเธงเธเธเธธเธกเธเธฒเธฃเนเธชเธ”เธ popup เธชเธณเน€เธฃเนเธเนเธเธ custom (เนเธ—เธ alertCtrl เธ—เธตเนเนเธกเน render HTML)
  showSuccessModal: boolean = false;

  // โ… เนเธชเธ”เธ Preview เธเนเธญเธเธชเนเธเธเนเธญเธกเธนเธฅ (using DormDetailPage)
  showPreviewModal: boolean = false;

  formState: 'editing' | 'pending' | 'rejected' = 'editing';
  rejectReason: string = '';
  
  isReadOnly: boolean = false;
  isLocating: boolean = false; // For map location loading state
  isApproved: boolean = false;
  isSubmitting: boolean = false;



  // โ… เน€เธเนเธเธเนเธญเธกเธนเธฅ user เน€เธ•เนเธกเน เนเธงเนเนเธเนเธ•เธฅเธญเธ”
  currentUser: any = null;
  ownerId: number = 0;       // USER_ID เธเธฒเธ USERS table
  isAdmin: boolean = false;  // true เธ–เนเธฒ ROLE_TYPE_ID === 3

  formData: any = {
    name: '', address: '',
    lat: 16.245279, lng: 103.250106,
    zone_id: 1,
    type_id: 1,
    water_unit: null, water_lump: null, elect_unit: null, detail: '',
    new_facilities: [] // { name: string, icon: string }
  };

  zones: any[] = [];
  facilities: any[] = [];
  roomTypes: any[] = [];
  priceTypes: any[] = [];
  
  // โ… เธชเธณเธซเธฃเธฑเธเธ•เธฑเธงเน€เธฅเธทเธญเธเธเธฒเธ Database
  dormTypesDB: any[] = [];
  roomTypesDB: any[] = [];
  bedTypesDB: any[] = [];
  currentZoneName: string = 'เธเธฃเธธเธ“เธฒเธเธฑเธเธซเธกเธธเธ”เน€เธเธทเนเธญเน€เธฅเธทเธญเธเธ•เธณเนเธซเธเนเธเธซเธญเธเธฑเธเนเธฅเธฐเนเธเธ';
  overlappingZones: any[] = [];

  // โ… เธชเธณเธซเธฃเธฑเธเนเธญเธ”เธกเธดเธเน€เธฅเธทเธญเธเน€เธเนเธฒเธเธญเธเธซเธญเธเธฑเธ
  dormOwners: any[] = [];
  selectedOwnerId: number | null = null;

  selectedFiles: any = {
    FRONT_DORM_IMG: null, LICENSE_IMG: null,
    BED_IMG: null, WALL_IMG: null, CEILING_IMG: null,
    FLOOR_IMG: null, BATHROOM_IMG: null, BALCONY_IMG: null,
    OTHER_IMG: []
  };
  previews: any = {
    FRONT_DORM_IMG: null, LICENSE_IMG: null,
    BED_IMG: null, WALL_IMG: null, CEILING_IMG: null,
    FLOOR_IMG: null, BATHROOM_IMG: null, BALCONY_IMG: null,
    OTHER_IMG: []
  };

  center: google.maps.LatLngLiteral = { lat: 16.245279, lng: 103.250106 };
  zoom = 15;
  markerPosition: google.maps.LatLngLiteral = { lat: 16.245279, lng: 103.250106 };
  mapOptions: google.maps.MapOptions = { streetViewControl: false, mapTypeControl: false };
  markerOptions: google.maps.MarkerOptions = { draggable: true };
  
  zoneCenter: google.maps.LatLngLiteral | null = null;
  zoneRadius: number = 500; // 500 meters
  circleOptions: google.maps.CircleOptions = {
    fillColor: '#4285F4', fillOpacity: 0.15,
    strokeColor: '#4285F4', strokeOpacity: 0.6, strokeWeight: 2,
    clickable: false  // โ… เธ—เธณเนเธซเนเธเธฅเธดเธเธเนเธฒเธเธงเธเธเธฅเธกเนเธเธขเธฑเธเนเธเธเธ—เธตเนเนเธ”เน
  };
  zoneMarkerOptions: google.maps.MarkerOptions = { 
    icon: { url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }
  };
  
  allDorms: any[] = [];
  get filteredDorms(): any[] {
    if (!this.formData.zone_id) return [];
    return this.allDorms.filter(dorm => dorm.ZONE_ID === this.formData.zone_id);
  }
  geocoder: any;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dormService: DormitoryService,
    private userService: UserService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
    // โ… FIX: เธฃเธญเธเธฃเธฑเธเธ—เธธเธ key เธ—เธตเน backend เธญเธฒเธเธชเนเธเธเธฅเธฑเธเธกเธฒเนเธ localStorage
    const stored = localStorage.getItem('loggedIn');
    if (!stored) {
      this.showToast('เธเธฃเธธเธ“เธฒเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเธเนเธญเธ', 'danger');
      this.router.navigate(['/login']);
      return;
    }

    try {
      this.currentUser = JSON.parse(stored);
      // เธฃเธญเธเธฃเธฑเธเธ—เธธเธเธฃเธนเธเนเธเธ key เธ—เธตเน backend เธญเธฒเธเธชเนเธเธกเธฒ
      this.ownerId =
        this.currentUser?.USER_ID ??
        this.currentUser?.user_id ??
        this.currentUser?.userId ??
        this.currentUser?.id ??
        0;

      // โ… เธ•เธฃเธงเธเธชเธญเธ role: 3 = Admin, 2 = Dorm Owner
      const roleId =
        this.currentUser?.ROLE_TYPE_ID ??
        this.currentUser?.role_id ??
        this.currentUser?.roleId ??
        1;
      this.isAdmin = (roleId === 3);

      console.log('๐‘ค currentUser:', this.currentUser);
      console.log('๐”‘ ownerId:', this.ownerId, '| isAdmin:', this.isAdmin, '| roleId:', roleId);

      if (!this.ownerId) {
        this.showToast('เนเธกเนเธเธเธเนเธญเธกเธนเธฅเธเธนเนเนเธเน เธเธฃเธธเธ“เธฒเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเนเธซเธกเน', 'danger');
        this.router.navigate(['/login']);
        return;
      }

      // โ… เธ–เนเธฒเนเธกเนเนเธเน Admin เนเธฅเธฐเนเธกเนเนเธเน Dorm Owner โ’ เนเธกเนเธกเธตเธชเธดเธ—เธเธดเน
      if (roleId !== 2 && roleId !== 3) {
        this.showToast('เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเธฅเธเธ—เธฐเน€เธเธตเธขเธเธซเธญเธเธฑเธ', 'danger');
        this.router.navigate(['/home']);
        return;
      }
      
      if (this.isAdmin) {
        this.loadDormOwners();
      }
    } catch (e) {
      console.error('โ Parse localStorage error:', e);
      this.showToast('เธเนเธญเธกเธนเธฅ Session เธเธดเธ”เธเธฅเธฒเธ” เธเธฃเธธเธ“เธฒ Login เนเธซเธกเน', 'danger');
      this.router.navigate(['/login']);
      return;
    }

    await this.loadInitialData();
    this.resetForm();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.dormId = Number(idParam);
      this.isResubmitMode = true;
      await this.loadDormData(this.dormId);
    }
  }

  // เธขเนเธญเธเธเธฅเธฑเธเนเธ”เธขเธ”เธนเธงเนเธฒเน€เธเนเธฒเธกเธฒเธเธฒเธเธซเธเนเธฒเนเธซเธ
  goBack() {
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'manage-dorm') {
      this.router.navigate(['/manage-dorm']);
    } else {
      this.router.navigate(['/my-dorms']);
    }
  }

  async loadDormOwners() {
    this.dormOwners = await this.userService.getDormOwners();
    if (this.dormOwners.length > 0) {
      this.selectedOwnerId = this.ownerId; // เธเนเธฒเน€เธฃเธดเนเธกเธ•เนเธเธเธทเธญเธ•เธฑเธงเนเธญเธ”เธกเธดเธเน€เธญเธ
    }
  }

  async loadInitialData() {
    try {
      const zoneRes = await this.dormService.getZones();
      if (zoneRes.success) this.zones = zoneRes.data;

      // โ… เนเธซเธฅเธ”เธ•เธฑเธงเน€เธฅเธทเธญเธเธญเธทเนเธเน เธเธฒเธ DB
      const dtRes: any = await lastValueFrom(this.dormService.getDormTypes());
      this.dormTypesDB = Array.isArray(dtRes) ? dtRes : (dtRes?.data || []);
      
      const rtRes: any = await lastValueFrom(this.dormService.getRoomTypes());
      this.roomTypesDB = Array.isArray(rtRes) ? rtRes : (rtRes?.data || []);

      const btRes: any = await lastValueFrom(this.dormService.getBedTypes());
      this.bedTypesDB = Array.isArray(btRes) ? btRes : (btRes?.data || []);

      // โ… FIX: เธฃเธญเธเธฃเธฑเธเธ—เธฑเนเธ array เธ•เธฃเธเน เนเธฅเธฐเนเธเธเธซเนเธญ {data: [...]}
      const facRes: any = await lastValueFrom(this.dormService.getFacilities());
      const facArray = Array.isArray(facRes) ? facRes : (facRes?.data || []);

      if (facArray.length > 0) {
        this.facilities = facArray.map((f: any) => ({
          id: f.FAC_TYPE_ID,
          name: f.FAC_TYPE_NAME,
          icon: f.FAC_TYPE_ICON || '',
          // โ… FIX: เธ•เธฃเธงเธเธชเธญเธเธงเนเธฒ icon เน€เธเนเธ Font Awesome class เธซเธฃเธทเธญ URL
          isFontAwesome: f.FAC_TYPE_ICON &&
            !f.FAC_TYPE_ICON.startsWith('http') &&
            !f.FAC_TYPE_ICON.startsWith('/') &&
            !f.FAC_TYPE_ICON.startsWith('assets'),
          checked: false
        }));
      }

      // เนเธซเธฅเธ” priceTypes
      const priceRes: any = await lastValueFrom(this.dormService.getPriceTypes());
      if (priceRes && priceRes.success && priceRes.data) {
        this.priceTypes = priceRes.data;
      }
      
      // Load all dorms for duplicate check
      const dormsRes: any = await this.dormService.getAllDorms();
      if (dormsRes && dormsRes.data) {
        this.allDorms = dormsRes.data;
      }

      // (No longer auto-calculating zone)
      setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
    } catch (error) {
      console.error('โ loadInitialData error:', error);
    }
  }

  resetForm() {
    this.currentStep = 1;
    this.formData = {
      name: '', address: '',
      lat: 16.245279, lng: 103.250106,
      zone_id: 1, type_id: 1,
      water_unit: null, water_lump: null, elect_unit: null, detail: '',
      new_facilities: []
    };
    
    if (this.dormTypesDB.length > 0) this.formData.type_id = this.dormTypesDB[0].id || this.dormTypesDB[0].DORM_TYPE_ID;

    this.facilities.forEach(f => f.checked = false);

    // โ… เธซเนเธญเธเน€เธฃเธดเนเธกเธ•เนเธ 1 เธซเนเธญเธ
    this.roomTypes = [{
      id: null,
      selectedType: this.roomTypesDB.length > 0 ? (this.roomTypesDB[0].name || this.roomTypesDB[0].ROOM_TYPE_NAME) : 'เธซเนเธญเธเนเธญเธฃเน',
      roomType: this.roomTypesDB.length > 0 ? (this.roomTypesDB[0].name || this.roomTypesDB[0].ROOM_TYPE_NAME) : 'เธซเนเธญเธเนเธญเธฃเน',
      bedType: this.bedTypesDB.length > 0 ? (this.bedTypesDB[0].id || this.bedTypesDB[0].BED_TYPE_ID)?.toString() : '1',
      prices: this.priceTypes.map(pt => ({ priceTypeId: pt.id, name: pt.name, price: null }))
    }];

    this.selectedFiles = {
      FRONT_DORM_IMG: null, LICENSE_IMG: null,
      BED_IMG: null, WALL_IMG: null, CEILING_IMG: null,
      FLOOR_IMG: null, BATHROOM_IMG: null, BALCONY_IMG: null,
      OTHER_IMG: []
    };
    this.previews = {
      FRONT_DORM_IMG: null, LICENSE_IMG: null,
      BED_IMG: null, WALL_IMG: null, CEILING_IMG: null,
      FLOOR_IMG: null, BATHROOM_IMG: null, BALCONY_IMG: null,
      OTHER_IMG: []
    };

    this.center = { lat: 16.245279, lng: 103.250106 };
    this.markerPosition = { lat: 16.245279, lng: 103.250106 };
  }


  async loadDormData(id: number) {
    const loading = await this.loadingCtrl.create({ message: 'เธเธณเธฅเธฑเธเนเธซเธฅเธ”เธเนเธญเธกเธนเธฅเธซเธญเธเธฑเธเน€เธ”เธดเธก...' });
    await loading.present();

    try {
      const res = await this.dormService.getDormById(id);
      if (res.success) {
        const d = res.data;
          
        this.isApproved = (d.REQ_STATUS === 1);
        
        if (d.REQ_STATUS === 2) {
           this.isReadOnly = true;
           this.formState = 'rejected';
           this.rejectReason = d.REJECT_REASON || 'เธเนเธญเธกเธนเธฅเนเธกเนเธเธฃเธเธ–เนเธงเธเธซเธฃเธทเธญเนเธกเนเธ–เธนเธเธ•เนเธญเธ';
        } else if (d.REQ_STATUS === 0 || d.REQ_STATUS === 3) {
           this.isReadOnly = false; // User requested to edit and resubmit
           this.formState = 'pending';
        } else if (d.REQ_STATUS === 4) {
           this.isReadOnly = false;
           this.formState = 'editing';
        } else {
           // REQ_STATUS = 1 (Approved) goes here
           this.isReadOnly = true;
           this.formState = 'editing';
        }
        
        this.markerOptions = { draggable: !this.isReadOnly };

        this.formData = {
          name: d.DORM_NAME,
          address: d.ADDRESS,
          lat: parseFloat(d.lat) || 16.245279,
          lng: parseFloat(d.lng) || 103.250106,
          zone_id: d.ZONE_ID,
          type_id: d.DORM_TYPE_ID,
          water_unit: d.WATER_UNIT || 0,
          water_lump: d.WATER_LUMP || 0,
          elect_unit: d.ELECT_UNIT || 0,
          detail: d.ADD_DORM_DATA || '',
          new_facilities: d.new_facilities ? d.new_facilities.map((nf: any) => ({
            name: nf.name || nf.FAC_NAME || '',
            icon: nf.icon || nf.FAC_ICON || 'cube-outline'
          })) : []
        };

        this.center = { lat: this.formData.lat, lng: this.formData.lng };
        this.markerPosition = { lat: this.formData.lat, lng: this.formData.lng };

        const dormFacs = d.facilities || [];
        this.facilities.forEach((fac: any) => {
          if (dormFacs.some((df: any) => df.name === fac.name)) {
             fac.checked = true;
          }
        });

        if (d.rooms && d.rooms.length > 0) {
          this.roomTypes = d.rooms.map((r: any) => {
            const mappedPrices = this.priceTypes.map(pt => {
              const existing = r.prices?.find((rp: any) => rp.priceTypeId === pt.id);
              return { priceTypeId: pt.id, name: pt.name, price: existing ? existing.price : null };
            });
            const isStandardRoom = this.roomTypesDB.some(rt => (rt.name || rt.ROOM_TYPE_NAME) === r.ROOM_TYPE_NAME);
            const selectedType = isStandardRoom ? r.ROOM_TYPE_NAME : 'custom';
            let matchedBedId = '1';
            const bedNameLower = (r.bedType || '').toLowerCase();
            if (bedNameLower.includes('double') || bedNameLower.includes('เธเธนเน')) {
               const bmatch = this.bedTypesDB.find(bt => (bt.name || bt.BED_TYPE_NAME || '').toLowerCase().includes('เธเธนเน'));
               if(bmatch) matchedBedId = (bmatch.id || bmatch.BED_TYPE_ID).toString();
            } else {
               const bmatch = this.bedTypesDB.find(bt => (bt.name || bt.BED_TYPE_NAME || '').toLowerCase().includes('เน€เธ”เธตเนเธขเธง'));
               if(bmatch) matchedBedId = (bmatch.id || bmatch.BED_TYPE_ID).toString();
            }
            return {
              id: r.ROOM_TYPE_ID,
              selectedType: selectedType,
              roomType: r.ROOM_TYPE_NAME,
              bedType: matchedBedId,
              prices: mappedPrices
            };
          });
        }

        this.previews.FRONT_DORM_IMG = d.image || null;
        this.previews.LICENSE_IMG = d.DORM_LICENSE || null;
        this.previews.BED_IMG = d.bed_img || null;
        this.previews.WALL_IMG = d.wall_img || null;
        this.previews.CEILING_IMG = d.ceiling_img || null;
        this.previews.FLOOR_IMG = d.floor_img || null;
        this.previews.BATHROOM_IMG = d.bathroom_img || null;
        this.previews.BALCONY_IMG = d.balcony_img || null;
        this.existingGallery = d.gallery || [];
      }
      setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
    } catch (error) {
      this.showToast('เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเนเธซเธฅเธ”เธเนเธญเธกเธนเธฅ', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  // ==========================
  // Multi-Zone Detection & Selection
  // ==========================
  async detectAndSelectZone(lat: number, lng: number) {
    if (!this.zones || this.zones.length === 0) return;

    // Find all zones whose radius covers this pin
    const matchingZones = this.zones.filter((zone: any) => {
      if (zone.lat == null || zone.lng == null) return false;
      const distM = this.getDistanceFromLatLonInKm(lat, lng, zone.lat, zone.lng) * 1000;
      return distM <= (zone.ZONE_RADIUS || this.zoneRadius);
    });

    if (matchingZones.length === 0) {
      // No zone covers the pin โ€” fall back to nearest
      let minDistance = Infinity;
      let nearestZone = this.zones[0];
      for (const zone of this.zones) {
        if (zone.lat != null && zone.lng != null) {
          const dist = this.getDistanceFromLatLonInKm(lat, lng, zone.lat, zone.lng);
          if (dist < minDistance) { minDistance = dist; nearestZone = zone; }
        }
      }
      this.applyZone(nearestZone);
      this.showToast(`เนเธกเนเธญเธขเธนเนเนเธเธฃเธฑเธจเธกเธตเนเธเธเนเธ” โ€” เน€เธฅเธทเธญเธเนเธเธเนเธเธฅเนเธ—เธตเนเธชเธธเธ”: ${nearestZone.ZONE_NAME}`, 'warning');
    } else if (matchingZones.length === 1) {
      this.applyZone(matchingZones[0]);
    } else {
      // Multiple overlapping zones โ€” let user choose
      const buttons = matchingZones.map((zone: any) => ({
        text: zone.ZONE_NAME,
        handler: () => { this.applyZone(zone); }
      }));
      buttons.push({ text: 'เธขเธเน€เธฅเธดเธ', handler: () => {} } as any);

      const sheet = await this.actionSheetCtrl.create({
        header: '๐—บ๏ธ เธ•เธณเนเธซเธเนเธเธเธตเนเธญเธขเธนเนเนเธ ' + matchingZones.length + ' เนเธเธ โ€” เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเนเธเธ',
        buttons
      });
      await sheet.present();
    }
  }

  applyZone(zone: any) {
    this.formData.zone_id = zone.ZONE_ID;
    this.currentZoneName = zone.ZONE_NAME;
    if (zone.lat && zone.lng) {
      this.zoneCenter = { lat: zone.lat, lng: zone.lng };
      this.zoneRadius = zone.ZONE_RADIUS || 500;
    }
  }

  /** @deprecated use detectAndSelectZone instead */
  calculateNearestZone(lat: number, lng: number) {
    this.detectAndSelectZone(lat, lng);
  }

  getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2-lat1);
    const dLon = this.deg2rad(lon2-lon1); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
  }

  deg2rad(deg: number) { return deg * (Math.PI/180); }

  // ==========================
  // Zone & Map Logic
  // ==========================

  onZoneChange() {
    if (this.formData.zone_id) {
      const selectedZone = this.zones.find((z: any) => z.ZONE_ID == this.formData.zone_id);
      if (selectedZone && selectedZone.lat && selectedZone.lng) {
        this.zoneCenter = { lat: selectedZone.lat, lng: selectedZone.lng };
        this.currentZoneName = selectedZone.ZONE_NAME;
        // Do not change marker or center unless they want to jump there.
        // Usually, changing zone jumps the map there. Let's jump.
        this.center = { ...this.zoneCenter };
      }
    }
  }

  // ========== Map zone/dorm display helpers ==========
  getZoneCircleOptions(zone: any): google.maps.CircleOptions {
    const isSelected = this.formData.zone_id === zone.ZONE_ID;
    return {
      fillColor: isSelected ? '#f59e0b' : '#4285F4',
      fillOpacity: isSelected ? 0.18 : 0.10,
      strokeColor: isSelected ? '#f59e0b' : '#4285F4',
      strokeOpacity: isSelected ? 0.8 : 0.5,
      strokeWeight: isSelected ? 2.5 : 1.5,
      clickable: false
    };
  }

  getZoneMarkerOptions(zone: any): any {
    const isSelected = this.formData.zone_id === zone.ZONE_ID;
    // SymbolPath.CIRCLE = 0 (numeric fallback to avoid runtime error if google not loaded yet)
    const circlePath = (typeof google !== 'undefined' && google?.maps?.SymbolPath)
      ? google.maps.SymbolPath.CIRCLE
      : 0;
    return {
      icon: {
        path: circlePath,
        scale: 10,
        fillColor: isSelected ? '#f59e0b' : '#4285F4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      title: zone.ZONE_NAME,
      label: {
        text: zone.ZONE_NAME || '',
        color: '#333',
        fontSize: '11px',
        fontWeight: '600'
      }
    };
  }

  getDormMarkerOptions(dorm: any): any {
    const scaledSize = (typeof google !== 'undefined' && google?.maps?.Size)
      ? new google.maps.Size(32, 32)
      : undefined;
    return {
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        ...(scaledSize ? { scaledSize } : {})
      },
      title: dorm.DORM_NAME || dorm.DORMNAME,
      zIndex: 1
    };
  }

  onDormMarkerClick(marker: MapMarker, dorm: any) {
    this.selectedDormForMap = dorm;
    if (this.dormInfoWindow) {
      this.dormInfoWindow.open(marker);
    }
  }

  onZoneMarkerClick(zone: any) {
    this.applyZone(zone);
    this.showToast(`เน€เธฅเธทเธญเธเนเธเธ: ${zone.ZONE_NAME}`, 'success');
  }
  // ==========================
  // ==========================
  // Step Navigation
  // ==========================
  goToStep(step: number) {
    if (step < this.currentStep) {
      this.currentStep = step;
    } else if (step > this.currentStep) {
      while (this.currentStep < step) {
        const oldStep = this.currentStep;
        this.nextStep();
        // เธ–เนเธฒเนเธกเนเน€เธเธฅเธตเนเธขเธ step เนเธชเธ”เธเธงเนเธฒเธ•เธดเธ” validation เนเธซเนเธซเธขเธธเธ”เธเธฒเธฃเธเธฃเธฐเนเธ”เธ”
        if (this.currentStep === oldStep) {
          break;
        }
      }
    }
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (!this.formData.name?.trim()) {
        this.showToast('เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญเธซเธญเธเธฑเธ', 'warning');
        return;
      }
      if (this.formData.water_unit === null || this.formData.water_unit === '' || this.formData.water_unit < 0) {
        this.showToast('เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเนเธฒเธเนเธณ (เธเธฒเธ—/เธซเธเนเธงเธข) เนเธซเนเธ–เธนเธเธ•เนเธญเธ (เธซเนเธฒเธกเธ•เธดเธ”เธฅเธ)', 'warning');
        return;
      }
      if (this.formData.water_lump < 0) {
        this.showToast('เธเนเธฒเธเนเธณเน€เธซเธกเธฒเธเนเธฒเธขเธซเนเธฒเธกเธ•เธดเธ”เธฅเธ', 'warning');
        return;
      }
      if (this.formData.elect_unit === null || this.formData.elect_unit === '' || this.formData.elect_unit < 0) {
        this.showToast('เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเนเธฒเนเธ (เธเธฒเธ—/เธซเธเนเธงเธข) เนเธซเนเธ–เธนเธเธ•เนเธญเธ (เธซเนเธฒเธกเธ•เธดเธ”เธฅเธ)', 'warning');
        return;
      }
    }
    if (this.currentStep === 3) {
      // เธ•เธฃเธงเธเธชเธญเธเธงเนเธฒเนเธ•เนเธฅเธฐเธซเนเธญเธเธกเธตเธฃเธฒเธเธฒเธญเธขเนเธฒเธเธเนเธญเธข 1 เธเนเธญเธ เนเธฅเธฐเธซเนเธฒเธกเธ•เธดเธ”เธฅเธ
      for (const room of this.roomTypes) {
        const hasPrice = room.prices.some((p: any) => p.price !== null && p.price !== '' && Number(p.price) > 0);
        if (!hasPrice) {
          this.showToast('เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธฃเธฒเธเธฒเธญเธขเนเธฒเธเธเนเธญเธข 1 เธเนเธญเธ เนเธเธ—เธธเธเธเธฃเธฐเน€เธ เธ—เธซเนเธญเธ', 'warning');
          return;
        }
        for (const p of room.prices) {
          if (p.price !== null && p.price !== '' && Number(p.price) < 0) {
            this.showToast('เธฃเธฒเธเธฒเธซเนเธญเธเธเธฑเธเธซเนเธฒเธกเธ•เธดเธ”เธฅเธ', 'warning');
            return;
          }
        }
      }
    }
    if (this.currentStep < 4) this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      if (this.currentStep === 1) {
        setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
      }
    }
  }

  // ==========================
  // เนเธเธเธ—เธตเน
  // ==========================
  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.formData.lat = position.coords.latitude;
          this.formData.lng = position.coords.longitude;
          this.center = { lat: this.formData.lat, lng: this.formData.lng };
          this.markerPosition = { ...this.center };
          this.showToast('เธ”เธถเธเธ•เธณเนเธซเธเนเธเธเธฑเธเธเธธเธเธฑเธเธชเธณเน€เธฃเนเธ โ“', 'success');
        },
        () => { this.showToast('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธ•เธณเนเธซเธเนเธเนเธ”เน เธเธฃเธธเธ“เธฒเน€เธเธดเธ” GPS', 'danger'); }
      );
    }
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.formData.lat = event.latLng.lat();
      this.formData.lng = event.latLng.lng();
      this.markerPosition = { lat: this.formData.lat, lng: this.formData.lng };
      this.detectAndSelectZone(this.formData.lat, this.formData.lng);
      this.geocodeAddress(this.formData.lat, this.formData.lng);
      this.checkDuplicateLocation(this.formData.lat, this.formData.lng);

      // Open InfoWindow after zone resolves
      setTimeout(() => {
        if (this.infoWindow && this.marker) {
          this.infoWindow.open(this.marker);
        }
      }, 400);
    }
  }

  geocodeAddress(lat: number, lng: number) {
    if (!this.geocoder) {
      if (typeof google === 'undefined') return;
      this.geocoder = new google.maps.Geocoder();
    }
    this.geocoder.geocode({ location: { lat, lng }, language: 'th' }, (results: any, status: any) => {
      if (status === 'OK' && results && results[0]) {
        this.formData.address = results[0].formatted_address;
      }
    });
  }

  async checkDuplicateLocation(lat: number, lng: number) {
    if (this.allDorms.length === 0) return;
    for (const dorm of this.allDorms) {
      if (dorm.lat && dorm.lng) {
        const dist = this.getDistanceFromLatLonInKm(lat, lng, dorm.lat, dorm.lng);
        if (dist < 0.02) { // less than 20 meters
          const alert = await this.alertCtrl.create({
            header: 'เธเธเธ•เธณเนเธซเธเนเธเธ—เธตเนเธเนเธณเธเธฑเธ',
            message: `เธเธดเธเธฑเธ”เธเธตเนเธญเธขเธนเนเนเธเธฅเนเน€เธเธตเธขเธเธเธฑเธเธซเธญเธเธฑเธ <b>${dorm.DORM_NAME || dorm.DORMNAME}</b> เธกเธฒเธ (เธฃเธฐเธขเธฐเธซเนเธฒเธเธเธฃเธฐเธกเธฒเธ“ ${Math.round(dist * 1000)} เน€เธกเธ•เธฃ) เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเนเธเนเธเธดเธเธฑเธ”เธเธตเนเธเธฃเธดเธเน เนเธเนเธซเธฃเธทเธญเนเธกเน?`,
            buttons: ['เธ•เธเธฅเธ']
          });
          await alert.present();
          break; // alert once
        }
      }
    }
  }

  onInputCoordChange() {
    if (this.formData.lat && this.formData.lng) {
      this.markerPosition = { lat: Number(this.formData.lat), lng: Number(this.formData.lng) };
      this.center = { ...this.markerPosition };
      this.calculateNearestZone(this.markerPosition.lat, this.markerPosition.lng);
      this.geocodeAddress(this.formData.lat, this.formData.lng);
    }
  }

  // ==========================
  // เธซเนเธญเธเธเธฑเธ
  // ==========================
  addRoomType() {
    this.roomTypes.push({
      id: null, 
      selectedType: this.roomTypesDB.length > 0 ? (this.roomTypesDB[0].name || this.roomTypesDB[0].ROOM_TYPE_NAME) : 'เธซเนเธญเธเนเธญเธฃเน',
      roomType: this.roomTypesDB.length > 0 ? (this.roomTypesDB[0].name || this.roomTypesDB[0].ROOM_TYPE_NAME) : 'เธซเนเธญเธเนเธญเธฃเน',
      bedType: this.bedTypesDB.length > 0 ? (this.bedTypesDB[0].id || this.bedTypesDB[0].BED_TYPE_ID)?.toString() : '1', 
      prices: this.priceTypes.map(pt => ({ priceTypeId: pt.id, name: pt.name, price: null }))
    });
  }

  removeRoomType(index: number) {
    if (this.roomTypes.length > 1) this.roomTypes.splice(index, 1);
  }

  onRoomTypeChange(room: any) {
    if (room.selectedType !== 'custom') {
      room.roomType = room.selectedType;
    } else {
      room.roomType = '';
    }
  }

  // ==========================
  // เธฃเธนเธเธ เธฒเธ
  // ==========================
  onFileSelect(event: any, field: string) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      this.showToast('เธฃเธญเธเธฃเธฑเธเน€เธเธเธฒเธฐเนเธเธฅเนเธฃเธนเธเธ เธฒเธ JPG เธซเธฃเธทเธญ PNG เน€เธ—เนเธฒเธเธฑเนเธ', 'warning');
      return;
    }

    // โ… เน€เธเนเธเธเธเธฒเธ”เน€เธเธดเธ 5MB
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('เธเธเธฒเธ”เนเธเธฅเนเนเธซเธเนเน€เธเธดเธเนเธ (เธชเธนเธเธชเธธเธ” 5MB)', 'warning');
      return;
    }

    this.selectedFiles[field] = file;
    const reader = new FileReader();
    reader.onload = () => { this.previews[field] = reader.result; };
    reader.readAsDataURL(file);
  }

  onPaste(event: ClipboardEvent, field: string) {
    if (this.isReadOnly) return;
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          if (file.size > 5 * 1024 * 1024) {
            this.showToast('เธ เธฒเธเธ—เธตเนเธงเธฒเธเธกเธตเธเธเธฒเธ”เนเธซเธเนเน€เธเธดเธเนเธ (เธชเธนเธเธชเธธเธ” 5MB)', 'warning');
            return;
          }
          this.selectedFiles[field] = file;
          const reader = new FileReader();
          reader.onload = () => {
            this.previews[field] = reader.result;
          };
          reader.readAsDataURL(file);
          this.showToast('เธงเธฒเธเธฃเธนเธเธ เธฒเธเธชเธณเน€เธฃเนเธ', 'success');
        }
        break; // Process only the first image pasted
      }
    }
  }

  onGallerySelect(event: any) {
    const files = event.target.files;
    if (!files) return;

    const currentCount = this.selectedFiles.OTHER_IMG.length;
    if (currentCount + files.length > 5) {
      this.showToast('เธเธธเธ“เธญเธฑเธเนเธซเธฅเธ”เธฃเธนเธเธ เธฒเธเนเธ”เนเธชเธนเธเธชเธธเธ” 5 เธฃเธนเธ', 'warning');
      return;
    }

    let hasOversized = false;
    for (let i = 0; i < files.length; i++) {
      if (files[i].type !== 'image/jpeg' && files[i].type !== 'image/png') {
        this.showToast(`เนเธเธฅเน ${files[i].name} เนเธกเนเธฃเธญเธเธฃเธฑเธ (เน€เธเธเธฒเธฐ JPG/PNG)`, 'warning');
        continue;
      }
      if (files[i].size > 5 * 1024 * 1024) {
        hasOversized = true;
      } else {
        this.selectedFiles.OTHER_IMG.push(files[i]);
        const reader = new FileReader();
        reader.onload = (e) => { this.previews.OTHER_IMG.push(e.target?.result); };
        reader.readAsDataURL(files[i]);
      }
    }

    if (hasOversized) {
      this.showToast('เธกเธตเธฃเธนเธเธ เธฒเธเธเธฒเธเธฃเธนเธเธเธเธฒเธ”เน€เธเธดเธ 5MB เธเธถเธเนเธกเนเธ–เธนเธเน€เธเธดเนเธก', 'warning');
    }
  }

  removeGalleryImage(index: number, isExisting: boolean = false) {
    if (isExisting) {
      this.existingGallery.splice(index, 1);
    } else {
      this.previews.OTHER_IMG.splice(index, 1);
      this.selectedFiles.OTHER_IMG.splice(index, 1);
    }
  }

  // =========== Custom Facility Modal State ===========
  isAddFacilityModalOpen = false;  // controls overlay div (not ion-modal)
  newFacilityName = '';
  newFacilityCustomIcon: string | null = null; // store base64 string
  
  availableIcons = [
    'air-conditioner.png', 'bed.png', 'business-fill.png', 'business-outline.png',
    'cabin.png', 'cable-tv.png', 'car-parking.png', 'cctv-camera.png', 'desk.png',
    'elevator.png', 'fan.png', 'fingerprint.png', 'frig.png', 'furnitures.png',
    'garage.png', 'gym.png', 'home.png', 'key.png', 'kitchen-set.png',
    'laundry-machine.png', 'mart.png', 'motorcycle-parking.png', 'pet.png',
    'policeman.png', 'quarantine.png', 'recycle-bin.png', 'seater-sofa.png',
    'star.png', 'swimming-pool.png', 'tv.png', 'user.png', 'wardrobe.png',
    'water-heater.png', 'wifi.png', 'woman-hair.png'
  ];

  suggestNewFacility() {
    if (this.formData.new_facilities.length >= 4) {
      this.showToast('เธเธธเธ“เธชเธฒเธกเธฒเธฃเธ–เน€เธชเธเธญเธชเธดเนเธเธญเธณเธเธงเธขเธเธงเธฒเธกเธชเธฐเธ”เธงเธเนเธซเธกเนเนเธ”เนเธชเธนเธเธชเธธเธ” 4 เธฃเธฒเธขเธเธฒเธฃ', 'warning');
      return;
    }
    
    // Reset state and open modal
    this.newFacilityName = '';
    this.newFacilityCustomIcon = null;
    this.isAddFacilityModalOpen = true;
  }

  selectFacilityIcon(iconFile: string) {
    //
  }

  onCustomIconSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
        this.showToast('เธฃเธญเธเธฃเธฑเธเน€เธเธเธฒเธฐเนเธเธฅเนเธฃเธนเธเธ เธฒเธ JPG เธซเธฃเธทเธญ PNG เน€เธ—เนเธฒเธเธฑเนเธ', 'warning');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('เธเธเธฒเธ”เนเธญเธเธญเธเนเธซเธเนเน€เธเธดเธเนเธ (เธชเธนเธเธชเธธเธ” 5MB)', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.newFacilityCustomIcon = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  closeAddFacilityModal() {
    this.isAddFacilityModalOpen = false;
  }

  async confirmAddFacility() {
    const trimmedName = this.newFacilityName ? this.newFacilityName.trim() : '';
    if (!trimmedName) {
      this.showToast('เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธเธทเนเธญเธชเธดเนเธเธญเธณเธเธงเธขเธเธงเธฒเธกเธชเธฐเธ”เธงเธ', 'warning');
      return;
    }
    
    // 1. Check existing facilities
    const existsInMain = this.facilities.some(f => f.name.toLowerCase() === trimmedName.toLowerCase());
    const existsInNew = this.formData.new_facilities.some((f: any) => f.name.toLowerCase() === trimmedName.toLowerCase());
    
    if (existsInMain || existsInNew) {
      this.showToast(`เธชเธดเนเธเธญเธณเธเธงเธขเธเธงเธฒเธกเธชเธฐเธ”เธงเธ "${trimmedName}" เธกเธตเธญเธขเธนเนเนเธฅเนเธงเนเธเธฃเธฐเธเธ`, 'danger');
      return;
    }
    
    const alert = await this.alertCtrl.create({
      header: 'เธขเธทเธเธขเธฑเธเธเธฒเธฃเน€เธเธดเนเธก',
      message: `เธ•เนเธญเธเธเธฒเธฃเน€เธเธดเนเธก "${trimmedName}" เนเธเนเธซเธฃเธทเธญเนเธกเน?<br>เธชเธดเธ—เธเธดเนเธเธเน€เธซเธฅเธทเธญ: ${4 - this.formData.new_facilities.length - 1} เธฃเธฒเธขเธเธฒเธฃ`,
      buttons: [
        { text: 'เธขเธเน€เธฅเธดเธ', role: 'cancel' },
        {
          text: 'เธ•เธเธฅเธ',
          handler: () => {
            // 3. Add to new facilities
            this.formData.new_facilities.push({
              name: trimmedName,
              icon: this.newFacilityCustomIcon ? this.newFacilityCustomIcon : ''
            });
            this.closeAddFacilityModal();
            this.showToast('เน€เธเธดเนเธกเธชเธดเนเธเธญเธณเธเธงเธขเธเธงเธฒเธกเธชเธฐเธ”เธงเธเธชเธณเน€เธฃเนเธ', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  removeNewFacility(index: number) {
    this.formData.new_facilities.splice(index, 1);
  }

  // ==========================
  // Submit
  // ==========================
  async onSubmit() {
    const hasFront = this.selectedFiles.FRONT_DORM_IMG || this.previews.FRONT_DORM_IMG;
    const hasLicense = this.isApproved || this.selectedFiles.LICENSE_IMG || this.previews.LICENSE_IMG;
    
    if (!hasFront || !hasLicense) {
      this.showToast('กรุณาแนบ รูปหน้าหอพัก และ เอกสารใบอนุญาตฯ ให้ครบ', 'warning');
      return;
    }
    const requiredRoomImgs = [
      { key: 'BED_IMG', label: '1. เตียงนอน' },
      { key: 'WALL_IMG', label: '2. ผนังห้อง' },
      { key: 'CEILING_IMG', label: '3. เพดาน' },
      { key: 'FLOOR_IMG', label: '4. พื้น' },
      { key: 'BATHROOM_IMG', label: '5. ห้องน้ำ' },
    ];
    for (const img of requiredRoomImgs) {
      if (!this.selectedFiles[img.key] && !this.previews[img.key]) {
        this.showToast(กรุณาแนบรูปภาพส่วนประกอบห้อง: , 'warning');
        return;
      }
    }

    // Show Preview Modal using DormDetailPage
    const previewData = {
      DORM_NAME: this.formData.name || 'ไม่ได้ระบุชื่อหอพัก',
      ADDRESS: this.formData.address || 'ไม่ได้ระบุที่อยู่',
      lat: this.formData.lat,
      lng: this.formData.lng,
      ZONE_NAME: this.zones.find(z => z.ZONE_ID === Number(this.formData.zone_id))?.ZONE_NAME || 'ไม่ได้ระบุโซน',
      DORM_TYPE_NAME: this.dormTypesDB.find(t => t.id === Number(this.formData.type_id))?.name || '',
      start_price: null,
      term_price: null,
      water_unit: this.formData.water_unit,
      water_lump: this.formData.water_lump,
      elect_unit: this.formData.elect_unit,
      description: this.formData.detail,
      facilities: this.facilities.filter((f: any) => f.checked).map((f: any) => ({ name: f.name, icon: f.icon })),
      new_facilities: this.formData.new_facilities || [],
      rooms: this.roomTypes.map(r => ({
        roomType: r.selectedType === 'custom' ? r.roomType : r.selectedType,
        bedType: r.bedType,
        prices: r.prices
      })),
      image: this.previews.FRONT_DORM_IMG || 'assets/dorm-placeholder.jpg',
      gallery: this.previews.OTHER_IMG || []
    };

    const modal = await this.modalCtrl.create({
      component: DormDetailPage,
      componentProps: {
        dormData: previewData,
        isPopup: true
      }
    });

    await modal.present();

    const { role } = await modal.onDidDismiss();
    if (role === 'confirm') {
      this.processSaveData();
    }
  }

  getCheckedFacilitiesCount(): number {
    return this.facilities?.filter((fac: any) => fac.checked).length ?? 0;
  }

  // โ… เน€เธฃเธตเธขเธเธ•เธญเธเธเธ” "เธขเธทเธเธขเธฑเธเธชเนเธเธเนเธญเธกเธนเธฅ" เนเธ preview-modal
  onPreviewConfirmed() {
    this.showPreviewModal = false;
    this.processSaveData();
  }

  // โ… เน€เธฃเธตเธขเธเธ•เธญเธเธเธ” "เธเธฅเธฑเธเนเธเนเธเนเนเธ" เนเธ preview-modal
  onPreviewCancelled() {
    this.showPreviewModal = false;
  }

  getIconPath(iconPath: string): string {
    if (!iconPath) return '';
    if (iconPath.startsWith('assets/icon/')) {
      return iconPath.replace('assets/icon/', 'assets/allIcons/');
    }
    return iconPath;
  }

  async processSaveData() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({
      message: 'เธเธณเธฅเธฑเธเธชเนเธเธเนเธญเธกเธนเธฅ...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const form = new FormData();

      // โ… FIX: เธชเนเธ user_id (USER_ID เธเธฒเธ USERS table)
      // Backend เธเธฐเนเธ lookup DORM_OWNER_ID เน€เธญเธ
      // เธ–เนเธฒ Admin เธขเธฑเธเนเธกเนเธกเธต DORM_OWNERS record โ’ Backend เธ•เนเธญเธ auto-create
      const finalOwnerId = (this.isAdmin && this.selectedOwnerId) ? this.selectedOwnerId : this.ownerId;
      form.append('user_id', finalOwnerId.toString());
      form.append('name', this.formData.name?.trim() || '');
      form.append('address', this.formData.address?.trim() || '');
      form.append('lat', (this.formData.lat || 16.245279).toString());
      form.append('lng', (this.formData.lng || 103.250106).toString());
      form.append('zone_id', (this.formData.zone_id || 1).toString());
      form.append('type_id', (this.formData.type_id || 1).toString());
      form.append('detail', this.formData.detail?.trim() || '');
      form.append('water_unit', (this.formData.water_unit || 0).toString());
      form.append('water_lump', (this.formData.water_lump || 0).toString());
      form.append('elect_unit', (this.formData.elect_unit || 0).toString());

      // โ… FIX: format roomTypes เนเธซเนเธ•เธฃเธเธเธฑเธเธ—เธตเน Backend เธ•เนเธญเธเธเธฒเธฃ
      const roomTypesFormatted = this.roomTypes.map(r => ({
        roomType: r.selectedType === 'custom' ? (r.roomType || 'เธญเธทเนเธเน') : r.selectedType,
        bedType: r.bedType || '1',
        prices: r.prices
      }));
      form.append('roomTypes', JSON.stringify(roomTypesFormatted));

      const selectedFacIds = this.facilities
        .filter((f: any) => f.checked)
        .map((f: any) => f.id);
      form.append('facilities', JSON.stringify(selectedFacIds));

      if (this.formData.new_facilities && this.formData.new_facilities.length > 0) {
        form.append('new_facilities', JSON.stringify(this.formData.new_facilities));
      }

      // เธฃเธนเธเธ เธฒเธ
      if (this.selectedFiles.FRONT_DORM_IMG) form.append('FRONT_DORM_IMG', this.selectedFiles.FRONT_DORM_IMG);
      if (this.selectedFiles.LICENSE_IMG) form.append('LICENSE_IMG', this.selectedFiles.LICENSE_IMG);
      if (this.selectedFiles.BED_IMG) form.append('BED_IMG', this.selectedFiles.BED_IMG);
      if (this.selectedFiles.WALL_IMG) form.append('WALL_IMG', this.selectedFiles.WALL_IMG);
      if (this.selectedFiles.CEILING_IMG) form.append('CEILING_IMG', this.selectedFiles.CEILING_IMG);
      if (this.selectedFiles.FLOOR_IMG) form.append('FLOOR_IMG', this.selectedFiles.FLOOR_IMG);
      if (this.selectedFiles.BATHROOM_IMG) form.append('BATHROOM_IMG', this.selectedFiles.BATHROOM_IMG);
      if (this.selectedFiles.BALCONY_IMG) form.append('BALCONY_IMG', this.selectedFiles.BALCONY_IMG);

      if (this.selectedFiles.OTHER_IMG?.length > 0) {
        this.selectedFiles.OTHER_IMG.forEach((file: File) => {
          form.append('OTHER_IMG', file);
        });
      }

      // Debug log เธเนเธญเธเธชเนเธ
      console.log('๐“ค Submitting FormData:');
      form.forEach((val, key) => console.log(`  ${key}:`, typeof val === 'string' ? val : '[File]'));

      if (this.dormId) {
        await this.dormService.updateDorm(this.dormId, form);
      } else {
        await lastValueFrom(this.dormService.createDorm(form));
      }

      await loading.dismiss();
      this.showSuccessFlow();

    } catch (error: any) {
      await loading.dismiss();
      const serverMsg =
        error?.error?.message ||
        error?.error?.error ||
        error?.message ||
        'เนเธกเนเธ—เธฃเธฒเธเธชเธฒเน€เธซเธ•เธธ';
      console.error('โ createDorm error:', error);
      console.error('๐“ฉ Server message:', serverMsg);
      this.showToast(`เธเธฑเธเธ—เธถเธเนเธกเนเธชเธณเน€เธฃเนเธ: ${serverMsg}`, 'danger');
    } finally {
      this.isSubmitting = false;
    }
  }

  async showSuccessFlow() {
    this.showSuccessModal = true;
  }

  // โ… เน€เธฃเธตเธขเธเธ•เธญเธเธเธ” "เธ•เธเธฅเธเธฃเธฑเธเธ—เธฃเธฒเธ" เนเธ success-modal
  onSuccessConfirmed() {
    this.showSuccessModal = false;
    this.router.navigate(['/my-dorms']);
  }

  submitAgain() {
    this.formState = 'editing';
    this.isReadOnly = false;
    this.rejectReason = '';
  }

  viewPendingInfo() {
    this.formState = 'editing';
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg, duration: 2800, color, position: 'bottom',
      cssClass: 'custom-toast'
    });
    toast.present();
  }
}



