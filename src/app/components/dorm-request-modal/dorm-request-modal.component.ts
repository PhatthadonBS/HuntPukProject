import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonButton, IonIcon, IonImg, IonGrid, IonRow, IonCol, ModalController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
// ✅ Import Icons ให้ครบตามที่ใช้ใน HTML
import { 
  close, checkmarkCircle, closeCircle, location, call, mail, 
  person, home, images, documentText, bed, checkmarkCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-dorm-request-modal',
  standalone: true,
  imports: [
    CommonModule, 
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonButton, IonIcon, IonImg, IonGrid, IonRow, IonCol
  ],
  templateUrl: './dorm-request-modal.component.html',
  styleUrls: ['./dorm-request-modal.component.scss']
})
export class DormRequestModalComponent implements OnInit {

  @Input() dorm: any;

  constructor(private modalCtrl: ModalController) { 
    // ✅ ลงทะเบียน Icons ให้ครบ
    addIcons({ 
      close, checkmarkCircle, closeCircle, location, call, mail, 
      person, home, images, documentText, bed, checkmarkCircleOutline
    });
  }

  ngOnInit() {}

  closeModal() {
    this.modalCtrl.dismiss();
  }

  action(isApprove: boolean) {
    this.modalCtrl.dismiss({
      action: isApprove ? 'approve' : 'reject'
    });
  }

  viewImage(src: string) {
    // Logic ขยายรูปภาพ (ถ้ามี)
    console.log('View Image:', src);
  }
}