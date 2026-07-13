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
  shieldCheckmark, closeCircle, close, locationOutline, globeOutline, checkmarkCircleOutline, powerOutline, banOutline, alertCircleOutline, arrowForwardOutline
} from 'ionicons/icons';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';
import { DormitoryService } from '../../services/dormitory';
import { UserService } from '../../services/user';
import { HeaderComponent } from '../../components/header/header.component';
import { WelcomeModalComponent } from '../../components/welcome-modal/welcome-modal.component';
import { GoogleMapsModule } from '@angular/google-maps';

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
  allDormViews: any[];
  totalDormViews: number;
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
  imports: [CommonModule, FormsModule, IonicModule, BaseChartDirective, HeaderComponent, WelcomeModalComponent, GoogleMapsModule]
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

  selectedYearForTable: number | null = null;
  allYears: number[] = [];
  private charts: Chart[] = [];

  // Zone map
  zoneMapCenter: google.maps.LatLngLiteral = { lat: 16.245, lng: 103.250 };
  zoneMapZoom = 12;
  zoneMarkers: any[] = [];
  dormMarkers: any[] = []; // To hold dorm markers
  zonesWithCoords: any[] = [];
  isZoneMapLoading = false;
  mapOptions: google.maps.MapOptions = {
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    zoomControl: true,
  };

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
      shieldCheckmark, closeCircle, close, locationOutline, globeOutline, checkmarkCircleOutline, powerOutline, banOutline, alertCircleOutline, arrowForwardOutline
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
    setTimeout(() => { event.target.complete(); }, 500);
  }

  async fetchStats() {
    this.isLoading = true;
    this.error = false;
    try {
      const statsRes = await this.dormService.getDashboardStats();
      if (statsRes?.success && statsRes?.data) {
        this.stats = statsRes.data;
        // Pre-compute all years for the view chart
        const yearSet = new Set<number>();
        (this.stats?.viewsPerMonthBreakdown || []).forEach(v => yearSet.add(v.year));
        this.allYears = Array.from(yearSet).sort();
      } else {
        this.error = true;
      }

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
  goToManageUsers() {
    this.router.navigate(['/manage-users']);
  }

  async openZoneModal() {
    this.isZoneModalOpen = true;
    this.isZoneMapLoading = true;
    this.zoneMarkers = [];
    this.zonesWithCoords = [];
    try {
      const res = await this.dormService.getZones();
      if (res?.success && res?.data?.length) {
        const zones = res.data;
        this.zonesWithCoords = zones;
        const withCoords = zones.filter((z: any) => z.lat && z.lng);
        this.zoneMarkers = withCoords.map((z: any) => ({
          position: { lat: parseFloat(z.lat), lng: parseFloat(z.lng) },
          zoneName: z.ZONE_NAME || z.name,
          dormCount: this.stats?.zoneBreakdown?.find(b => b.zoneId === (z.ZONE_ID || z.id))?.dormCount || 0
        }));
        if (this.zoneMarkers.length > 0) {
          this.zoneMapCenter = { ...(this.zoneMarkers[0]!.position) };
          this.zoneMapZoom = 13;
        }
      }
      
      // Load all dorms to show on map
      const dormRes = await this.dormService.getAllDormsAdmin();
      if (dormRes?.success && dormRes?.data?.length) {
        this.dormMarkers = dormRes.data
          .filter((d: any) => d.lat && d.lng)
          .map((d: any) => ({
            position: { lat: parseFloat(d.lat), lng: parseFloat(d.lng) },
            dormName: d.DORM_NAME || d.name,
            zoneName: d.ZONE_NAME,
            image: d.image || d.COVERIMAGE
          }));
      }

    } catch (e) {
      console.error('Failed to load zones/dorms for map', e);
    } finally {
      this.isZoneMapLoading = false;
    }
  }
  closeZoneModal() { this.isZoneModalOpen = false; }

  openViewModal() {
    this.isViewModalOpen = true;
    this.selectedYearForTable = null;
    setTimeout(() => this.renderViewChart(), 100);
  }
  closeViewModal() { this.isViewModalOpen = false; this.destroyCharts(); }

  goToFilteredZones(zoneName: string) {
    this.closeZoneModal();
    this.router.navigate(['/manage-dorm'], { queryParams: { zoneFilter: zoneName } });
  }

  // Navigate from dorm status chart click
  goToManageDormWithStatus(statusName: string) {
    this.closeDormModal();
    this.router.navigate(['/manage-dorm'], { queryParams: { statusFilter: statusName } });
  }

  // Navigate from dorm type chart click
  goToManageDormWithType(typeName: string) {
    this.closeDormModal();
    this.router.navigate(['/manage-dorm'], { queryParams: { typeFilter: typeName } });
  }

  private destroyCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  // --- Chart Rendering Methods ---
  renderDormCharts() {
    if (!this.stats || !this.dormStatusCanvas || !this.dormTypeCanvas) return;

    const statusColors = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];
    const statusCtx = this.dormStatusCanvas.nativeElement;
    const statusChart = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: this.stats.dormStatusBreakdown.map(d => d.statusName),
        datasets: [{
          data: this.stats.dormStatusBreakdown.map(d => d.count),
          backgroundColor: statusColors,
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 12,
        }]
      },
      options: {
        responsive: true,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} แห่ง` } }
        },
        onClick: (event, elements) => {
          if (elements && elements.length > 0 && elements[0]) {
            const idx = elements[0].index;
            const statusName = this.stats!.dormStatusBreakdown[idx]?.statusName;
            if (statusName) this.goToManageDormWithStatus(statusName);
          }
        }
      }
    });

    const typeColors = ['#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];
    const typeCtx = this.dormTypeCanvas.nativeElement;
    const typeChart = new Chart(typeCtx, {
      type: 'doughnut',
      data: {
        labels: this.stats.dormTypeBreakdown.map(d => d.typeName),
        datasets: [{
          data: this.stats.dormTypeBreakdown.map(d => d.count),
          backgroundColor: typeColors,
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 12,
        }]
      },
      options: {
        responsive: true,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} แห่ง` } }
        },
        onClick: (event, elements) => {
          if (elements && elements.length > 0 && elements[0]) {
            const idx = elements[0].index;
            const typeName = this.stats!.dormTypeBreakdown[idx]?.typeName;
            if (typeName) this.goToManageDormWithType(typeName);
          }
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
    const barColors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    const ctx = this.viewCanvas.nativeElement;
    const viewChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.map(y => `ปี ${y}`),
        datasets: [{
          label: 'ยอดเข้าชม',
          data: data as number[],
          backgroundColor: barColors.slice(0, labels.length),
          borderRadius: 10,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${(ctx.raw as number).toLocaleString()} ครั้ง` } }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 12 } } },
          x: { grid: { display: false }, ticks: { font: { size: 13, weight: 'bold' } } }
        },
        onClick: (event, elements) => {
          if (elements && elements.length > 0 && elements[0]) {
            const index = elements[0].index;
            const clickedYear = labels[index];
            if (clickedYear) {
              this.selectedYearForTable = clickedYear;
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

  getTotalViewsForYear(year: number): number {
    if (!this.stats) return 0;
    return this.stats.viewsPerMonthBreakdown
      .filter(v => v.year === year)
      .reduce((sum, v) => sum + v.count, 0);
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