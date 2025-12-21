import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton, AlertController } from '@ionic/angular/standalone';
import { UserService } from '../../services/user'; // อย่าลืม path ให้ถูก
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { personOutline, trashOutline, searchOutline, personAddOutline, createOutline } from 'ionicons/icons';

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.page.html',
  styleUrls: ['./manage-users.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonIcon, IonButton]
})
export class ManageUsersPage implements OnInit {
  
  users: any[] = [];         // รายชื่อที่แสดงผล
  searchTerm: string = '';   // คำค้นหา

  constructor(
    private userService: UserService,
    private router: Router,
    private alertCtrl: AlertController
  ) { 
    // เพิ่มไอคอนที่ต้องใช้
    addIcons({ personOutline, trashOutline, searchOutline, personAddOutline, createOutline });
  }

  ngOnInit() {
    this.loadAllUsers();
  }

  ionViewWillEnter() {
    // รีโหลดข้อมูลทุกครั้งที่กลับมาหน้านี้ (เผื่อมีการแก้ไขมาจากหน้าอื่น)
    this.loadAllUsers();
  }

  // โหลดรายชื่อทั้งหมด
  async loadAllUsers() {
    const allUsers = await this.userService.getAllUsers();
    // กรองเอาเฉพาะ Role 1 (Member) และ Role 2 (Owner) ตามโจทย์
    // และไม่เอาคนที่มี status = 2 (โดนแบนไปแล้ว) *ถ้าต้องการแสดงคนโดนแบนด้วยก็ลบเงื่อนไข status ออก*
    this.users = allUsers.filter(user => (user.role_id === 1 || user.role_id === 2)); 
  }

  // ฟังก์ชันค้นหา (กดปุ่มค้นหา)
  async onSearch() {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.loadAllUsers(); // ถ้าช่องว่าง ให้โหลดใหม่ทั้งหมด
      return;
    }

    // โจทย์: ค้นหาก็เรียกใช้ api router.get('/spec/user/:id')
    // หมายเหตุ: API นี้รับ parameter เป็น ID ถ้า user พิมพ์ชื่อมาอาจจะ error หรือไม่เจอ
    // เราจะลองแปลงเป็นตัวเลขเพื่อส่งไป API
    const searchId = Number(this.searchTerm);

    if (!isNaN(searchId)) {
      const user = await this.userService.getUserProfile(searchId);
      if (user) {
        this.users = [user]; // แสดงผลแค่คนเดียวที่เจอ
      } else {
        this.users = []; // ไม่เจอ
      }
    } else {
      // กรณีพิมพ์เป็นชื่อ (Frontend Filter แทน เพราะ API รับแต่ ID)
      // หรือแจ้งเตือนว่าต้องใส่ ID ก็ได้ แต่ Filter จะ UX ดีกว่า
      const all = await this.userService.getAllUsers();
      this.users = all.filter(u => u.username.toLowerCase().includes(this.searchTerm.toLowerCase()));
    }
  }

  // ไปหน้า Register
  goToRegister() {
    this.router.navigate(['/register']); // เปลี่ยน path ตามจริงของคุณ
  }

  // ไปหน้า Profile (แก้ไข)
  goToProfile(userId: number) {
    // ไปหน้าบัญชีของคนนั้น เหมือนเมื่อกด username
    this.router.navigate(['/account-page', userId]); // เปลี่ยน path ตามจริงของคุณ
  }

  // ฟังก์ชันแบน
  async confirmBan(user: any) {
    const alert = await this.alertCtrl.create({
      header: 'ยืนยันการแบน',
      message: `คุณต้องการแบนผู้ใช้ ${user.username} ใช่หรือไม่?`,
      buttons: [
        {
          text: 'ยกเลิก',
          role: 'cancel'
        },
        {
          text: 'แบนเลย',
          role: 'destructive',
          handler: async () => {
            const success = await this.userService.banUser(user.id);
            if (success) {
              // ลบออกจากรายการ หรือ รีโหลดใหม่
              this.loadAllUsers();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // Helper สำหรับแสดงข้อความสถานะหอพัก
  getDormStatusText(roleId: number): string {
    // 1 = สมาชิก (ไม่ได้ลงทะเบียนหอพัก), 2 = เจ้าของหอพัก (ลงทะเบียนหอพัก)
    return roleId === 2 ? 'ลงทะเบียนหอพัก' : 'ไม่ได้ลงทะเบียนหอพัก';
  }
}