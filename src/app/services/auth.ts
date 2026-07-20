import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Constants } from '../config/config';
import { UserRegPostReq } from '../model/req/user_reg_post_req';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  
  // 🌟 ระบบอัจฉริยะ: จำว่า OTP ล่าสุดถูกส่งมาจากหน้า "สมัครสมาชิก" หรือ "กู้คืนบัญชี"
  private lastOtpType: 'register' | 'recover' = 'register';

  constructor(
    private endpoint: Constants,
    private http: HttpClient,
    private router: Router
  ) {}

  // ==========================================
  // 🌟 1. ส่วนของการสมัครสมาชิก (Register)
  // ==========================================
  public async register(user: UserRegPostReq) {
    const url = this.endpoint.API_ENDPOINT + '/user/registerSec1';
    try {
      const res = await lastValueFrom(this.http.post(url, user));
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }

  public async registerSec2(user: UserRegPostReq, verify: boolean) {
    const url = this.endpoint.API_ENDPOINT + '/user/registerSec2';
    try {
      const obj = { userData: user, verify };
      const res = await lastValueFrom(this.http.post(url, obj));
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }

  // ==========================================
  // 🌟 2. ส่วนของการจัดการ OTP 
  // ==========================================
  
  // 👉 ขอ OTP สำหรับ "สมัครสมาชิก"
  public async reqOTP_Register(email: string) {
    this.lastOtpType = 'register'; // ให้ระบบจำไว้ว่ามาจากหน้า Register
    const url = this.endpoint.API_ENDPOINT + '/auth/SendOTP/register';
    try {
      const res = await lastValueFrom(this.http.post(url, { email }));
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }

  // 👉 ขอ OTP สำหรับ "กู้คืนบัญชี / ลืมรหัสผ่าน"
  public async reqOTP_Recover(email: string) {
    this.lastOtpType = 'recover'; // ให้ระบบจำไว้ว่ามาจากหน้า Recover
    const url = this.endpoint.API_ENDPOINT + '/auth/SendOTP/reset';
    try {
      const res = await lastValueFrom(this.http.post(url, { email }));
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }

  public async reqOTP(email: string) {
    // ระบบจะเช็คเองว่าต้องเรียก API ไหนตามที่กดมาล่าสุด
    if (this.lastOtpType === 'register') {
      return this.reqOTP_Register(email);
    } else {
      return this.reqOTP_Recover(email);
    }
  }

  // 👉 ตรวจสอบยืนยัน OTP (Backend เป็น DELETE)
  public async verifyOTP(email: string, otp: string) {
    const url = this.endpoint.API_ENDPOINT + '/auth/OTPVerify';
    try {
      const obj = { email: email, otp: otp };
      // ⚠️ การส่ง Body คู่กับ DELETE ใน Angular ต้องส่งผ่าน Property body
      const res = await lastValueFrom(this.http.delete(url, { body: obj }));      
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }

  // ==========================================
  // 🌟 3. ส่วนเข้าสู่ระบบและการกู้คืน (Auth & Recover)
  // ==========================================
  public async login(email: string, password: string) {
    const url = this.endpoint.API_ENDPOINT + '/auth/login';
    try {
      const obj = { email, password };
      const res = await lastValueFrom(this.http.post<any>(url, obj));
      return res;
    } catch (error) {
      console.error('API Error:', error);
      throw error; 
    }
  }

  public async recoverAccount(email: string, verify: boolean) {
    const url = `${this.endpoint.API_ENDPOINT}/auth/recoverAccount`;
    try {
      const obj = { email, verify };
      const res = await lastValueFrom(this.http.post(url, obj));
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }

  public async resetPassword(email: string, newPass: string, verify: boolean) {
    const url = this.endpoint.API_ENDPOINT + '/user/resetPassword';
    try {
      const body = { email: email, password: newPass, verify: verify };
      const res = await lastValueFrom(this.http.put(url, body)); 
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }

  // ==========================================
  // 🌟 4. ส่วนแก้ไขโปรไฟล์และลบบัญชี
  // ==========================================
  public async updateProfile(userId: number, username: string, phoneNumber: string, ownerData?: {
    first_name?: string; last_name?: string;
    facebook?: string; line?: string; instagram?: string; x?: string; telegram?: string;
  }, file?: File) {
    const url = this.endpoint.API_ENDPOINT + '/spec/user/' + userId;
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('phone_number', phoneNumber);

      if (ownerData) {
        if (ownerData.first_name !== undefined) formData.append('first_name', ownerData.first_name);
        if (ownerData.last_name !== undefined) formData.append('last_name', ownerData.last_name);
        if (ownerData.facebook !== undefined) formData.append('facebook', ownerData.facebook);
        if (ownerData.line !== undefined) formData.append('line', ownerData.line);
        if (ownerData.instagram !== undefined) formData.append('instagram', ownerData.instagram);
        if (ownerData.x !== undefined) formData.append('x', ownerData.x);
        if (ownerData.telegram !== undefined) formData.append('telegram', ownerData.telegram);
      }

      if (file) {
        formData.append('file', file);
      }

      const res = await lastValueFrom(this.http.put(url, formData));
      return res;
    } catch (error: any) {
      throw error;
    }
  }

  public async deactivateUser(userId: number) {
    const url = this.endpoint.API_ENDPOINT + '/spec/delAccount/' + userId;
    try {
      const res = await lastValueFrom(this.http.delete(url)); 
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }
}