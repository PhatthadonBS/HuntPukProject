import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';
import { addIcons } from 'ionicons';
import { bugOutline, starOutline, callOutline, documentTextOutline, mailOutline, logoFacebook, chatbubblesOutline, arrowBackOutline, openOutline } from 'ionicons/icons';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, HeaderComponent]
})
export class AboutPage implements OnInit {
  // URLs for Google Forms
  errorFormUrl = '#'; // TODO: Replace with actual Google Form Link
  ratingFormUrl = '#'; // TODO: Replace with actual Google Form Link

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
      'open-outline': openOutline
    });
  }

  ngOnInit() {}

  openLink(url: string) {
    if (url !== '#') {
      window.open(url, '_blank');
    } else {
      alert('รอเพิ่มลิงก์ Google Form ในภายหลังครับ');
    }
  }
}
