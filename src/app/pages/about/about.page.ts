import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';
import { TeamModalComponent, TeamMember } from '../../components/team-modal/team-modal.component';
import { addIcons } from 'ionicons';
import {
  bugOutline, starOutline, callOutline, documentTextOutline,
  mailOutline, logoFacebook, chatbubblesOutline, arrowBackOutline,
  openOutline, peopleOutline
} from 'ionicons/icons';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, HeaderComponent, TeamModalComponent]
})
export class AboutPage implements OnInit {
  feedbackFormUrl = 'https://forms.gle/yAFcXB5iZoXUj3qFA';
  ratingFormUrl = 'https://forms.gle/gwsN7eyL9iaEaDKR8';

  showTeamModal = false;

  // TODO: เปลี่ยนชื่อ, ตำแหน่ง, avatar (ตัวอักษรย่อ) และลิงก์ Facebook ให้ถูกต้อง
  teamMembers: TeamMember[] = [
    {
      name: 'ชื่อผู้จัดทำ คนที่ 1',
      role: 'Frontend Developer',
      avatar: 'P',
      avatarColor: '#FFD600',
      avatarTextColor: '#1a1a1a',
      facebookUrl: 'https://facebook.com/'
    },
    {
      name: 'ชื่อผู้จัดทำ คนที่ 2',
      role: 'Backend Developer',
      avatar: 'P',
      avatarColor: '#1877f2',
      avatarTextColor: '#ffffff',
      facebookUrl: 'https://facebook.com/'
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
      'people-outline': peopleOutline,
    });
  }

  ngOnInit() {}

  openLink(url: string) {
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  }
}
