import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, IonMenu } from '@ionic/angular';
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

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, BaseChartDirective]
})
export class DashboardPage implements OnInit {
  
  @ViewChild('dashboardMenu') menuRef: IonMenu | undefined;

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
    datasets: [{ 
      data: [], 
      label: 'จำนวนหอพัก', 
      backgroundColor: '#FFD600', 
      hoverBackgroundColor: '#FFAB00',
      borderRadius: 6
    }]
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

  ngOnInit() {
    this.checkAdminAccess();
  }

  ionViewWillEnter() {
    // เช็คทุกครั้งที่เข้าหน้า (เผื่อ Session หลุด)
    this.checkAdminAccess();
  }

  async checkAdminAccess() {
    const storedData = localStorage.getItem('loggedIn');
    if (storedData) {
      try {
        const user = JSON.parse(storedData);
        this.currentUser = user;

        // เช็ค Role Admin (สมมติ Role 3 = Admin)
        if (user.role_id !== 3) {
          await this.showAlert('ไม่มีสิทธิ์เข้าถึง', 'หน้านี้สำหรับผู้ดูแลระบบเท่านั้น');
          this.router.navigate(['/home']);
          return;
        }
        
        this.loadDashboardData();

      } catch (e) {
        this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  async loadDashboardData() {
    this.isLoading = true;
    try {
      // 1. ดึงข้อมูลหอพักทั้งหมด (Admin View)
      const dormsRes = await this.dormService.getAllDormsAdmin();
      const allDorms = dormsRes.success ? dormsRes.data : [];

      // 2. ดึงข้อมูล User ทั้งหมด
      const usersRes = await this.userService.getAllUsers(); // ต้องแน่ใจว่า UserService มีฟังก์ชันนี้
      const totalUsers = Array.isArray(usersRes) ? usersRes.length : 0;

      // 3. ดึงคำขอที่รออนุมัติ (ทั้งเจ้าของหอ และ ลงทะเบียนหอ)
      const reqRes = await this.dormService.getPendingRequests();
      const pendingReqs = reqRes.success ? reqRes.data.length : 0;

      // 4. จัดเตรียมข้อมูล
      this.dashboardData = {
        totalDorms: allDorms.length,
        totalUsers: totalUsers,
        pendingRequests: pendingReqs,
        recentDorms: allDorms.slice(0, 5) // เอาแค่ 5 อันดับแรก
      };

      // 5. สร้างกราฟแยกตามโซน
      this.prepareChartData(allDorms);

    } catch (error) {
      console.error('Load Dashboard Failed', error);
    } finally {
      this.isLoading = false;
    }
  }

  prepareChartData(dorms: any[]) {
    const zoneCounts: { [key: string]: number } = {};
    
    dorms.forEach(d => {
      // ใช้ชื่อโซน หรือถ้าไม่มีให้ใส่ 'ไม่ระบุ'
      const zName = d.ZONE_NAME || d.zone || 'ไม่ระบุ';
      zoneCounts[zName] = (zoneCounts[zName] || 0) + 1;
    });

   this.barChartData = {
      labels: Object.keys(zoneCounts),
      datasets: [
        { 
          data: Object.values(zoneCounts), 
          label: 'จำนวนหอพัก', 
          backgroundColor: '#FFD600', 
          hoverBackgroundColor: '#FFAB00',
          borderRadius: 6
        }
      ]
    };
  }
  // --- Menu Logic ---
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
          text: 'ออก', role: 'destructive',
          handler: () => {
            localStorage.removeItem('loggedIn');
            if (this.menuRef) this.menuRef.close();
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