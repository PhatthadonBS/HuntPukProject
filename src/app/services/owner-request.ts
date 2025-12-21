import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Constants } from '../config/config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Interface เดิม (คงไว้)
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

// Interface สำหรับข้อมูลที่ Admin ดึงมาโชว์ (จากขั้นตอนก่อนหน้า)
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

  // 1. User ส่งคำขอ (FormData)
  requestToBeOwner(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/dormOwner`, formData);
  }

  // 2. Admin ดึงคำขอทั้งหมด
  getAllRequests(): Observable<OwnerRequest[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/dormOwners`).pipe(
      map(response => {
        return response.map(item => ({
          req_id: item.REQ_ID,
          user_id: item.USER_ID,
          first_name: item.FIRST_NAME || item.USERNAME, 
          last_name: item.LAST_NAME || '',
          phone_number: item.PHONE_NUMBER,
          
          profile_img: item.PROFILE_IMAGE || 'assets/images/default-profile.png',
          status: 'pending',
          
          facebook: item.FACEBOOK,
          line: item.LINE,
          instagram: item.INSTAGRAM,
          x: item.X,
          telegram: item.TELEGRAM
          
          // ❌ ตัดบรรทัด created_at ทิ้งไปเลยครับ
        }));
      })
    );
  }
  
  approveRequest(userId: number, approveStatus: boolean, msg: string = ''): Observable<any> {
    const body = {
      user_id: userId,
      approve_status: approveStatus,
      msg: msg
    };
    return this.http.put(`${this.apiUrl}/user/approve`, body);
  }
}