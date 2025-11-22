import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ActionSheetController } from '@ionic/angular'; // <--- เพิ่ม ActionSheetController
import { Router, RouterModule } from '@angular/router';
import * as L from 'leaflet';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class HomePage implements OnInit {

  map: L.Map | undefined;
  searchText: string = ''; // ตัวแปรเก็บข้อความค้นหา

  constructor(
    private router: Router,
    private actionSheetCtrl: ActionSheetController // ฉีดตัวจัดการ ActionSheet เข้ามา
  ) {}

  ngOnInit() {}

  ionViewDidEnter() {
    this.loadMap();
  }

  loadMap() {
    // ... (โค้ดแผนที่เดิมของคุณ ไม่ต้องแก้) ...
    if (this.map) {
      this.map.remove();
    }
    this.map = L.map('map').setView([16.246, 103.252], 14);

    L.tileLayer('https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=cb153d15cb4e41f59e25cfda6468f1a0', {
      attribution: 'Maps © Thunderforest, Data © OpenStreetMap contributors',
      maxZoom: 22
    }).addTo(this.map);

    const iconDefault = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    L.marker([16.248, 103.250], {icon: iconDefault}).addTo(this.map!)
      .bindPopup('<b>หอพักหญิงจิณณ์</b><br>ราคา 3,500 บาท');
      
    L.marker([16.245, 103.255], {icon: iconDefault}).addTo(this.map!)
      .bindPopup('<b>หอพักธนาปาร์ค</b><br>ราคา 4,000 บาท');
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  // --- 👇 ฟังก์ชันใหม่ที่เพิ่มเข้ามา 👇 ---

  // 1. ฟังก์ชันค้นหา
  onSearch() {
    console.log('กำลังค้นหา:', this.searchText);
    // ไปหน้า Search พร้อมส่งคำค้นหาไปทาง URL (ถ้าต้องการ)
    this.router.navigate(['/search'], { queryParams: { q: this.searchText } });
  }

  // 2. ฟังก์ชันเปิดเมนูกรอง (Action Sheet)
  async openFilter() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'กรองข้อมูลหอพัก',
      buttons: [
        {
          text: 'ราคา: น้อยไปมาก',
          icon: 'arrow-up-outline',
          handler: () => { console.log('เลือกกรองราคาขึ้น'); }
        },
        {
          text: 'ราคา: มากไปน้อย',
          icon: 'arrow-down-outline',
          handler: () => { console.log('เลือกกรองราคาลง'); }
        },
        {
          text: 'ใกล้ฉันที่สุด',
          icon: 'navigate-outline',
          handler: () => { console.log('เลือกใกล้ฉัน'); }
        },
        {
          text: 'ยกเลิก',
          role: 'cancel',
          icon: 'close',
        }
      ]
    });
    await actionSheet.present();
  }

  // 3. ฟังก์ชันไปหน้าเปรียบเทียบ
  goToCompare() {
    console.log('ไปหน้าเปรียบเทียบ');
    this.router.navigate(['/compare']);
  }

}