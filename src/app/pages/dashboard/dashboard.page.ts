import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  menuOutline, homeOutline, listOutline, starOutline, logOutOutline, person,
  business, people, documentText, map, time, businessOutline, 
  peopleOutline, personCircleOutline, documentTextOutline, statsChart, alertCircle
} from 'ionicons/icons';

// Import Chart
import { BaseChartDirective } from 'ng2-charts'; 
import { ChartConfiguration, ChartData, ChartType, Chart, registerables } from 'chart.js';

// Services
import { DormitoryService } from '../../services/dormitory'; 
import { UserService } from '../../services/user';
import { HeaderComponent } from '../../components/header/header.component'; // ✅ นำเข้า Header

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, BaseChartDirective, HeaderComponent] // ✅ ใส่ HeaderComponent
})
export class DashboardPage implements OnInit {
  
  currentUser: any = null;
  isLoading = true;
  dashboardData: any = null;

  // --- Chart Config ---
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { 
      y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false } }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'จำนวนหอพัก', backgroundColor: [] }]
  };

  constructor(
    public router: Router, 
    private alertCtrl: AlertController,
    private dormService: DormitoryService,
    private userService: UserService
  ) {
    Chart.register(...registerables);
    addIcons({ 
      menuOutline, homeOutline, listOutline, starOutline, logOutOutline, person,
      business, people, documentText, map, time, businessOutline, 
      peopleOutline, personCircleOutline, documentTextOutline, statsChart, alertCircle
    });
  }

  ngOnInit() { this.checkAdminAccess(); }
  ionViewWillEnter() { this.checkAdminAccess(); }

  async checkAdminAccess() {
    const storedData = localStorage.getItem('loggedIn');
    if (storedData) {
      try {
        const userObj = JSON.parse(storedData);
        this.currentUser = userObj.user ? userObj.user : userObj;
        
        if (this.currentUser.role_id !== 3 && this.currentUser.ROLE_TYPE_ID !== 3) {
          await this.showAlert('ไม่มีสิทธิ์เข้าถึง', 'หน้านี้สำหรับผู้ดูแลระบบเท่านั้น');
          this.router.navigate(['/home']);
          return;
        }
        this.loadDashboardData();
      } catch (e) { this.router.navigate(['/login']); }
    } else { this.router.navigate(['/login']); }
  }

  async loadDashboardData() {
    this.isLoading = true;
    try {
      const dormsRes = await this.dormService.getAllDormsAdmin();
      const allDorms = dormsRes.success ? dormsRes.data : [];

      const usersRes = await this.userService.getAllUsers(); 
      const totalUsers = Array.isArray(usersRes) ? usersRes.length : 0;

      const reqRes = await this.dormService.getPendingRequests();
      const pendingReqs = reqRes.success ? reqRes.data.length : 0;

      this.dashboardData = {
        totalDorms: allDorms.length,
        totalUsers: totalUsers,
        pendingRequests: pendingReqs,
        recentDorms: allDorms.slice(0, 5) 
      };

      this.prepareChartData(allDorms);
    } catch (error) { console.error('Load Dashboard Failed', error); } 
    finally { this.isLoading = false; }
  }

  prepareChartData(dorms: any[]) {
    const zoneCounts: { [key: string]: number } = {};
    dorms.forEach(d => {
      const zName = d.ZONE_NAME || d.zone || 'ไม่ระบุ';
      zoneCounts[zName] = (zoneCounts[zName] || 0) + 1;
    });

    // 🎨 ชุดสีสำหรับกราฟแท่ง
    const colors = ['#FFD600', '#FF5722', '#4CAF50', '#2196F3', '#9C27B0', '#00BCD4', '#E91E63'];

    this.barChartData = {
      labels: Object.keys(zoneCounts),
      datasets: [
        { 
          data: Object.values(zoneCounts), 
          label: 'จำนวนหอพัก', 
          backgroundColor: colors.slice(0, Object.keys(zoneCounts).length), // ✅ ใช้ชุดสี
          borderRadius: 6
        }
      ]
    };
  }

  // ✅ เมื่อพิมพ์ค้นหาที่ Header ระบบจะพาไปหน้า List
  onSearch(event: any) {
    const keyword = (typeof event === 'string' ? event : event?.target?.value || '').trim();
    if(keyword) {
      this.router.navigate(['/list']); 
      // (ระบบจะพาไปที่หน้า list ให้คุณกรอกค้นหาต่อได้ทันที)
    }
  }

  // ✅ ใช้ Menu กลางของแอป
  openMenu() { window.dispatchEvent(new CustomEvent('toggle-sidebar')); }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['ตกลง'] });
    await alert.present();
  }
}