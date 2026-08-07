import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// ✅ เพิ่ม IonButtons และ IonBackButton เข้ามาครับ
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton, 
  IonModal, IonButtons, IonBackButton, 
  AlertController, ToastController, ModalController 
} from '@ionic/angular/standalone';
import { UserService, UserRegPostReq } from '../../services/user';
import { DormitoryService } from '../../services/dormitory';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DormRequestModalComponent } from '../../components/dorm-request-modal/dorm-request-modal.component';
import { addIcons } from 'ionicons';
import { 
  personOutline, trashOutline, searchOutline, personAddOutline, 
  createOutline, filterOutline, caretDown, close, mail, call, personCircle, arrowBackOutline,
  warningOutline, refreshOutline, documentTextOutline, settingsOutline,
  businessOutline, chevronForwardOutline, addCircleOutline, peopleOutline, closeOutline
} from 'ionicons/icons';
@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.page.html',
  styleUrls: ['./manage-users.page.scss'],
  standalone: true,
  // ✅ อย่าลืมใส่ IonModal ในนี้ด้วย
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton, IonModal, CommonModule, FormsModule, IonButtons, IonBackButton, RouterModule, DormRequestModalComponent]
})
export class ManageUsersPage implements OnInit {
  
  users: any[] = [];         
  searchTerm: string = '';   
  filterType: string = 'all';

  isAddModalOpen = false;
  isOwnerModalOpen = false;
  selectedOwner: any = null;
  
  isBanModalOpen = false;
  selectedBanUser: any = null;
  banActionType: 'ban' | 'unban' = 'ban';
  
  isTypeSelectOpen = false;

  constructor(
    private userService: UserService,
    private dormService: DormitoryService,
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController
  ) { 
    addIcons({ personOutline, trashOutline, searchOutline, personAddOutline, createOutline, filterOutline, caretDown, close, mail, call, 'person-circle': personCircle, 'arrow-back-outline': arrowBackOutline, 'warning-outline': warningOutline, 'refresh-outline': refreshOutline, 'document-text-outline': documentTextOutline, 'settings-outline': settingsOutline, 'business-outline': businessOutline, 'chevron-forward-outline': chevronForwardOutline, 'add-circle-outline': addCircleOutline, 'people-outline': peopleOutline, 'close-outline': closeOutline });
  }

  ngOnInit() {
    this.checkQueryParams();
    this.loadAllUsers();
  }

  ionViewWillEnter() {
    this.checkQueryParams();
    this.loadAllUsers();
  }
  
  checkQueryParams() {
    const params = this.route.snapshot.queryParams;
    if (params['roleFilter']) {
      this.filterType = params['roleFilter'];
    }
  }

  async loadAllUsers() {
    const allUsers = await this.userService.getAllUsers();
    this.users = allUsers.filter(user => (user.role_id === 1 || user.role_id === 2)); 
  }

  get displayedUsers() {
    let tempUsers = this.users;

    if (this.filterType === 'member') {
      tempUsers = tempUsers.filter(u => u.role_id === 1);
    } else if (this.filterType === 'owner') {
      tempUsers = tempUsers.filter(u => u.role_id === 2);
    }

    if (this.searchTerm && isNaN(Number(this.searchTerm))) {
        tempUsers = tempUsers.filter(u => u.username.toLowerCase().includes(this.searchTerm.toLowerCase()));
    }

    return tempUsers;
  }

  filteredUsernames: string[] = [];
  showAutocomplete: boolean = false;

  async onSearchInput() {
    if (this.searchTerm && this.searchTerm.trim() !== '' && isNaN(Number(this.searchTerm))) {
      this.filteredUsernames = this.users
        .filter(u => u.username.toLowerCase().includes(this.searchTerm.toLowerCase()))
        .map(u => u.username)
        .slice(0, 5); // limit to 5
      this.showAutocomplete = this.filteredUsernames.length > 0;
    } else {
      this.showAutocomplete = false;
    }
  }

  selectAutocomplete(username: string) {
    this.searchTerm = username;
    this.showAutocomplete = false;
    this.onSearch();
  }

