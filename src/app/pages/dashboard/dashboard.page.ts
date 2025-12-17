import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

// Import กราฟ
import { BaseChartDirective } from 'ng2-charts'; 
import { ChartConfiguration, ChartData, ChartType, Chart, registerables } from 'chart.js';

// Service เดิม และ Header เดิม
import { DormitoryService } from '../../services/dormitory'; 
import { HeaderComponent } from '../../components/header/header.component'; 

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, BaseChartDirective, HeaderComponent] 
})
export class DashboardPage implements OnInit {
  
  currentUser: any = null; // เก็บข้อมูล User ส่งให้ Header
  dashboardData: any = null;

  // สีประจำโซน (เขียว, ส้ม, ฟ้า)
  colorClasses = ['header-green', 'header-orange', 'header-blue'];
  chartColors = ['#00E676', '#FFC107', '#29B6F6'];

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  constructor(
    public router: Router, 
    private alertCtrl: AlertController,
    private dormService: DormitoryService 
  ) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.checkAdminAccess();
  }

  ionViewWillEnter() {
    this.checkAdminAccess();
  }

  async checkAdminAccess() {
    const storedData = localStorage.getItem('loggedIn');
    if (storedData) {
      const user = JSON.parse(storedData);
      this.currentUser = user; // ส่งไป Header

      if (user.role_id !== 3) {
        await this.showAlert('ไม่มีสิทธิ์เข้าถึง', 'หน้านี้สำหรับผู้ดูแลระบบเท่านั้น');
        this.router.navigate(['/home']);
        return;
      }
      this.loadData();
    } else {
      this.router.navigate(['/login']);
    }
  }

  async loadData() {
    try {
      // 1. ดึงชื่อโซนจาก API จริง (ผ่าน Service เดิม)
      const res = await this.dormService.getZones();
      const realZones = res.data || []; 

      // 2. Mock Data: ใส่แค่ตัวเลขยอดรวม (ตัดรายชื่อซอยย่อยออกตามที่ขอ)
      const mockCounts: any = {
        1: 30, // โซน ID 1 (เช่น ท่าขอนยาง) มี 30 หอ
        2: 13, // โซน ID 2 (เช่น หน้ามอ)    มี 13 หอ
        3: 34  // โซน ID 3 (เช่น ขามเรียง)   มี 34 หอ
      };

      // 3. จับคู่ ชื่อโซนจริง + ตัวเลข Mock
      const summaryData = realZones.map((zone: any, index: number) => {
        // ดึงตัวเลขจาก mockCounts ถ้าไม่มีให้เป็น 0
        const count = mockCounts[zone.ZONE_ID] || 0; 
        
        return {
          zoneName: zone.ZONE_NAME,
          count: count,
          colorClass: this.colorClasses[index % this.colorClasses.length]
        };
      });

      // คำนวณยอดรวมทั้งหมด
      const totalDorms = summaryData.reduce((sum: number, item: any) => sum + item.count, 0);

      this.dashboardData = {
        totalDorms: totalDorms,
        items: summaryData // เอาไปวนลูปสร้างการ์ด
      };

      // 4. อัปเดตกราฟ
      this.barChartData = {
        labels: summaryData.map((s: any) => s.zoneName),
        datasets: [
          { 
            data: summaryData.map((s: any) => s.count), 
            label: 'จำนวนหอพัก',
            backgroundColor: this.chartColors,
            borderRadius: 5,
            borderWidth: 1,
            barThickness: 60
          }
        ]
      };

    } catch (error) {
      console.error('Load Dashboard Failed', error);
    }
  }

  // Logout (ใช้ในกรณีเรียกจาก Dashboard โดยตรง หรือผ่าน Header)
  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'ยืนยัน',
      message: 'ต้องการออกจากระบบใช่หรือไม่?',
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        { 
          text: 'ตกลง', 
          handler: () => {
            localStorage.removeItem('loggedIn');
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header, message, buttons: ['ตกลง']
    });
    await alert.present();
  }
}