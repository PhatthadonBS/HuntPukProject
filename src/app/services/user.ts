import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Constants } from '../config/config';

// ✅ Interface สำหรับข้อมูลสมัครสมาชิก
export interface UserRegPostReq {
  username?: string;
  password?: string;
  email?: string;
  phone_number?: string;
  role_type_id?: number; 
  // เพิ่ม field อื่นๆ ตามต้องการ เช่น first_name, last_name
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private appConfig = new Constants();
  private apiUrl = this.appConfig.API_ENDPOINT;

  constructor(private http: HttpClient) { }

  // 1. ดึงข้อมูลผู้ใช้ทั้งหมด (API เดิม)
  async getAllUsers(): Promise<any[]> {
    const url = `${this.apiUrl}/user/users`;
    try {
      const res = await lastValueFrom(this.http.get<any[]>(url));
      // Map ข้อมูลให้เป็น Format เล็ก
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

  // 2. ค้นหาผู้ใช้ตาม ID (API เดิม)
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
      console.warn('User not found or error:', error);
      return null;
    }
  }

  // 3. แบนบัญชีผู้ใช้ (API เดิม)
  async banUser(userId: number): Promise<boolean> {
    const url = `${this.apiUrl}/spec/banAccount/${userId}`;
    try {
      await lastValueFrom(this.http.put(url, {}));
      return true;
    } catch (error) {
      console.error('Ban User Error:', error);
      return false;
    }
  }

  // 4. Register Sec 1 (ตรวจสอบข้อมูลเบื้องต้น) ✅ ของใหม่
  public async register(user: UserRegPostReq) {
    const url = `${this.apiUrl}/user/registerSec1`;
    try {
      const res = await lastValueFrom(this.http.post(url, user));
      return res;
    } catch (error: any) {
      // โยน Error ออกไปให้หน้าบ้านจัดการ
      throw error; 
    }
  }

  // 5. Register Sec 2 (ยืนยันการสมัคร + รับค่า verify) ✅ ของใหม่
  public async registerSec2(user: UserRegPostReq, verify: boolean) {
    const url = `${this.apiUrl}/user/registerSec2`;
    try {
      const obj = { userData: user, verify };
      const res = await lastValueFrom(this.http.post(url, obj));
      return res;
    } catch (error: any) {
      throw error;
    }
  }
}