  async onSearch() {
    this.showAutocomplete = false;
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      await this.loadAllUsers(); 
      return;
    }
    const searchId = Number(this.searchTerm);
    if (!isNaN(searchId)) {
      const user = await this.userService.getUserProfile(searchId);
      this.users = user ? [user] : [];
    }
    // If it's a string search, `displayedUsers` getter handles it based on `this.users` and `this.searchTerm`
  }

  goToRegister() {
    this.router.navigate(['/register'], { queryParams: { fromAdmin: true } });
  }

  goToProfile(userId: number) {
    console.log('📌 กำลังจะไปหน้า Profile ของ ID:', userId); // ดู log ตรงนี้

    if (userId) {
      this.router.navigate(['/my-account', userId]); 
    } else {
      console.error('❌ ไม่พบ User ID! ตรวจสอบตัวแปรใน HTML');
    }
  }


  getDormStatusText(roleId: number): string {
    return roleId === 2 ? 'ลงทะเบียนหอพัก' : 'ไม่ได้ลงทะเบียนหอพัก';
  }

  // ==========================================
  // ส่วนจัดการแสดง Popup ข้อมูลเจ้าของหอพัก
  // ==========================================
  async openOwnerModal(user: any) {
    if (user.role_id === 2 || user.role_id === '2') {
      const profile = await this.userService.getUserProfile(user.id);
      this.selectedOwner = profile ? profile : user;

      try {
        const response = await this.dormService.getMyDorms(user.id);
        if (response && response.success && response.data) {
          this.selectedOwner.dorms = response.data;
        }
      } catch (e) {
        console.error('Error fetching dorms for owner:', e);
      }

      this.isOwnerModalOpen = true;
    }
  }

  async viewDormDetail(dorm: any) {
    try {
      // ปิด popup ข้อมูลเจ้าของหอพักก่อน
      this.isOwnerModalOpen = false;
      
      // รอให้ Popup ปิดเสร็จก่อนค่อยเปลี่ยนหน้า เพื่อป้องกัน Popup ค้าง
      setTimeout(() => {
        if (dorm.DORM_ID) {
          this.router.navigate(['/dorm-detail', dorm.DORM_ID]);
        }
      }, 300);
    } catch (e) {
      console.error('Error navigating to dorm detail:', e);
    }
  }

  closeOwnerModal() {
    this.isOwnerModalOpen = false;
    setTimeout(() => {
      this.selectedOwner = null;
    }, 300);
  }

  // ==========================================
  // ส่วนจัดการเพิ่มสมาชิกใหม่
  // ==========================================

  openTypeSelectModal() {
    this.isTypeSelectOpen = true;
  }

  closeTypeSelectModal() {
    this.isTypeSelectOpen = false;
  }

  selectMemberType(type: 'general' | 'owner') {
    this.isTypeSelectOpen = false;
    if (type === 'general') {
      this.router.navigate(['/register'], { queryParams: { fromAdmin: true } });
    } else {
      this.router.navigate(['/requests']);
    }
  }

  // Removed old modal-based user saving logic

  // ==========================================
  // ส่วนจัดการแบนสมาชิก
  // ==========================================

  openBanConfirmModal(user: any, action: 'ban' | 'unban') {
    this.selectedBanUser = user;
    this.banActionType = action;
    this.isBanModalOpen = true;
  }

  closeBanConfirmModal() {
    this.isBanModalOpen = false;
    this.selectedBanUser = null;
  }

  async confirmBanAction() {
    if (!this.selectedBanUser) return;
    
    const user = this.selectedBanUser;
    const action = this.banActionType;
    this.closeBanConfirmModal();

    try {
      let success = false;
      if (action === 'ban') {
        success = await this.userService.banUser(user.id);
      } else {
        success = await this.userService.unbanUser(user.id);
      }
      
      if (success) {
        const toast = await this.toastCtrl.create({
          message: action === 'ban' ? `แบนผู้ใช้ ${user.username} สำเร็จ` : `ยกเลิกแบน ${user.username} สำเร็จ`,
          duration: 2000,
          color: 'success'
        });
        await toast.present();
        await this.loadAllUsers(); 
      } else {
        throw new Error(action === 'ban' ? 'Ban failed' : 'Unban failed');
      }
    } catch (error) {
      console.error('Ban/Unban Error:', error);
      const toast = await this.toastCtrl.create({
        message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  // ==========================================
  // ส่วนจัดการลบบัญชี
  // ==========================================

  isDeleteModalOpen = false;
  selectedDeleteUser: any = null;

  openDeleteConfirmModal(user: any) {
    this.selectedDeleteUser = user;
    this.isDeleteModalOpen = true;
  }

  closeDeleteConfirmModal() {
    this.isDeleteModalOpen = false;
    this.selectedDeleteUser = null;
  }

  async confirmDeleteAction() {
    if (!this.selectedDeleteUser) return;
    
    const user = this.selectedDeleteUser;
    this.closeDeleteConfirmModal();

    try {
      const success = await this.userService.hardDeleteAccount(user.id);
      
      if (success) {
        const toast = await this.toastCtrl.create({
          message: `ลบบัญชีผู้ใช้ ${user.username} สำเร็จ`,
          duration: 2000,
          color: 'success'
        });
        await toast.present();
        await this.loadAllUsers(); 
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Delete Account Error:', error);
      const toast = await this.toastCtrl.create({
        message: 'เกิดข้อผิดพลาดในการลบบัญชี กรุณาลองใหม่อีกครั้ง',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }
}