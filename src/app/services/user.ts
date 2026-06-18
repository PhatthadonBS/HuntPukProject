import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

// 2. ค้นหาผู้ใช้ตาม ID (พร้อมแนบ Token แก้บั๊ก 401/403)
  async getUserProfile(userId: number): Promise<any> {
    const url = `${this.apiUrl}/spec/user/${userId}`;
    try {
      // 🌟 1. ไปงัดเอา Token ออกมาจาก LocalStorage
      const stored = localStorage.getItem('loggedIn');
      let token = '';
      if (stored) {
         const parsed = JSON.parse(stored);
         token = parsed.token || ''; // ดึงกุญแจ token ออกมา
      }

      // 🌟 2. เอา Token มาใส่เป็น Header (บัตรผ่านทาง)
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}` 
      });

      // 🌟 3. แนบ { headers } ส่งไปด้วยตอน get 
      const res = await lastValueFrom(this.http.get<any>(url, { headers }));
      
      if (res && (res.USER_ID || res.USERNAME || res.id || res.username)) {
        return res; // Return the full object so we don't lose FIRST_NAME, PROFILE_IMAGE, etc.
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

  // 5.1 Register Sec 2 สำหรับ Admin (ส่ง admin: true เพื่อ bypass OTP)
  public async registerSec2Admin(userData: any) {
    const url = `${this.apiUrl}/user/registerSec2`;
    try {
      const obj = { userData: userData, verify: false, admin: true };
      const res = await lastValueFrom(this.http.post(url, obj));
      return res;
    } catch (error: any) {
      throw error;
    }
  }
  /**
   * ✅ ดึงข้อมูล User ที่ Login อยู่ (ID และ Role)
   * ดึงจาก localStorage key: "loggedIn" (ตามหน้า Login ของคุณ)
   */
  public getCurrentUser(): any {
    const userStr = localStorage.getItem('loggedIn');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null; // ยังไม่ล็อกอิน
  }

  // ✅ 1. เพิ่มฟังก์ชันนี้เข้าไป เพื่อดึง ID จาก LocalStorage
  public getMyUserId(): number {
    const userStr = localStorage.getItem('loggedIn'); // ชื่อ key ตามที่ใช้ใน LoginPage
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // เช็คว่าใน object ที่เก็บไว้ใช้ชื่อ field ว่า id หรือ USER_ID
        return user.id || user.USER_ID || 0; 
      } catch (e) {
        return 0;
      }
    }
    return 0; // ถ้าไม่เจอ หรือยังไม่ล็อกอิน ให้คืนค่า 0
  }
}