import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  menuOutline, homeOutline, listOutline, starOutline, logOutOutline, person,
  business, people, documentText, map, time, businessOutline,
  peopleOutline, personCircleOutline, documentTextOutline, statsChart, alertCircle,
  shieldCheckmark, closeCircle, close, locationOutline, globeOutline, checkmarkCircleOutline, powerOutline, banOutline, alertCircleOutline
} from 'ionicons/icons';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart, registerables } from 'chart.js';
import { DormitoryService } from '../../services/dormitory';
import { UserService } from '../../services/user';
import { HeaderComponent } from '../../components/header/header.component';
import { WelcomeModalComponent } from '../../components/welcome-modal/welcome-modal.component';

Chart.register(...registerables);

interface ZoneBreakdown {
  zoneId: number;
  zoneName: string;
  dormCount: number;
}
interface DormStatusBreakdown {
  statusName: string;
  count: number;
}
interface DormTypeBreakdown {
  typeName: string;
  count: number;
}
interface UserStatusBreakdown {
  activeUsers: number;
  deactiveUsers: number;
  bannedUsers: number;
}
interface ViewsPerMonthBreakdown {
  year: number;
  month: number;
  count: number;
}
interface TopPopularDorm {
  dormId: number;
  dormName: string;
  views: number;
}
interface DashboardStats {
  dormCount: number;
  memberCount: number;
  ownerCount: number;
  zoneCount: number;
  totalWebsiteViews: number;
  popularDormName: string;
  popularDormViews: number;
  topPopularDorms: TopPopularDorm[];
  zoneBreakdown: ZoneBreakdown[];
  dormStatusBreakdown: DormStatusBreakdown[];
  dormTypeBreakdown: DormTypeBreakdown[];
  userStatusBreakdown: UserStatusBreakdown;
  viewsPerMonthBreakdown: ViewsPerMonthBreakdown[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, BaseChartDirective, HeaderComponent, WelcomeModalComponent]
})
export class DashboardPage implements OnInit {
  
  @ViewChild('dormStatusCanvas') dormStatusCanvas!: ElementRef;
  @ViewChild('dormTypeCanvas') dormTypeCanvas!: ElementRef;
  @ViewChild('viewCanvas') viewCanvas!: ElementRef;

  currentUser: any = null;
  isLoading = true;
  error = false;
  
  stats: DashboardStats | null = null;
  pendingRequests: number = 0;

  showWelcomeModal = false;
  today: Date = new Date();

  // Modals state
  isDormModalOpen = false;
  isUserModalOpen = false;
  isZoneModalOpen = false;
  isViewModalOpen = false;
  isPopularModalOpen = false;

  selectedYearForTable: number | null = null;
  private charts: Chart[] = [];

