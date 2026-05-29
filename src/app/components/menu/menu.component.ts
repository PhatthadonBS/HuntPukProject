import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

// 👇 เพิ่ม 2 บรรทัดนี้เข้าไปครับ 👇
import { addIcons } from 'ionicons';
import { 
  home, listOutline, starOutline, person, personCircleOutline, 
  key, create, business, heartOutline, logOutOutline 
} from 'ionicons/icons';
@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class MenuComponent implements OnInit {
  currentUser: any = null;
  isOpen = false; // ตัวแปรเปิด/ปิดเมนู

  constructor(
    private router: Router, 
    private alertCtrl: AlertController,
    private cdr: ChangeDetectorRef // ✅ อาวุธลับสำหรับโหมด --prod
  ) {
    // ✅ ลงทะเบียนไอคอนใหม่ทั้งหมด
   addIcons({
      home, 
      listOutline, 
      starOutline, 
      person, 
      personCircleOutline,
      key, 
      create, 
      business, 
      heartOutline, 
      logOutOutline
    });
  }

  ngOnInit() {
    this.checkLoginStatus();
  }

// ✅ รับคำสั่งจากหน้า Home และบังคับหน้าจอให้อัปเดตทันที
  @HostListener('window:toggle-sidebar')
  toggleSidebar() {
    this.checkLoginStatus();
    this.isOpen = !this.isOpen;
    this.cdr.detectChanges();
  }

  // ✅ เพิ่ม: ฟังทุกครั้งที่ navigate กลับมาหน้าที่มีเมนู
  @HostListener('window:user-logged-in')
  onUserLoggedIn() {
    this.checkLoginStatus();
  }

  // ✅ รับ event ตอน auto logout
  @HostListener('window:user-logged-out')
  onUserLoggedOut() {
    this.currentUser = null;
    this.isOpen = false;
    this.cdr.detectChanges();
  }

  get userRole(): number {
    if (!this.currentUser) return 0;
    // ✅ รองรับทั้ง role_id, role_type_id, ROLE_TYPE_ID
    const role = this.currentUser.role_id 
      || this.currentUser.ROLE_TYPE_ID 
      || this.currentUser.role_type_id 
      || 0;
    return Number(role);
  }

  checkLoginStatus() {
    const storedData = localStorage.getItem('loggedIn');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);

        // ✅ รองรับทั้ง { user: {...} } และ { id, username, ... } โดยตรง
        const userObj = parsed.user ? parsed.user : parsed;

        if (userObj && userObj.id) {
          // ✅ เช็ค accout_status (ชื่อผิด) หรือ account_status หรือ ACCOUNT_STATUS
          const status = userObj.accout_status 
            ?? userObj.account_status 
            ?? userObj.ACCOUNT_STATUS 
            ?? 0; // ถ้าไม่มี field นี้ให้ถือว่า active

          if (status === 0 || status === 'active') {
            this.currentUser = userObj;
            console.log('✅ Menu: User logged in, role:', this.userRole, 'user:', userObj);
          } else {
            this.currentUser = null;
            console.warn('⚠️ Menu: Account suspended');
          }
        } else {
          this.currentUser = null;
        }
      } catch (e) {
        console.error('❌ Menu: Parse localStorage error', e);
        this.currentUser = null;
      }
    } else {
      this.currentUser = null;
    }
    this.cdr.detectChanges();
  }

  async navigate(path: string) {
    this.isOpen = false;
    this.router.navigate([path]);
  }

  async logout() {
    const alert = await this.alertCtrl.create({
        header: 'ยืนยัน',
        message: 'ต้องการออกจากระบบใช่หรือไม่?',
        buttons: [
            { text: 'ยกเลิก', role: 'cancel' },
            {
                text: 'ออกจากระบบ',
                role: 'destructive',
                handler: async () => {
                    localStorage.removeItem('loggedIn');
                    this.currentUser = null;
                    this.isOpen = false;
                    this.router.navigate(['/login']);
                }
            }
        ]
    });
    await alert.present();
  }
}