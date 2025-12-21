import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router'; // ✅ 1. Import Router
import { addIcons } from 'ionicons';
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

  constructor(private router: Router) { // ✅ 2. Inject Router เข้ามา
    addIcons({ star, 'star-half': starHalf, 'location-outline': locationOutline, 'call-outline': callOutline, wifi, car, snow, 'checkmark-circle-outline': checkmarkCircleOutline });
  }

  ngOnInit() {
    // ✅ 3. เช็คว่ามีข้อมูลส่งมาจาก Router State หรือไม่
    // (history.state คือที่เก็บข้อมูลที่ส่งมาพร้อม router.navigate)
    if (history.state && history.state.dormData) {
      this.dormData = history.state.dormData;
    }

    // กรณี Refresh หน้าเว็บ ข้อมูลใน state อาจหาย ให้เช็คและดีดกลับหน้าแรกได้ (Optional)
    if (!this.dormData) {
      console.warn('No dorm data found');
    } else {
      console.log('Dorm Data Loaded:', this.dormData);
    }
  }

  switchTab(tab: string) {
    this.activeTab = tab;
  }

  get facilitiesList(): string[] {
    if (!this.dormData) return [];

    const facData = this.dormData.facilities || this.dormData.FACILITIES; 
    
    if (!facData) return [];

    if (Array.isArray(facData)) {
      return facData;
    }

    if (typeof facData === 'string') {
      return facData.split(',').map((item: string) => item.trim());
    }

    return [];
  }
}