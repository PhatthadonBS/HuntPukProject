import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from '../../components/header/header.component';
import { addIcons } from 'ionicons';
import { downloadOutline } from 'ionicons/icons';

@Component({
  selector: 'app-download-app',
  templateUrl: './download-app.page.html',
  styleUrls: ['./download-app.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent]
})
export class DownloadAppPage implements OnInit {

  constructor() { 
    addIcons({ downloadOutline });
  }

  ngOnInit() {
  }

}
