import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // <--- เพิ่ม
import { FormsModule } from '@angular/forms';     // <--- เพิ่ม
import { IonicModule } from '@ionic/angular';     // <--- สำคัญมาก! ต้อง import อันนี้
import { Router, RouterModule } from '@angular/router';
import * as L from 'leaflet';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,  // <--- สังเกตบรรทัดนี้ ถ้ามีแปลว่าเป็น Standalone
  imports: [CommonModule, FormsModule, IonicModule,RouterModule] // <--- ใส่ IonicModule เข้าไปในวงเล็บนี้ครับ
})
export class HomePage implements OnInit {

  map: L.Map | undefined;

  constructor(private router: Router) {}

  ngOnInit() {
  }

  ionViewDidEnter() {
    this.loadMap();
  }
   loadMap() {
    // ... (โค้ดส่วนสร้าง map อันเดิม) ...
    if (this.map) {
      this.map.remove();
    }
    this.map = L.map('map').setView([16.246, 103.252], 14);

    L.tileLayer('https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=cb153d15cb4e41f59e25cfda6468f1a0', {
      attribution: 'Maps © Thunderforest, Data © OpenStreetMap contributors',
      maxZoom: 22
    }).addTo(this.map);

    // -----------------------------------------------------------
    // 👇 แก้ไขตรงนี้ครับ (ใช้ลิงก์รูปออนไลน์ แทน asset ในเครื่อง)
    // -----------------------------------------------------------
    const iconDefault = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    // ปักหมุดโดยใช้ไอคอนออนไลน์
    L.marker([16.248, 103.250], {icon: iconDefault}).addTo(this.map!) // ใส่ ! เพื่อบอกว่า map มีค่าแน่ๆ
      .bindPopup('<b>หอพักหญิงจิณณ์</b><br>ราคา 3,500 บาท');
      
    // ลองปักเพิ่มอีกจุด
    L.marker([16.245, 103.255], {icon: iconDefault}).addTo(this.map!)
      .bindPopup('<b>หอพักธนาปาร์ค</b><br>ราคา 4,000 บาท');
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}