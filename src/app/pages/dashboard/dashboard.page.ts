import { Component, OnInit, ViewChild } from '@angular/core'; // เพิ่ม ViewChild
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, IonMenu } from '@ionic/angular'; // เพิ่ม IonMenu
import { Router } from '@angular/router';
import { addIcons } from 'ionicons'; // เพิ่ม icons
import { 
  menuOutline, home, listOutline, starOutline, logOutOutline, person,
  gridOutline // เพิ่ม icon ที่ใช้
} from 'ionicons/icons';

// ... (Import Chart เหมือนเดิม) ...
import { BaseChartDirective } from 'ng2-charts'; 
import { ChartConfiguration, ChartData, ChartType, Chart, registerables } from 'chart.js';
import { DormitoryService } from '../../services/dormitory'; 

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, BaseChartDirective] // เอา HeaderComponent ออกเพราะเราเขียน Header เองในนี้
})
export class DashboardPage implements OnInit {
  
  @ViewChild('dashboardMenu') menuRef: IonMenu | undefined; // อ้างอิงเมนู

  currentUser: any = null;
  dashboardData: any = null;

  // ... (ตัวแปร Chart เหมือนเดิม) ...
  colorClasses = ['header-green', 'header-orange', 'header-blue'];
  chartColors = ['#00E676', '#FFC107', '#29B6F6'];
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false, 
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
    // เพิ่ม Icon ให้ครบ
    addIcons({ menuOutline, home, listOutline, starOutline, logOutOutline, person, gridOutline });
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
      this.currentUser = user;

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

  // ... (loadData ฟังก์ชันเดิม) ...
  async loadData() {
    // (ใส่โค้ด loadData เดิมของคุณที่นี่)
    try {
      const res = await this.dormService.getZones();
      const realZones = res.data || []; 
      const mockCounts: any = { 1: 30, 2: 13, 3: 34 };

      const summaryData = realZones.map((zone: any, index: number) => {
        const count = mockCounts[zone.ZONE_ID] || 0; 
        return {
          zoneName: zone.ZONE_NAME,
          count: count,
          colorClass: this.colorClasses[index % this.colorClasses.length]
        };
      });

      const totalDorms = summaryData.reduce((sum: number, item: any) => sum + item.count, 0);
      this.dashboardData = { totalDorms: totalDorms, items: summaryData };

      this.barChartData = {
        labels: summaryData.map((s: any) => s.zoneName),
        datasets: [{ 
            data: summaryData.map((s: any) => s.count), 
            label: 'จำนวนหอพัก',
            backgroundColor: this.chartColors,
            borderRadius: 5, borderWidth: 1, barThickness: 60
        }]
      };
    } catch (error) { console.error('Load Dashboard Failed', error); }
  }

  // --- Menu Functions (เพิ่มใหม่) ---
  async toggleMenu() {
    if (this.menuRef) await this.menuRef.toggle();
  }

  async navigate(path: string) {
    if (this.menuRef) await this.menuRef.close();
    this.router.navigate([path]);
  }

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