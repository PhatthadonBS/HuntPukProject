import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

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
  ) {}

  ngOnInit() {
    this.checkLoginStatus();
  }

  // ✅ รับคำสั่งจากหน้า Home และบังคับหน้าจอให้อัปเดตทันที
  @HostListener('window:toggle-sidebar')
  toggleSidebar() {
    this.isOpen = !this.isOpen;
    this.cdr.detectChanges(); 
  }

  get userRole(): number {
    if (!this.currentUser) return 0;
    return this.currentUser.role_id || this.currentUser.ROLE_TYPE_ID || this.currentUser.role_type_id || 1;
  }

  checkLoginStatus() {
    const storedData = localStorage.getItem('loggedIn');
    if (storedData) {
      try {
        const userObj = JSON.parse(storedData);
        if (userObj && userObj.accout_status === 0) {
           this.currentUser = userObj;
        }
      } catch (e) {
        this.currentUser = null;
      }
    }
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