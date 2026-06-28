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
  person, home, images, documentText, bed, checkmarkCircleOutline,
  water, flash
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

  // ✅ Lightbox สำหรับขยายดูรูปหน้าหอ/ใบอนุญาต/แกลเลอรี
  isLightboxOpen: boolean = false;
  lightboxImage: string = '';

  constructor(private modalCtrl: ModalController) { 
    // ✅ ลงทะเบียน Icons ให้ครบ
    addIcons({ 
      close, checkmarkCircle, closeCircle, location, call, mail, 
      person, home, images, documentText, bed, checkmarkCircleOutline,
      water, flash
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

  // ✅ เปิด Lightbox ขยายรูป — ใช้ดูรูปหน้าหอ/ใบอนุญาต/แกลเลอรีได้ทุกจุด
  viewImage(src: string) {
    if (!src) return;
    this.lightboxImage = src;
    this.isLightboxOpen = true;
  }

  closeLightbox() {
    this.isLightboxOpen = false;
  }
}