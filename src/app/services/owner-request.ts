import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Constants } from '../config/config'; // หรือ path ที่คุณเก็บ config
import { Observable } from 'rxjs';

// Interface ตรงตาม Database DORM_OWNERS
export interface UserDormOwnerReqPostReq {
  user_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  facebook: string | null;
  line: string | null;
  // ✅ เพิ่มให้ครบ
  instagram: string | null;
  x: string | null;
  telegram: string | null;
}
@Injectable({
  providedIn: 'root'
})
export class OwnerRequestService {
  
  // สมมติว่าเก็บ URL ไว้ที่นี่
  private appConfig = new Constants();
  private apiUrl = this.appConfig.API_ENDPOINT;

  constructor(private http: HttpClient) { }

  // ฟังก์ชันส่งคำขอ
  requestToBeOwner(data: UserDormOwnerReqPostReq): Observable<any> {
    // ยิงไปที่ endpoint ที่เตรียมไว้ (ต้องสร้าง API รับ POST ใน backend ด้วย)
    return this.http.post(`${this.apiUrl}/user/request-owner`, data);
  }
}