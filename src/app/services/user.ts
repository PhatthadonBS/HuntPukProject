import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Constants } from '../config/config';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private appConfig = new Constants();
  private apiUrl = this.appConfig.API_ENDPOINT;

  constructor(private http: HttpClient) { }

  // 1. ดึงข้อมูลผู้ใช้ทั้งหมด (API: /user/users)
  async getAllUsers(): Promise<any[]> {
    const url = `${this.apiUrl}/user/users`;
    try {
      const res = await lastValueFrom(this.http.get<any[]>(url));
      // Map ข้อมูลให้เป็น Format เดียวกัน
      return res.map((u: any) => ({
        id: u.USER_ID,
        username: u.USERNAME,
        email: u.EMAIL,
        phone: u.PHONE_NUMBER,
        role_id: u.ROLE_TYPE_ID,
        status: u.ACCOUNT_STATUS
      }));
    } catch (error) {
      console.error('Get All Users Error:', error);
      return [];
    }
  }

  // 2. ค้นหาผู้ใช้ตาม ID (API: /spec/user/:id)
  async getUserProfile(userId: number): Promise<any> {
    const url = `${this.apiUrl}/spec/user/${userId}`;
    try {
      const res = await lastValueFrom(this.http.get<any[]>(url));
      if (res && res.length > 0) {
        const u = res[0];
        return {
          id: u.USER_ID,
          username: u.USERNAME,
          email: u.EMAIL,
          phone: u.PHONE_NUMBER,
          role_id: u.ROLE_TYPE_ID,
          status: u.ACCOUNT_STATUS
        };
      }
      return null;
    } catch (error) {
      // กรณีไม่เจอ user หรือ error อื่นๆ
      console.warn('User not found or error:', error);
      return null;
    }
  }

  // 3. แบนบัญชีผู้ใช้ (API: /spec/banAccount/:id)
  async banUser(userId: number): Promise<boolean> {
    const url = `${this.apiUrl}/spec/banAccount/${userId}`;
    try {
      // Method PUT ตาม Backend
      await lastValueFrom(this.http.put(url, {}));
      return true;
    } catch (error) {
      console.error('Ban User Error:', error);
      return false;
    }
  }
}