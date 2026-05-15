import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu', // นี่คือชื่อ Tag ที่เราจะเอาไปเรียกใช้
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class MenuComponent implements OnInit {
  currentUser: any = null;

  constructor(
    private router: Router, 
    private menuCtrl: MenuController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.checkLoginStatus();
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
    await this.menuCtrl.close('main-menu');
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
                    await this.menuCtrl.close('main-menu');
                    this.router.navigate(['/login']);
                }
            }
        ]
    });
    await alert.present();
  }
}