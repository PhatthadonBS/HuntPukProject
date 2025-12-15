import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack, saveOutline } from 'ionicons/icons';

// ✅ Import Standalone Components
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
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
  standalone: true,
  // ✅ ใส่ imports ให้ครบ
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
export class EditProfilePage implements OnInit {

  editData = {
    username: '',
    email: ''
  };
  
  fullUserData: any = {};

  constructor(private router: Router, private toastController: ToastController) { 
    addIcons({ arrowBack, saveOutline });
  }

  ngOnInit() {
    const stored = localStorage.getItem('loggedIn');
    if (stored) {
      this.fullUserData = JSON.parse(stored);
      this.editData.username = this.fullUserData.username;
      this.editData.email = this.fullUserData.email;
    }
  }

  async saveProfile() {
    this.fullUserData.username = this.editData.username;
    this.fullUserData.email = this.editData.email;

    localStorage.setItem('loggedIn', JSON.stringify(this.fullUserData));

    const toast = await this.toastController.create({
      message: 'บันทึกข้อมูลเรียบร้อย',
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();

    this.router.navigate(['/my-account']);
  }

  goBack() {
    this.router.navigate(['/my-account']);
  }
}