import { Component, OnInit, Input } from '@angular/core'; // ✅ เพิ่ม Input
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
// ... imports อื่นๆ

@Component({
  selector: 'app-dorm-detail',
  templateUrl: './dorm-detail.page.html',
  styleUrls: ['./dorm-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class DormDetailPage implements OnInit {

  // ✅ 1. เพิ่มตัวแปรรับค่าจากหน้า Home
  @Input() dormData: any = null; 
  
  // ✅ 2. ตัวแปรเช็คว่าเป็น Popup หรือไม่ (เพื่อซ่อน Header)
  @Input() isPopup: boolean = false; 

  constructor() { }

  ngOnInit() {
    // ถ้ามีข้อมูลส่งมา (แบบ Popup) ก็ใช้เลย
    if (this.dormData) {
      console.log('Load from Input:', this.dormData);
    } else {
      // ถ้าไม่มี (แปลว่าเปิดหน้าใหม่ปกติ) ให้โหลดจาก ID ตามเดิม
      // this.loadFromRoute(); 
    }
  }

}