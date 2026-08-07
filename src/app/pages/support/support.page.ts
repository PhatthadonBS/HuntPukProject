import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';
import { addIcons } from 'ionicons';
import { bugOutline, starOutline, callOutline, mailOutline, openOutline, arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-support',
  templateUrl: './support.page.html',
  styleUrls: ['./support.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent]
})
export class SupportPage implements OnInit {
  feedbackFormUrl = 'https://forms.gle/RRH2sh7uX7by7t1D9';
  ratingFormUrl = 'https://forms.gle/84VCo4wycEcUQsWU9';

  constructor() {
    addIcons({
      'bug-outline': bugOutline,
      'star-outline': starOutline,
      'call-outline': callOutline,
      'mail-outline': mailOutline,
      'open-outline': openOutline,
      'arrow-back-outline': arrowBackOutline
    });
  }

  ngOnInit() {
  }

  openLink(url: string) {
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  }
}
