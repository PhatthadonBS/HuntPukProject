import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
// ✅ เพิ่ม checkmark-circle-outline สำหรับไอคอนติ๊กถูก
import { star, starHalf, locationOutline, callOutline, wifi, car, snow, checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-dorm-detail',
  templateUrl: './dorm-detail.page.html',
  styleUrls: ['./dorm-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class DormDetailPage implements OnInit {

  @Input() dormData: any = null; 
  @Input() isPopup: boolean = false; 

  activeTab: string = 'info';

  constructor() { 
    // ✅ เพิ่มไอคอน checkmark-circle-outline
    addIcons({ star, 'star-half': starHalf, 'location-outline': locationOutline, 'call-outline': callOutline, wifi, car, snow, 'checkmark-circle-outline': checkmarkCircleOutline });
  }

  ngOnInit() {
    if (this.dormData) {
      console.log('Dorm Data Loaded:', this.dormData);
    }
  }

  switchTab(tab: string) {
    this.activeTab = tab;
  }

  // ✅ [สำคัญมาก] ต้องเพิ่มฟังก์ชันนี้ เพื่อให้ HTML วนลูปได้
  get facilitiesList(): string[] {
    // 1. ถ้าไม่มีข้อมูลเลย
    if (!this.dormData) return [];

    // 2. เช็คฟิลด์ที่เก็บข้อมูล (API คุณอาจส่งมาเป็น facilities หรือ FACILITIES)
    const facData = this.dormData.facilities || this.dormData.FACILITIES; 
    
    if (!facData) return [];

    // 3. กรณีเป็น Array อยู่แล้ว (API ใหม่เราส่งเป็น Array แล้ว)
    if (Array.isArray(facData)) {
      return facData;
    }

    // 4. กันเหนียว: กรณีเป็น String คั่นด้วยคอมม่า
    if (typeof facData === 'string') {
      return facData.split(',').map((item: string) => item.trim());
    }

    return [];
  }
}