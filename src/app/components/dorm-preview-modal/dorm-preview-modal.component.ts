import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline, locationOutline, wifi, bedOutline,
  checkmarkCircleOutline, listOutline, timeOutline, homeOutline,
  waterOutline, flashOutline, cubeOutline, snowOutline, shirtOutline,
  carOutline, pawOutline, barbellOutline, restaurantOutline,
  shieldCheckmarkOutline, arrowForwardOutline
} from 'ionicons/icons';

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
    addIcons({
      closeOutline, locationOutline, wifi, bedOutline,
      checkmarkCircleOutline, listOutline, timeOutline, homeOutline,
      waterOutline, flashOutline, cubeOutline, snowOutline, shirtOutline,
      carOutline, pawOutline, barbellOutline, restaurantOutline,
      shieldCheckmarkOutline, arrowForwardOutline
    });
  }

  get checkedFacilities(): any[] {
    return this.facilities.filter((f: any) => f.checked);
  }

  /**
   * Returns the minimum monthly price across all room types.
   * Falls back to lowest price across any type if no monthly found.
   */
  get minMonthlyPrice(): number {
    let monthlyMin = Infinity;
    let fallbackMin = Infinity;

    this.roomTypes.forEach(rt => {
      rt.prices?.forEach((p: any) => {
        const val = Number(p.price);
        if (p.price != null && val > 0) {
          // Check if this is a monthly price type
          const nameLC = (p.name || '').toLowerCase();
          if (nameLC.includes('เดือน') || nameLC.includes('month')) {
            if (val < monthlyMin) monthlyMin = val;
          }
          if (val < fallbackMin) fallbackMin = val;
        }
      });
    });

    const result = monthlyMin !== Infinity ? monthlyMin : fallbackMin;
    return result !== Infinity ? result : 0;
  }

  /** Resolve icon name for display — handles ionicon names and fa- classes */
  resolveIconName(fac: any): string {
    if (!fac.icon) return 'home-outline';
    if (fac.isFontAwesome) return ''; // handled via <i> tag
    // if it looks like an ionicon name (has a dash)
    return fac.icon;
  }

  onConfirm() { this.confirmed.emit(); }
  onCancel() { this.cancelled.emit(); }
}
