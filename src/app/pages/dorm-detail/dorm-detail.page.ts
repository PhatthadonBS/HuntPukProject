import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { star, starHalf, locationOutline, callOutline, wifi, car, snow } from 'ionicons/icons';

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

  // ตัวแปรสำหรับสลับแท็บ (default เป็น 'info')
  activeTab: string = 'info';

  constructor() { 
    // เพิ่มไอคอนที่ต้องใช้
    addIcons({ star, 'star-half': starHalf, 'location-outline': locationOutline, 'call-outline': callOutline, wifi, car, snow });
  }

  ngOnInit() {
    if (this.dormData) {
      console.log('Dorm Data Loaded:', this.dormData);
    }
  }

  // ฟังก์ชันสลับแท็บ
  switchTab(tab: string) {
    this.activeTab = tab;
  }
}