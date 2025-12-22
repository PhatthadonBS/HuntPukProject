import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// ✅ เพิ่ม IonButtons และ IonBackButton เข้ามาครับ
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton, 
  IonModal, IonButtons, IonBackButton, // <--- เพิ่มตรงนี้
  AlertController, ToastController 
} from '@ionic/angular/standalone';
import { UserService, UserRegPostReq } from '../../services/user';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  personOutline, trashOutline, searchOutline, personAddOutline, 
  createOutline, filterOutline, caretDown, close 
} from 'ionicons/icons';
@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.page.html',
  styleUrls: ['./manage-users.page.scss'],
  standalone: true,
  // ✅ อย่าลืมใส่ IonModal ในนี้ด้วย
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton, IonModal, CommonModule, FormsModule, IonButtons, IonBackButton]
})
export class ManageUsersPage implements OnInit {
  
  users: any[] = [];         
  searchTerm: string = '';   
  filterType: string = 'all';

  isAddModalOpen = false;
  
  // ✅ บังคับ role_type_id = 1 (สมาชิก) เท่านั้น
  newUser: UserRegPostReq = {
    username: '',
    password: '',
    email: '',
    phone_number: '',
    role_type_id: 1 
  };

  constructor(
    private userService: UserService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) { 
    addIcons({ personOutline, trashOutline, searchOutline, personAddOutline, createOutline, filterOutline, caretDown, close });
  }

  ngOnInit() {
    this.loadAllUsers();
  }

  ionViewWillEnter() {
    this.loadAllUsers();
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

  async onSearch() {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.loadAllUsers(); 
      return;
    }
    const searchId = Number(this.searchTerm);
    if (!isNaN(searchId)) {
      const user = await this.userService.getUserProfile(searchId);
      this.users = user ? [user] : [];
    } else {
      await this.loadAllUsers();
    }
  }

  goToRegister() {
    this.openAddModal();
  }

  goToProfile(userId: number) {
    console.log('📌 กำลังจะไปหน้า Profile ของ ID:', userId); // ดู log ตรงนี้

    if (userId) {
      this.router.navigate(['/my-account', userId]); 
    } else {
      console.error('❌ ไม่พบ User ID! ตรวจสอบตัวแปรใน HTML');
    }
  }

  async confirmBan(user: any) {
    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการแบน',
      message: `คุณต้องการแบนผู้ใช้ ${user.username} ใช่หรือไม่?`,
      buttons: [
        { text: 'ยกเลิก', role: 'cancel' },
        {
          text: 'แบนเลย',
          role: 'destructive',
          handler: async () => {
            const success = await this.userService.banUser(user.id);
            if (success) this.loadAllUsers();
          }
        }
      ]
    });
    await alert.present();
  }

  getDormStatusText(roleId: number): string {
    return roleId === 2 ? 'ลงทะเบียนหอพัก' : 'ไม่ได้ลงทะเบียนหอพัก';
  }

  // ==========================================
  // ส่วนจัดการเพิ่มสมาชิกใหม่
  // ==========================================

  openAddModal() {
    this.isAddModalOpen = true;
    // ✅ Reset Form (role เป็น 1 เสมอ)
    this.newUser = { username: '', password: '', email: '', phone_number: '', role_type_id: 1 };
  }

  closeAddModal() {
    this.isAddModalOpen = false;
  }

 async saveNewUser() {
    // 1. ตรวจสอบว่ากรอกครบไหม
    if (!this.newUser.username || !this.newUser.password || !this.newUser.email || !this.newUser.phone_number) {
      const toast = await this.toastCtrl.create({ 
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน', 
        duration: 2000, 
        color: 'warning' 
      });
      await toast.present();
      return;
    }

    // 2. ตรวจสอบเบอร์โทร (ให้ตรงกับ Backend Regex: /^0[0-9]{9}$/)
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(this.newUser.phone_number)) {
       const toast = await this.toastCtrl.create({ 
        message: 'เบอร์โทรต้องเป็นตัวเลข 10 หลักและขึ้นต้นด้วย 0 เท่านั้น', 
        duration: 3000, 
        color: 'danger' 
      });
      await toast.present();
      return;
    }

    try {
      // 🟢 เตรียม Payload สำหรับ Sec1 
      // ⚠️ สำคัญมาก: ต้องเปลี่ยนชื่อ key ให้ตรงกับที่ Backend รอรับ
      const payloadSec1 = {
        username: this.newUser.username,
        email: this.newUser.email,
        password: this.newUser.password,
        phone: this.newUser.phone_number // 👈 Backend ใช้คำว่า phone เฉยๆ
      };

      console.log('📦 Sending to Sec1:', payloadSec1);

      // Step 1: ยิงไป registerSec1 (Backend จะ Hash password ให้ และส่ง Data กลับมา)
      const sec1Result = await this.userService.register(payloadSec1);
      
      console.log('✅ Sec1 Result:', sec1Result);

      if (sec1Result) {
         // Step 2: ยิงไป registerSec2
         // ส่งผลลัพธ์จาก Sec1 ไปให้ Sec2 (เพราะในนั้นมี Hashed Password แล้ว)
         await this.userService.registerSec2(sec1Result, true);
         console.log('✅ Sec2 Success');
      } else {
         throw new Error('ไม่ได้รับข้อมูลตอบกลับจากขั้นตอนแรก');
      }

      // ✅ สำเร็จ
      const toast = await this.toastCtrl.create({ 
        message: 'เพิ่มสมาชิกสำเร็จ', 
        duration: 2000, 
        color: 'success' 
      });
      await toast.present();
      
      this.closeAddModal();
      this.loadAllUsers(); // โหลดข้อมูลใหม่มาแสดง

      // ❌ ตัดส่วน Redirect ไปหน้า Profile ออก 
      // เพราะ Backend registerSec2 ไม่ได้คืนค่า ID (INSERT ID) กลับมาให้
      
    } catch (error: any) {
      console.error('❌ Save User Failed:', error);
      
      let msg = 'เกิดข้อผิดพลาดในการบันทึก';
      
      // ดึง Error Message จาก Backend
      if (error.error) {
        if (typeof error.error === 'string') msg = error.error; 
        else if (error.error.message) msg = error.error.message;
      } else if (error.message) {
        msg = error.message;
      }

      const toast = await this.toastCtrl.create({ 
        message: `บันทึกไม่สำเร็จ: ${msg}`, 
        duration: 4000, 
        color: 'danger' 
      });
      await toast.present();
    }
  }
}