import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonButton, IonIcon, IonSegment, IonSegmentButton, IonLabel 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline, locationOutline, wifi, bedOutline,
  checkmarkCircleOutline, listOutline, timeOutline, homeOutline,
  waterOutline, flashOutline, cubeOutline, snowOutline, shirtOutline,
  carOutline, pawOutline, barbellOutline, restaurantOutline,
  shieldCheckmarkOutline, arrowForwardOutline, eyeOutline, documentTextOutline,
  starOutline, addCircleOutline, imageOutline, imagesOutline, alertCircleOutline, water, flash, mapOutline, peopleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-dorm-preview-modal',
  templateUrl: './dorm-preview-modal.component.html',
  styleUrls: ['./dorm-preview-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonButton, IonIcon, IonSegment, IonSegmentButton, IonLabel]
})
export class DormPreviewModalComponent implements OnInit {
  @Input() formData: any;
  @Input() coverImage: string | null = null;
  @Input() allImages: any;
  @Input() facilities: any[] = [];
  @Input() roomTypes: any[] = [];
  @Input() bedTypes: any[] = [];
  @Input() zones: any[] = [];

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  activeSegment: string = 'general';
  zoneName: string = '';

  constructor() {
    addIcons({
      closeOutline, locationOutline, wifi, bedOutline,
      checkmarkCircleOutline, listOutline, timeOutline, homeOutline,
      waterOutline, flashOutline, cubeOutline, snowOutline, shirtOutline,
      carOutline, pawOutline, barbellOutline, restaurantOutline,
      shieldCheckmarkOutline, arrowForwardOutline, eyeOutline, documentTextOutline,
      starOutline, addCircleOutline, imageOutline, imagesOutline, alertCircleOutline, water, flash, mapOutline, peopleOutline
    });
  }

  ngOnInit() {
    if (this.formData?.zone_id && this.zones?.length > 0) {
      const z = this.zones.find((x: any) => x.ZONE_ID == this.formData.zone_id);
      this.zoneName = z ? z.ZONE_NAME : 'ไม่พบข้อมูลโซน';
    }
  }

  get checkedFacilities(): any[] {
    return this.facilities ? this.facilities.filter((f: any) => f.checked) : [];
  }

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }

  getBedTypeName(bedTypeId: any): string {
    if (!this.bedTypes || this.bedTypes.length === 0) return 'ไม่ระบุ';
    const bed = this.bedTypes.find(b => (b.id || b.BED_TYPE_ID)?.toString() === bedTypeId?.toString());
    return bed ? (bed.name || bed.BED_TYPE_NAME) : 'ไม่ระบุ';
  }
}
