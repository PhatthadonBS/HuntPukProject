import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { personOutline, mailOutline, createOutline, arrowBack } from 'ionicons/icons';

// ✅ Import Component ของ Ionic แบบ Standalone มาให้ครบทุกตัวที่ใช้ใน HTML
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
  // ✅ ใส่ชื่อ Component ที่ Import มาลงในนี้ให้หมด
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
    addIcons({ personOutline, mailOutline, createOutline, arrowBack });
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