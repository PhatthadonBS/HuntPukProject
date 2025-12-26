import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { GoogleMapsModule } from '@angular/google-maps';
import { Router, RouterModule } from '@angular/router';
import { DormitoryService } from '../../../services/dormitory';
import { environment } from '../../../../environments/environment';
import { Observable, Subscription } from 'rxjs';
import { DormFacGetRes } from '../../../model/res/dorm_fac_get_res';

@Component({
  selector: 'app-dorm-form',
  templateUrl: './dorm-form.page.html',
  styleUrls: ['./dorm-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GoogleMapsModule,
    HttpClientModule,
    RouterModule,
  ],
})
export class DormFormPage implements OnInit {
  api = environment.GGMAPI;
  facilities$ = this.dormService.getFacilities();
  userLogin = {
    id: 2,
    name: 'asdjsa',
    role: 1,
  };

  dormForm: FormGroup;

  selectedFiles: { [key: string]: File | File[] } = {};

  center: google.maps.LatLngLiteral = { lat: 16.2455, lng: 103.25 };
  zoom = 15;
  markerPosition: google.maps.LatLngLiteral | null = null;

  constructor(
    private fb: FormBuilder,
    private dormService: DormitoryService,
    private router: Router
  ) {
    this.dormForm = this.fb.group({
      owner_id: [this.userLogin.id, Validators.required],
      name: ['', Validators.required],
      address: ['', Validators.required],
      lat: [null, Validators.required],
      lng: [null, Validators.required],
      zone_id: [1, Validators.required],
      type_id: [1, Validators.required],
      water_unit: [0, Validators.required],
      elect_unit: [0, Validators.required],
      water_lump: [0],
      detail: [''],
      roomTypes: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.addRoomType();
  }


  get roomTypes(): FormArray {
    return this.dormForm.get('roomTypes') as FormArray;
  }

  addRoomType() {
    const roomGroup = this.fb.group({
      roomType: ['', Validators.required],
      bedType: ['Single', Validators.required],
      perMonth: [0],
      perTerm: [0],
    });
    this.roomTypes.push(roomGroup);
  }

  removeRoomType(index: number) {
    this.roomTypes.removeAt(index);
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.markerPosition = event.latLng.toJSON();
      this.dormForm.patchValue({
        lat: this.markerPosition.lat,
        lng: this.markerPosition.lng,
        address: `พิกัด: ${this.markerPosition.lat.toFixed(
          5
        )}, ${this.markerPosition.lng.toFixed(5)}`,
      });
    }
  }

  onFileSelect(event: any, fieldName: string, isMultiple: boolean = false) {
    if (event.target.files.length > 0) {
      if (isMultiple) {
        this.selectedFiles[fieldName] = Array.from(event.target.files);
      } else {
        this.selectedFiles[fieldName] = event.target.files[0];
      }
    }
  }

  onSubmit() {
    if (this.dormForm.invalid) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      this.dormForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    const formValue = this.dormForm.value;

    Object.keys(formValue).forEach((key) => {
      if (key !== 'roomTypes') formData.append(key, formValue[key]);
    });

    formData.append('roomTypes', JSON.stringify(formValue.roomTypes));

    const singleFileFields = [
      'FRONT_DORM_IMG',
      'LICENSE_IMG',
      'CEILING_IMG',
      'WALL_IMG',
      'FLOOR_IMG',
      'BED_IMG',
      'BATHROOM_IMG',
      'BALCONY_IMG',
    ];
    singleFileFields.forEach((field) => {
      if (this.selectedFiles[field])
        formData.append(field, this.selectedFiles[field] as File);
    });

    if (this.selectedFiles['OTHER_IMG']) {
      (this.selectedFiles['OTHER_IMG'] as File[]).forEach((file) =>
        formData.append('OTHER_IMG', file)
      );
    }
    console.log(formData);

    // this.dormService.createDorm(formData).subscribe({
    //   next: (res) => {
    //     alert('บันทึกสำเร็จ!');
    //     this.router.navigate(['/owner/my-dorms']);
    //   },
    //   error: (err) => alert('Error: ' + err.message)
    // });
  }

}