  constructor(
    public router: Router,
    private dormService: DormitoryService,
    private userService: UserService,
    private actionSheetCtrl: ActionSheetController
  ) {
    addIcons({
      menuOutline, homeOutline, listOutline, starOutline, logOutOutline, person,
      business, people, documentText, map, time, businessOutline,
      peopleOutline, personCircleOutline, documentTextOutline, statsChart, alertCircle,
      shieldCheckmark, closeCircle, close, locationOutline, globeOutline, checkmarkCircleOutline, powerOutline, banOutline, alertCircleOutline
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

      if (userObj.showWelcome) {
        userObj.showWelcome = false;
        localStorage.setItem('loggedIn', JSON.stringify(userObj));
        setTimeout(() => { this.showWelcomeModal = true; }, 800);
      }

      this.fetchStats();
    } catch (e) { this.router.navigate(['/login']); }
  }

  onWelcomeClosed() { this.showWelcomeModal = false; }

  handleRefresh(event: any) {
    this.fetchStats();
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  async fetchStats() {
    this.isLoading = true;
    this.error = false;
    try {
      // 1. Dashboard Stats
      const statsRes = await this.dormService.getDashboardStats();
      if (statsRes?.success && statsRes?.data) {
        this.stats = statsRes.data;
      } else {
        this.error = true;
      }

      // 2. Pending requests
      const reqRes = await this.dormService.getPendingRequests();
      this.pendingRequests = reqRes?.success ? reqRes.data.length : 0;
      
    } catch (err) {
      console.error('Error fetching dashboard stats', err);
      this.error = true;
    } finally {
      this.isLoading = false;
    }
  }

  // --- Modal Controls ---
  openDormModal() { 
    this.isDormModalOpen = true; 
    setTimeout(() => this.renderDormCharts(), 100);
  }
  closeDormModal() { this.isDormModalOpen = false; this.destroyCharts(); }

  openUserModal() { this.isUserModalOpen = true; }
  closeUserModal() { this.isUserModalOpen = false; }

  openZoneModal() { this.isZoneModalOpen = true; }
  closeZoneModal() { this.isZoneModalOpen = false; }

  openViewModal() { 
    this.isViewModalOpen = true; 
    this.selectedYearForTable = null;
    setTimeout(() => this.renderViewChart(), 100);
  }
  closeViewModal() { this.isViewModalOpen = false; this.destroyCharts(); }

  openPopularModal() { this.isPopularModalOpen = true; }
  closePopularModal() { this.isPopularModalOpen = false; }

  goToFilteredDorms(zoneName: string) {
    this.closeZoneModal();
    // Assuming our manage-dorm can accept query param or we just navigate to it
    this.router.navigate(['/manage-dorm'], { queryParams: { search: zoneName } });
  }

  goToDormDetail(dormId: number) {
    this.closePopularModal();
    this.router.navigate(['/dorm-detail', dormId]);
  }

  private destroyCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  // --- Chart Rendering Methods ---
  renderDormCharts() {
    if (!this.stats || !this.dormStatusCanvas || !this.dormTypeCanvas) return;
    
    const statusCtx = this.dormStatusCanvas.nativeElement;
    const statusChart = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: this.stats.dormStatusBreakdown.map(d => d.statusName),
        datasets: [{
          data: this.stats.dormStatusBreakdown.map(d => d.count),
          backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'],
        }]
      },
      options: { 
        responsive: true, 
        plugins: { 
          legend: { position: 'bottom' }
        } 
      }
    });

    const typeCtx = this.dormTypeCanvas.nativeElement;
    const typeChart = new Chart(typeCtx, {
      type: 'doughnut',
      data: {
        labels: this.stats.dormTypeBreakdown.map(d => d.typeName),
        datasets: [{
          data: this.stats.dormTypeBreakdown.map(d => d.count),
          backgroundColor: ['#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
        }]
      },
      options: { 
        responsive: true, 
        plugins: { 
          legend: { position: 'bottom' }
        } 
      }
    });

    this.charts.push(statusChart, typeChart);
  }

  renderViewChart() {
    if (!this.stats || !this.viewCanvas) return;
    
    const yearMap = new Map<number, number>();
    this.stats.viewsPerMonthBreakdown.forEach(v => {
      const current = yearMap.get(v.year) || 0;
      yearMap.set(v.year, current + v.count);
    });

    const labels = Array.from(yearMap.keys()).sort();
    const data = labels.map(year => yearMap.get(year));

    const ctx = this.viewCanvas.nativeElement;
    const viewChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.map(y => y.toString()),
        datasets: [{
          label: 'ยอดเข้าชม',
          data: data as number[],
          backgroundColor: ['#0ea5e9', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444'],
        }]
      },
      options: { 
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        onClick: (event, elements, chart) => {
          if (elements && elements.length > 0 && elements[0]) {
            const index = elements[0].index;
            const clickedYearStr = labels[index];
            if (clickedYearStr) {
               this.selectedYearForTable = parseInt(clickedYearStr.toString(), 10);
            }
          }
        }
      }
    });
    this.charts.push(viewChart);
  }

  // --- Table Data Helpers ---
  getMonthlyTableData() {
    if (!this.stats || !this.selectedYearForTable) return [];
    return this.stats.viewsPerMonthBreakdown.filter(v => v.year === this.selectedYearForTable);
  }

  getMonthName(monthNumber: number): string {
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return months[monthNumber - 1] || '';
  }

  onSearch(event: any) {
    const keyword = (typeof event === 'string' ? event : event?.target?.value || '').trim();
    if (keyword) this.router.navigate(['/list']);
  }

  async openRequestActionSheet() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'เลือกหน้าจัดการคำขอรออนุมัติ',
      buttons: [
        { text: 'คำขอเพิ่มหอพัก', icon: 'business', handler: () => { this.router.navigate(['/manage-requests-createdorm']); } },
        { text: 'คำขอสิทธิ์เจ้าของหอพัก', icon: 'person-circle', handler: () => { this.router.navigate(['/manage-requests-dorm-owner']); } },
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