import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
// import { addIcons } from 'ionicons'; // ถ้าไอคอนไม่ขึ้น อาจต้องใช้บรรทัดนี้ใน ionic เวอร์ชั่นใหม่ๆ
// import { person, key, arrowForwardCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LoginPage implements OnInit {

  email: string = '';
  password: string = '';

  constructor(private router: Router) { 
    // addIcons({ person, key, arrowForwardCircleOutline }); // ถ้าไอคอนไม่ขึ้น
  }

  ngOnInit() {
  }

  login() {
    console.log('Login with:', this.email, this.password);
    // TODO: ใส่ Logic เชื่อมต่อ Database ตรงนี้
    this.router.navigate(['/home']);
  }

  skip() {
    this.router.navigate(['/home']);
  }

}