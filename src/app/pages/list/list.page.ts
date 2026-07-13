import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController, AlertController, ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { bookmark, bookmarkOutline, locationSharp, home, search, arrowBack, star, locationOutline, menuOutline, optionsOutline, closeCircle, swapVerticalOutline } from 'ionicons/icons';

import { DormitoryService, Dormitory } from '../../services/dormitory'; 
import { UserService } from '../../services/user'; 
import { HeaderComponent } from '../../components/header/header.component'; 

@Component({
  selector: 'app-list',
  templateUrl: './list.page.html',
  styleUrls: ['./list.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HeaderComponent] 
})
export class ListPage implements OnInit {

  dorms: Dormitory[] = [];
  keyword: string = '';
  currentUserId: number = 0;
  currentUser: any = null; 
  isLoading: boolean = true; 
  dormStatusList: any[] = [];

  allDorms: Dormitory[] = [];
  isModalOpen = false;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  selectedZone: string = '';
  minScore: number | null = null;
  maxWater: number | null = null;
  maxElect: number | null = null;
  zoneOptions: any[] = [];
  currentSort: string = ''; // 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'score_desc'

  constructor(
    private router: Router, 
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController, 
    private actionSheetCtrl: ActionSheetController,
    private dormService: DormitoryService,
    private userService: UserService
  ) { 
    // ✅ เพิ่ม menuOutline, optionsOutline, closeCircle เข้าไปในระบบไอคอน
    addIcons({ bookmark, bookmarkOutline, locationSharp, home, search, arrowBack, star, locationOutline, 'menu-outline': menuOutline, 'options-outline': optionsOutline, 'close-circle': closeCircle, 'swap-vertical-outline': swapVerticalOutline });
  }

  ngOnInit() {
    this.checkLoginStatus(); 
    this.fetchZones();
    this.fetchDormStatuses();
    this.loadDorms();
  }

  async fetchZones() {
    try { const res = await this.dormService.getZones(); if (res.success) this.zoneOptions = res.data; } 
    catch (error) { console.error('Fetch Zones Error:', error); }
  }

  fetchDormStatuses() {
    this.dormService.getDormStatuses().subscribe({
      next: (res: any) => this.dormStatusList = res.data || res,
      error: () => console.error('Failed to load dorm statuses')
    });
  }

  checkLoginStatus() {
    this.currentUser = null;
    this.currentUserId = 0; 
    const storedData = localStorage.getItem('loggedIn');
    if (storedData) {
      try {
        const userObj = JSON.parse(storedData);
        this.currentUser = userObj.user ? userObj.user : userObj;
        this.currentUserId = Number(this.currentUser?.id || this.currentUser?.USER_ID || 0);
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }

  async loadDorms() {
    this.isLoading = true; 
    try {
      const res = await this.dormService.getAllDorms();
      let favoriteIds: number[] = [];
      if (this.currentUserId !== 0) {
        try {
           const favRes = await this.dormService.getMyFavorites(this.currentUserId);
           if (favRes) {
              favoriteIds = (favRes as any[]).map(f => Number(f.DORM_ID || f.dorm_id));
           }
        } catch (e) { console.error('Fetch fav error:', e); }
      }

      if (res && res.data) {
        this.allDorms = res.data.map((d: any) => ({ 
          ...d, 
          isChecked: favoriteIds.includes(Number(d.DORM_ID || d.id))
        })) as any[];        
        this.dorms = [...this.allDorms];
        this.performSearch(); // Apply filters if any
      } else {
        this.dorms = [];
      }
    } catch (error) { console.error('Error loading dorms:', error); } 
    finally { setTimeout(() => { this.isLoading = false; }, 300); }
  }

  async onSearch(event?: any) {
    if (event !== undefined) { this.keyword = (typeof event === 'string' ? event : event?.target?.value || '').trim(); }
    this.performSearch();
  }

  async performSearch() {
    this.isLoading = true;
    try {
      const res = await this.dormService.searchDorms(
        this.keyword, 
        this.selectedZone, 
        this.minPrice !== null ? this.minPrice : undefined, 
        this.maxPrice !== null ? this.maxPrice : undefined
      );
      if (res && res.data) {
        let tempDorms = res.data.map((d: any) => ({ 
          ...d, 
          isChecked: this.allDorms.find(ad => ad.DORM_ID === d.DORM_ID)?.isChecked 
        })) as any[];
        
        if (this.minScore !== null && this.minScore !== undefined) tempDorms = tempDorms.filter((dorm: any) => dorm.SCORE >= this.minScore!);
        if (this.maxWater !== null && this.maxWater !== undefined) tempDorms = tempDorms.filter((dorm: any) => dorm.WATER_UNIT <= this.maxWater! || dorm.WATER_LUMP <= this.maxWater!);
        if (this.maxElect !== null && this.maxElect !== undefined) tempDorms = tempDorms.filter((dorm: any) => dorm.ELECT_UNIT <= this.maxElect!);

        this.dorms = tempDorms;
        this.applySort(); // Apply sort after filtering
      } else {
        this.dorms = [];
      }
    } catch (err) { console.error('Search Error:', err); }
    finally { this.isLoading = false; }
  }

  setOpen(isOpen: boolean) { this.isModalOpen = isOpen; }
  openFilter() { this.setOpen(true); }
  
  clearAllFilters() {
    this.minPrice = null; this.maxPrice = null; this.selectedZone = '';
    this.minScore = null; this.maxWater = null; this.maxElect = null;
  }

  applyFilter() { this.setOpen(false); this.performSearch(); }

  async openSort() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'จัดเรียงลำดับ',
      cssClass: 'custom-action-sheet',
      buttons: [
        { text: 'ราคา: ต่ำ - สูง', handler: () => { this.currentSort = 'price_asc'; this.applySort(); } },
        { text: 'ราคา: สูง - ต่ำ', handler: () => { this.currentSort = 'price_desc'; this.applySort(); } },
        { text: 'ชื่อ: ก - ฮ', handler: () => { this.currentSort = 'name_asc'; this.applySort(); } },
        { text: 'ชื่อ: ฮ - ก', handler: () => { this.currentSort = 'name_desc'; this.applySort(); } },
        { text: 'คะแนนรีวิว: มาก - น้อย', handler: () => { this.currentSort = 'score_desc'; this.applySort(); } },
        { text: 'ยกเลิกการจัดเรียง', role: 'destructive', handler: () => { this.currentSort = ''; this.performSearch(); } },
        { text: 'ปิด', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  applySort() {
    if (!this.currentSort) return;
    
    this.dorms.sort((a: any, b: any) => {
      switch (this.currentSort) {
        case 'price_asc': return (a.start_price || 0) - (b.start_price || 0);
        case 'price_desc': return (b.start_price || 0) - (a.start_price || 0);
        case 'name_asc': return (a.DORM_NAME || '').localeCompare(b.DORM_NAME || '', 'th');
        case 'name_desc': return (b.DORM_NAME || '').localeCompare(a.DORM_NAME || '', 'th');
        case 'score_desc': return (b.SCORE || 0) - (a.SCORE || 0);
        default: return 0;
      }
    });
  }

  async toggleFavorite(event: Event, dorm: any) {
    event.stopPropagation(); 
    event.preventDefault(); 

    if (!this.currentUser || this.currentUserId === 0) {
        const alert = await this.alertCtrl.create({
            header: 'แจ้งเตือน',
            message: 'กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อน เพื่อเลือกหอพักที่คุณสนใจครับ',
            buttons: [
                { text: 'ยกเลิก', role: 'cancel' },
                { text: 'เข้าสู่ระบบ', handler: () => this.router.navigate(['/login']) }
            ]
        });
        await alert.present();
        return;
    }

    if (dorm.isChecked) {
        const alert = await this.alertCtrl.create({
            header: 'ยกเลิกการสนใจ',
            message: 'คุณต้องการยกเลิกการสนใจหอพักนี้ใช่หรือไม่?',
            buttons: [
                { text: 'ไม่', role: 'cancel' },
                { 
                  text: 'ใช่, ยกเลิก', 
                  handler: async () => {
                    try {
                        await this.dormService.removeFavorite(this.currentUserId, dorm.DORM_ID);
                        dorm.isChecked = false;
                        this.showToast('ยกเลิกการสนใจเรียบร้อย', 'medium');
                    } catch (error) {
                        this.showToast('เกิดข้อผิดพลาดในการยกเลิก', 'danger');
                    }
                  }
                }
            ]
        });
        await alert.present();
        return;
    }

    const alert = await this.alertCtrl.create({
        header: 'ยืนยัน',
        message: 'คุณสนใจหอพักนี้ใช่หรือไม่?',
        buttons: [
            { text: 'ยกเลิก', role: 'cancel' },
            { 
              text: 'ใช่, สนใจ', 
              handler: async () => {
                try {
                  await this.dormService.addFavorite(this.currentUserId, dorm.DORM_ID);
                  dorm.isChecked = true; 
                  this.showToast(`เพิ่ม "${dorm.DORM_NAME}" ลงรายการสนใจเรียบร้อย!`, 'success');
                } catch (error: any) {
                  if (error.status === 409 || (error.error && error.error.message === 'Duplicate')) {
                     dorm.isChecked = true;
                     this.showToast('หอพักนี้มีในรายการสนใจแล้วครับ', 'warning');
                  } else {
                     this.showToast('เกิดข้อผิดพลาดในการบันทึก', 'danger');
                  }
                }
              }
            }
        ]
    });
    await alert.present();
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg, duration: 2500, color: color, position: 'bottom',
      buttons: [{ text: 'ปิด', role: 'cancel' }] 
    });
    await toast.present(); 
  }

  goToDetail(dorm: any) { this.router.navigate(['/dorm-detail', dorm.DORM_ID]); }
  goBack() { this.navCtrl.back(); }

  // 🌟 ฟังก์ชันเปิดเมนูด้านข้าง
  openMenu() { window.dispatchEvent(new CustomEvent('toggle-sidebar')); }
}