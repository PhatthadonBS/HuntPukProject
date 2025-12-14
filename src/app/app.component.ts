import { Component } from '@angular/core';
import { IonicModule, MenuController } from "@ionic/angular"; // เพิ่ม MenuController
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule], 
})
export class AppComponent {
  
  // เพิ่ม constructor เพื่อเรียก MenuController
  constructor(private menuCtrl: MenuController) {
    // สั่งปิดเมนูทันทีที่เข้าแอป เผื่อมันค้าง
    this.menuCtrl.enable(true, 'main-menu');
    this.menuCtrl.close('main-menu');
  }
}