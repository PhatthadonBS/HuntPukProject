import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-alert-modal',
  templateUrl: './alert-modal.component.html',
  styleUrls: ['./alert-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  animations: [
    trigger('popIn', [
      transition(':enter', [
        style({ transform: 'scale(0.85) translateY(20px)', opacity: 0 }),
        animate(
          '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ transform: 'scale(1) translateY(0)', opacity: 1 })
        )
      ])
    ])
  ]
})
export class AlertModalComponent implements OnInit {
  @Input() title: string = 'แจ้งเตือน';
  @Input() message: string = '';
  @Input() note: string = '';
  @Input() type: 'success' | 'warning' | 'error' | 'info' = 'info';
  @Input() isMapCentered: boolean = false;

  iconName: string = 'information-circle-outline';
  iconColor: string = '#1976d2';

  constructor(private modalCtrl: ModalController) {
  }

  ngOnInit() {
    switch (this.type) {
      case 'success':
        this.iconName = 'checkmark-circle-outline';
        this.iconColor = '#4caf50';
        break;
      case 'warning':
        this.iconName = 'warning-outline';
        this.iconColor = '#ff9800';
        break;
      case 'error':
        this.iconName = 'alert-circle-outline';
        this.iconColor = '#f44336';
        break;
      default:
        this.iconName = 'information-circle-outline';
        this.iconColor = '#1976d2';
        break;
    }
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
