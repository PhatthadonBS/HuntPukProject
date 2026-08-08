import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';
import { addIcons } from 'ionicons';
import {
  mapOutline,
  flashOutline,
  shieldCheckmarkOutline,
  mailOutline,
  logoFacebook,
  logoTwitter,
  logoInstagram,
  arrowBackCircleOutline,
  callOutline,
  documentTextOutline,
} from 'ionicons/icons';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule, HeaderComponent]
})
export class AboutPage implements OnInit {
  
  adviser = {
    name: 'ผศ.ดร.สำรวน เวียงสมุทร',
    position: 'อาจารย์ที่ปรึกษาโปรเจค',
    imageUrl:
      'https://cs.it.msu.ac.th/uploads/faculty/assistant_prof_3_1758177117.jpg',
  };
  
  developers = [
    {
      name: 'นายพัทธดนย์ สุดหลักทอง',
      position: 'Mobile Developer',
      imageUrl: '/assets/devTeam/Phattadon.jpg',
    },
    {
      name: 'นายอรรมนาถ แป้นโสม',
      position: 'Web Developer',
      imageUrl: '/assets/devTeam/Oammanat.jpg',
    },
  ];

  constructor(private navCtrl: NavController) {
    addIcons({
      mapOutline,
      flashOutline,
      shieldCheckmarkOutline,
      mailOutline,
      logoFacebook,
      logoTwitter,
      logoInstagram,
      arrowBackCircleOutline,
      callOutline,
      documentTextOutline,
    });
  }

  ngOnInit() {}

  goBack() {
    this.navCtrl.back();
  }
}
