import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Constants } from '../config/config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface UserDormOwnerReqPostReq {
  user_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  facebook: string;
  line: string;
  instagram: string;
  x: string;
  telegram: string;
}


export interface OwnerRequest {
  req_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  profile_img: string;
  status: string;
  facebook?: string;
  line?: string;
  instagram?: string;
  x?: string;
  telegram?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OwnerRequestService {
  
  private appConfig = new Constants();
  private apiUrl = this.appConfig.API_ENDPOINT;

  constructor(private http: HttpClient) { }

  // 1. User ส่งคำขอ
  requestToBeOwner(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/dormOwner`, formData);
  }

  // 2. Admin ดึงคำขอทั้งหมด
  getAllRequests(): Observable<OwnerRequest[]> {
    return this.http.get<any>(`${this.apiUrl}/user/dormOwnerReq`).pipe(
      map(res => {
        // ✅ เพิ่ม Log ตรงนี้เพื่อดูว่า Backend ส่งอะไรมาบ้าง (กด F12 ดูใน Console)
        console.log('API Response:', res); 

        if (res.success && Array.isArray(res.data)) {
          return res.data.map((item: any) => ({
            
            req_id: item.DORM_OWNER_ID || item.dorm_owner_id, // กันเหนียวทั้งตัวเล็กตัวใหญ่
            user_id: item.USER_ID || item.user_id,
            first_name: item.FIRST_NAME || item.first_name || item.USERNAME || item.username, 
            last_name: item.LAST_NAME || item.last_name || '',
            phone_number: item.PHONE_NUMBER || item.phone_number,
            
            // ใช้รูปจาก DB หรือ Placeholder
            profile_img: item.PROFILE_IMAGE || item.profile_image || 'https://placehold.co/150x150?text=User',
            
            status: 'pending',
            
            // ✅ Map แบบรองรับทั้งตัวพิมพ์ใหญ่และเล็ก
            facebook: item.FACEBOOK || item.facebook,
            line: item.LINE || item.line,
            instagram: item.INSTAGRAM || item.instagram, 
            x: item.X || item.x,
            telegram: item.TELEGRAM || item.telegram

          }));
        }
        return [];
      })
    );
  }
  
  // 3. อนุมัติ/ปฏิเสธ คำขอ
  approveRequest(userId: number, approveStatus: boolean, msg: string = ''): Observable<any> {
    const body = {
      user_id: userId,
      approve_status: approveStatus,
      msg: msg
    };
    return this.http.put(`${this.apiUrl}/user/approve`, body);
  }
}