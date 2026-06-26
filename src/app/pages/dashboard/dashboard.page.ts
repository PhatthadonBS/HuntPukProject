import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  menuOutline, homeOutline, listOutline, starOutline, logOutOutline, person,
  business, people, documentText, map, time, businessOutline,
  peopleOutline, personCircleOutline, documentTextOutline, statsChart, alertCircle,
  shieldCheckmark, closeCircle
} from 'ionicons/icons';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart, registerables } from 'chart.js';
import { DormitoryService } from '../../services/dormitory';
import { UserService } from '../../services/user';
import { HeaderComponent } from '../../components/header/header.component';
import { WelcomeModalComponent } from '../../components/welcome-modal/welcome-modal.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, BaseChartDirective, HeaderComponent, WelcomeModalComponent]
})
export class DashboardPage implements OnInit {

  currentUser: any = null;
  isLoading = true;
  dashboardData: any = null;
  showWelcomeModal = false; // ✅ ควบคุม welcome modal

  allDormsRaw: any[] = [];
  filteredZoneDorms: any[] = [];
  selectedZoneName: string = '';

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
    private dormService: DormitoryService,
    private userService: UserService,
    private actionSheetCtrl: ActionSheetController
  ) {
    Chart.register(...registerables);
    addIcons({
      menuOutline, homeOutline, listOutline, starOutline, logOutOutline, person,
      business, people, documentText, map, time, businessOutline,
      peopleOutline, personCircleOutline, documentTextOutline, statsChart, alertCircle,
      shieldCheckmark, closeCircle
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

      // ✅ ใช้ WelcomeModalComponent แทน alertCtrl
      if (userObj.showWelcome) {
        userObj.showWelcome = false;
        localStorage.setItem('loggedIn', JSON.stringify(userObj));
        setTimeout(() => { this.showWelcomeModal = true; }, 800);
      }

      this.loadDashboardData();
    } catch (e) { this.router.navigate(['/login']); }
  }

  // ✅ ปิด welcome modal
  onWelcomeClosed() { this.showWelcomeModal = false; }

  async loadDashboardData() {
    this.isLoading = true;
    try {
      // ✅ ดึงข้อมูลทั้งหมดจาก API เดียว (Dashboard Stats)
      const statsRes = await this.dormService.getDashboardStats();
      if (statsRes?.success && statsRes?.data) {
        const d = statsRes.data;
        
        // ✅ ดึง Pending Requests แยก (ใช้ API เดิม)
        const reqRes = await this.dormService.getPendingRequests();
        const pendingReqs = reqRes.success ? reqRes.data.length : 0;

        this.dashboardData = {
          totalDorms: d.dormCount || 0,
          totalUsers: (d.memberCount || 0) + (d.ownerCount || 0),
          pendingRequests: pendingReqs,
          totalVisitors: d.totalWebsiteViews || 0,  // ✅ จาก WEB_VIEW_LOGS จริง
          recentDorms: d.topPopularDorms?.slice(0, 5) || []
        };

        // ✅ เตรียม Chart จาก zone breakdown (API)
        this.prepareChartDataFromZones(d.zoneBreakdown || []);

        // ✅ โหลดหอพักทั้งหมดมาเก็บไว้ (สำหรับ Filter ตอนคลิกกราฟ) โดยไม่ต้องรอให้เสร็จก่อนจบ LoadDashboard
        this.dormService.getAllDormsAdmin().then(res => {
          if(res.success && res.data) {
            this.allDormsRaw = res.data;
          }
        });

      } else {
        // Fallback: ใช้ API เก่าถ้า stats API ล้มเหลว
        const dormsRes = await this.dormService.getAllDormsAdmin();
        const allDorms = dormsRes.success ? dormsRes.data : [];
        this.allDormsRaw = allDorms;
        const usersRes = await this.userService.getAllUsers();
        const totalUsers = Array.isArray(usersRes) ? usersRes.length : 0;
        const reqRes = await this.dormService.getPendingRequests();
        const pendingReqs = reqRes.success ? reqRes.data.length : 0;

        this.dashboardData = {
          totalDorms: allDorms.length,
          totalUsers,
          pendingRequests: pendingReqs,
          totalVisitors: 0,
          recentDorms: allDorms.slice(0, 5)
        };
        this.prepareChartData(allDorms);
      }
    } catch (error) { console.error('Load Dashboard Failed', error); }
    finally { this.isLoading = false; }
  }

  prepareChartDataFromZones(zoneBreakdown: any[]) {
    const colors = ['#FFD600', '#FF5722', '#4CAF50', '#2196F3', '#9C27B0', '#00BCD4', '#E91E63'];
    this.barChartData = {
      labels: zoneBreakdown.map(z => z.zoneName || 'ไม่ระบุ'),
      datasets: [{
        data: zoneBreakdown.map(z => z.dormCount || 0),
        label: 'จำนวนหอพัก',
        backgroundColor: colors.slice(0, zoneBreakdown.length),
        borderRadius: 6
      }]
    };
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

  // ✅ Chart Interactivity
  onChartClick(event: any) {
    if (event.active && event.active.length > 0) {
      const index = event.active[0].index;
      const label = this.barChartData.labels![index] as string;
      this.selectedZoneName = label;
      this.filteredZoneDorms = this.allDormsRaw.filter((d: any) => 
        (d.ZONE_NAME || d.zone || 'ไม่ระบุ') === label
      );
      
      // เลื่อนหน้าจอลงมาที่ตารางหอพักโซน
      setTimeout(() => {
        window.scrollBy({ top: 400, behavior: 'smooth' });
      }, 100);
    }
  }

  clearZoneFilter() {
    this.filteredZoneDorms = [];
    this.selectedZoneName = '';
  }

  // ✅ Navigation Handlers
  goToDorms() { this.router.navigate(['/manage-dorm']); }
  goToUsers() { this.router.navigate(['/manage-users']); }
  goToDormDetail(dorm: any) { this.router.navigate(['/dorm-detail', dorm.DORM_ID || dorm.id]); }

  async openRequestActionSheet() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'เลือกหน้าจัดการคำขอรออนุมัติ',
      buttons: [
        { text: 'คำขอเพิ่มหอพัก', icon: 'business', handler: () => { this.router.navigate(['/manage-request-createdorm']); } },
        { text: 'คำขอสิทธิ์เจ้าของหอพัก', icon: 'person-circle', handler: () => { this.router.navigate(['/manage-request-dormowner']); } },
        { text: 'คำขออื่นๆ (Requests)', icon: 'document-text', handler: () => { this.router.navigate(['/requests']); } },
        { text: 'ยกเลิก', icon: 'close', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  openMenu() { window.dispatchEvent(new CustomEvent('toggle-sidebar')); }

  async showAlert(header: string, message: string) {
    alert(`${header}\n${message}`);
  }
}