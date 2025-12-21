import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-manage-requests-createdorm',
  templateUrl: './manage-requests-createdorm.page.html',
  styleUrls: ['./manage-requests-createdorm.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ManageRequestsCreatedormPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
