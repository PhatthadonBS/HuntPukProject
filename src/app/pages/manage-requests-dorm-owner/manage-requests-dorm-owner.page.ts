import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-manage-requests-dorm-owner',
  templateUrl: './manage-requests-dorm-owner.page.html',
  styleUrls: ['./manage-requests-dorm-owner.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ManageRequestsDormOwnerPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
