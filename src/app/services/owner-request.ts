import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Constants } from '../config/config';
import { Observable } from 'rxjs';

// Interface สำหรับเก็บข้อมูลในฟอร์ม (TS)
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

@Injectable({
  providedIn: 'root'
})
export class OwnerRequestService {
  
  private appConfig = new Constants();
  private apiUrl = this.appConfig.API_ENDPOINT;

  constructor(private http: HttpClient) { }

  // ✅ แก้ไข: รับ FormData แทน Object ธรรมดา
  requestToBeOwner(formData: FormData): Observable<any> {
    // ✅ แก้ไข: URL ให้ตรงกับ Backend (router.post('/user/dormOwner', ...))
    return this.http.post(`${this.apiUrl}/user/dormOwner`, formData);
  }
}