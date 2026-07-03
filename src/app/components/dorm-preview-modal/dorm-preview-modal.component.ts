import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, locationOutline, wifi, bedOutline, checkmarkCircleOutline, listOutline, timeOutline, homeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-dorm-preview-modal',
  templateUrl: './dorm-preview-modal.component.html',
  styleUrls: ['./dorm-preview-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon]
})
export class DormPreviewModalComponent {
  @Input() formData: any;
  @Input() coverImage: string | null = null;
  @Input() facilities: any[] = [];
  @Input() roomTypes: any[] = [];
  
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  constructor() {
    addIcons({ closeOutline, locationOutline, wifi, bedOutline, checkmarkCircleOutline, listOutline, timeOutline, homeOutline });
  }

  get checkedFacilities(): any[] {
    return this.facilities.filter((f: any) => f.checked);
  }

  get minPrice(): number {
    let min = Infinity;
    this.roomTypes.forEach(rt => {
      rt.prices.forEach((p: any) => {
        if (p.price != null && Number(p.price) > 0) {
          if (Number(p.price) < min) min = Number(p.price);
        }
      });
    });
    return min === Infinity ? 0 : min;
  }

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}
