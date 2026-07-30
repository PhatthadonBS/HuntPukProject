import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';
import { addIcons } from 'ionicons';
import {
  bugOutline, starOutline, callOutline, documentTextOutline,
  mailOutline, logoFacebook, chatbubblesOutline, arrowBackOutline,
  openOutline, codeSlashOutline
} from 'ionicons/icons';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, HeaderComponent]
})
export class AboutPage implements OnInit {

  // TODO: เปลี่ยนชื่อ, ตำแหน่ง, avatar (ตัวอักษรย่อ) และลิงก์ Facebook/เบอร์โทร ให้ถูกต้อง
  advisor: any = {
    name: 'ผู้ช่วยศาสตราจารย์ ดร.สำรวน เวียงสมุทร',
    role: 'อาจารย์ที่ปรึกษา',
    avatar: 'T',
    avatarColor: '#ff4d4d',
    avatarTextColor: '#ffffff',
  };

  teamMembers: any[] = [
    {
      name: 'นายอรรมนาถ แป้นโสม',
      role: 'Frontend Developer,Backend Developer',
      avatar: 'P',
      avatarColor: '#FFD600',
      avatarTextColor: '#1a1a1a',
    },
    {
      name: 'นายพัทธดนย์ สุดหลักทอง',
      role: 'Frontend Developer,Backend Developer',
      avatar: 'P',
      avatarColor: '#1877f2',
      avatarTextColor: '#ffffff',
    }
  ];

  constructor() {
    addIcons({
      'bug-outline': bugOutline,
      'star-outline': starOutline,
      'call-outline': callOutline,
      'document-text-outline': documentTextOutline,
      'mail-outline': mailOutline,
      'logo-facebook': logoFacebook,
      'chatbubbles-outline': chatbubblesOutline,
      'arrow-back-outline': arrowBackOutline,
      'open-outline': openOutline,
      'code-slash-outline': codeSlashOutline
    });
  }

  ngOnInit() {}

  openLink(url: string) {
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  }
}
