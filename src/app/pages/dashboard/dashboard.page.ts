import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  menuOutline, homeOutline, listOutline, starOutline, logOutOutline, person,
  business, people, documentText, map, time, businessOutline,
  peopleOutline, personCircleOutline, documentTextOutline, statsChart, alertCircle,
  shieldCheckmark
} from 'ionicons/icons';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart, registerables } from 'chart.js';
import { DormitoryService } from '../../services/dormitory';
import { UserService } from '../../services/user';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, BaseChartDirective, HeaderComponent]
})
export class DashboardPage implements OnInit {

  currentUser: any = null;
  isLoading = true;
  dashboardData: any = null;

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
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
      peopleOutline, personCircleOutline, documentTextOutline, statsChart, alertCircle,
      shieldCheckmark
    });
  }

  ngOnInit() { this.checkAdminAccess(); }
  ionViewWillEnter() { this.checkAdminAccess(); }

  async checkAdminAccess() {
    const storedData = localStorage.getItem('loggedIn');
    if (!storedData) { this.router.navigate(['/login']); return; }

    try {
      const userObj = JSON.parse(storedData);
      this.currentUser = userObj.user ? userObj.user : userObj;

      if (this.currentUser.role_id !== 3 && this.currentUser.ROLE_TYPE_ID !== 3) {
        await this.showAlert('ไม่มีสิทธิ์เข้าถึง', 'หน้านี้สำหรับผู้ดูแลระบบเท่านั้น');
        this.router.navigate(['/home']);
        return;
      }

      // ✅ Welcome Popup สำหรับ Admin แสดงที่หน้า Dashboard
      if (userObj.showWelcome) {
        userObj.showWelcome = false;
        localStorage.setItem('loggedIn', JSON.stringify(userObj));
        setTimeout(() => this.showAdminWelcome(this.currentUser.username || this.currentUser.USERNAME), 800);
      }

      this.loadDashboardData();
    } catch (e) { this.router.navigate(['/login']); }
  }

  // ✅ Welcome Popup เฉพาะ Admin
  async showAdminWelcome(username: string) {
    const alert = await this.alertCtrl.create({
      header: '🛡️ ยินดีต้อนรับ Admin',
      message: `สวัสดี ${username}
                ระบบพร้อมใช้งานแล้ว 🔔<br>
                ลองเช็คดูสิว่ามี หอพักใหม่รออนุมัติ
                หรือ รีวิวใหม่ เข้ามาบ้างไหมวันนี้ 👀`,
      cssClass: 'welcome-alert-admin',
      buttons: [{ text: 'ไปดูเลย! 🚀', role: 'confirm' }],
      backdropDismiss: true
    });
    await alert.present();
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
        totalUsers,
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
    const colors = ['#FFD600', '#FF5722', '#4CAF50', '#2196F3', '#9C27B0', '#00BCD4', '#E91E63'];
    this.barChartData = {
      labels: Object.keys(zoneCounts),
      datasets: [{
        data: Object.values(zoneCounts),
        label: 'จำนวนหอพัก',
        backgroundColor: colors.slice(0, Object.keys(zoneCounts).length),
        borderRadius: 6
      }]
    };
  }

  onSearch(event: any) {
    const keyword = (typeof event === 'string' ? event : event?.target?.value || '').trim();
    if (keyword) this.router.navigate(['/list']);
  }

  openMenu() { window.dispatchEvent(new CustomEvent('toggle-sidebar')); }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['ตกลง'] });
    await alert.present();
  }
}