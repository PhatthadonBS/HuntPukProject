import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ActionSheetController, ToastController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import * as L from 'leaflet';

// Import Service และ Interface ที่เราสร้างไว้
import { DormitoryService, DormitoryData } from '../../services/dormitory';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule, HttpClientModule]
})
export class HomePage implements OnInit {

  map: L.Map | undefined;
  searchText: string = '';
  dorms: DormitoryData[] = []; // ตัวแปรเก็บข้อมูลหอพักจาก API

  constructor(
    private router: Router,
    private actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController,
    private dormService: DormitoryService // เรียกใช้ Service
  ) {}

  ngOnInit() {
    // โหลดข้อมูลหอพักทันทีที่เปิดหน้า
    this.fetchDorms();
  }

  ionViewDidEnter() {
    this.loadMap();
  }

  // --- 1. ฟังก์ชันดึงข้อมูลจาก API ---
  fetchDorms() {
    this.dormService.getAllDorms().subscribe({
      next: (res: { success: any; data: DormitoryData[]; }) => {
        if (res.success) {
          this.dorms = res.data;
          console.log('Got dorms:', this.dorms);
          
          // ถ้าโหลด map เสร็จแล้ว ให้ปักหมุดทันที
          if (this.map) {
            this.updateMarkers();
          }
        }
      },
      error: (err: any) => {
        console.error('Error fetching dorms:', err);
        this.presentToast('ไม่สามารถโหลดข้อมูลหอพักได้');
      }
    });
  }

  // --- 2. ฟังก์ชันโหลดแผนที่ ---
  loadMap() {
    // ป้องกัน Map ซ้อนกัน
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }

    // กำหนดพิกัดเริ่มต้น (ตัวอย่าง: ม.มหาสารคาม หรือพิกัดกลางโซนที่คุณต้องการ)
    this.map = L.map('map').setView([16.246, 103.252], 14);

    L.tileLayer('https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=cb153d15cb4e41f59e25cfda6468f1a0', {
      attribution: 'Maps © Thunderforest, Data © OpenStreetMap contributors',
      maxZoom: 22
    }).addTo(this.map);

    // ถ้ามีข้อมูลหอพักอยู่แล้ว (โหลดเสร็จก่อน map) ให้ปักหมุดเลย
    if (this.dorms.length > 0) {
      this.updateMarkers();
    }
  }

  // --- 3. ฟังก์ชันปักหมุด (Markers) ---
  updateMarkers() {
    if (!this.map) return;

    const iconDefault = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.dorms.forEach((dorm) => {
      // ตรวจสอบว่ามีพิกัดครบถ้วน
      if (dorm.lat && dorm.lng) {
        const marker = L.marker([dorm.lat, dorm.lng], { icon: iconDefault })
          .addTo(this.map!);

        // สร้าง Popup HTML
        const popupContent = `
          <div style="text-align:center; font-family: 'Kanit', sans-serif;">
            <b style="font-size:16px;">${dorm.DORM_NAME}</b><br>
            <span style="color:gray; font-size:12px;">${dorm.ZONE_NAME || ''}</span><br>
            <span style="color:#2dd36f; font-weight:bold;">เริ่มต้น ${dorm.start_price ? dorm.start_price.toLocaleString() : '-'} บาท</span><br>
            <button id="btn-dorm-${dorm.DORM_ID}" style="margin-top:8px; background:#3880ff; color:white; border:none; padding:5px 12px; border-radius:15px; cursor:pointer;">
              ดูรายละเอียด
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);

        // ดักจับ Event Click บนปุ่มใน Popup
        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-dorm-${dorm.DORM_ID}`);
          if (btn) {
            btn.addEventListener('click', () => {
              this.router.navigate(['/dorms', dorm.DORM_ID]); // ลิงก์ไปหน้า Detail
            });
          }
        });
      }
    });
  }

  // --- ฟังก์ชันอื่นๆ ---
  onSearch() {
    if (this.searchText.trim() !== '') {
      this.dormService.searchDorms(this.searchText).subscribe(res => {
        if(res.success) {
          this.dorms = res.data;
          this.loadMap(); // รีโหลดแมพเพื่อเคลียร์หมุดเก่าและลงหมุดใหม่
        }
      });
    } else {
      this.fetchDorms(); // ถ้าช่องค้นหาว่าง ให้โหลดทั้งหมดใหม่
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  async openFilter() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'กรองข้อมูลหอพัก',
      buttons: [
        { text: 'ราคา: น้อยไปมาก', icon: 'arrow-up-outline', handler: () => { console.log('Sort Price ASC'); } },
        { text: 'ราคา: มากไปน้อย', icon: 'arrow-down-outline', handler: () => { console.log('Sort Price DESC'); } },
        { text: 'ใกล้ฉันที่สุด', icon: 'navigate-outline', handler: () => { console.log('Nearest'); } },
        { text: 'ยกเลิก', role: 'cancel', icon: 'close' }
      ]
    });
    await actionSheet.present();
  }

  goToCompare() {
    this.router.navigate(['/compare']);
  }

  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
}