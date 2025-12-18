import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
// ✅ Import ไอคอนให้ครบ (ใช้แบบ Filled เพื่อให้ตรงกับ HTML)
import { person, mail, create, arrowBack, call, shieldCheckmark } from 'ionicons/icons';

import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButtons, 
  IonButton, 
  IonIcon 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.page.html',
  styleUrls: ['./my-account.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButtons, 
    IonButton, 
    IonIcon
  ]
})
export class MyAccountPage implements OnInit {

  user: any = {};

  constructor(private router: Router) { 
    // ✅ ลงทะเบียนไอคอนให้ครบตามที่ใช้ใน HTML
    addIcons({ person, mail, create, arrowBack, call, shieldCheckmark });
  }

  ngOnInit() {
    this.loadUserData();
  }

  ionViewDidEnter() {
    this.loadUserData();
  }

  loadUserData() {
    const stored = localStorage.getItem('loggedIn');
    if (stored) {
      try {
        this.user = JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }

  goToEditProfile() {
    this.router.navigate(['/edit-profile']);
  }
  
  goBack() {
    this.router.navigate(['/home']);
  }
}