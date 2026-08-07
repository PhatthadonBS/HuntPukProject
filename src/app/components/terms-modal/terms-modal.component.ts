import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-terms-modal',
  templateUrl: './terms-modal.component.html',
  styleUrls: ['./terms-modal.component.scss'],
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
export class TermsModalComponent implements OnInit {
  isAccepted: boolean = false;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {}

  toggleAccept() {
    this.isAccepted = !this.isAccepted;
  }

  dismiss(accepted: boolean) {
    this.modalCtrl.dismiss({ accepted });
  }
}
