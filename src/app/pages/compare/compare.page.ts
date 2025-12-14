import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router'; // เพิ่ม RouterModule ถ้าจะใช้ [routerLink]
import { DormitoryService, Dormitory } from '../../services/dormitory'; 
import { addIcons } from 'ionicons';
import { checkmarkCircle, arrowBack, locationOutline, wifi, car, snow, cashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-compare',
  templateUrl: './compare.page.html',
  styleUrls: ['./compare.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule] 
})
export class ComparePage implements OnInit {

  allDorms: any[] = []; // ใช้ any[] ชั่วคราวเพื่อให้รับ property isChecked ได้ง่ายๆ
  selectedDorms: any[] = [];
  isComparing: boolean = false;

  constructor(
    private dormService: DormitoryService,
    private router: Router
  ) { 
    addIcons({ checkmarkCircle, arrowBack, locationOutline, wifi, car, snow, cashOutline });
  }

  ngOnInit() {
    this.fetchDorms();
  }

  // ✅ [แก้ไข] ใช้ async/await แทน .subscribe
  async fetchDorms() {
    try {
      const res = await this.dormService.getAllDorms();
      if (res.success) {
        // map ข้อมูลเพิ่มตัวแปร isChecked สำหรับ checkbox
        this.allDorms = res.data.map((d: any) => ({ ...d, isChecked: false }));
      }
    } catch (err) {
      console.error(err);
    }
  }

  onSelectDorm(dorm: any) {
    // Logic เพิ่มเติมเมื่อติ๊กเลือก (ถ้าต้องการ)
    console.log('Selected:', dorm.DORM_NAME, dorm.isChecked);
  }

  startCompare() {
    this.selectedDorms = this.allDorms.filter((d: any) => d.isChecked);

    if (this.selectedDorms.length < 2) {
      // แจ้งเตือนถ้าเลือกน้อยกว่า 2 (ใช้ alert ง่ายๆ หรือ Toast ก็ได้)
      alert('กรุณาเลือกหอพักอย่างน้อย 2 แห่งเพื่อเปรียบเทียบ');
      return;
    }

    this.isComparing = true;
  }

  cancelCompare() {
    this.isComparing = false;
    this.selectedDorms = [];
    // ล้างค่า checkbox ทั้งหมด
    this.allDorms.forEach(d => d.isChecked = false);
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}