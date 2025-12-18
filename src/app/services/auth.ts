import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Constants } from '../config/config';
import { UserRegPostReq } from '../model/req/user_reg_post_req';
import { lastValueFrom, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  constructor(
    private endpoint: Constants,
    private http: HttpClient,
    private router: Router
  ) {}

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
      const obj = {
        userData: user, verify
      }
      const res = await lastValueFrom(this.http.post(url, obj));
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }

  public async reqOTP(email: string){
    const url = this.endpoint.API_ENDPOINT + '/auth/SendOTP';
      try {
        console.log(email);
        
        const obj = {
          email: email
        }
        console.log(obj);
        
      const res = await lastValueFrom(this.http.post(url, obj));
      console.log(res);
      
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }


  public async verifyOTP(email: string, otp: string){
    const url = this.endpoint.API_ENDPOINT + '/auth/OTPVerify';
      try {
        const obj = {
          email: email,
          otp: otp
        }
const res = await lastValueFrom(this.http.delete(url, { body: obj }));      
      
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }

public async login(email: string, password: string) {
    const url = this.endpoint.API_ENDPOINT + '/auth/login';

    try {
      const obj = {
        email,
        password
      }
      // ใช้ <any> หรือ Type Response เพื่อให้ TS รู้จัก structure
      const res = await lastValueFrom(this.http.post<any>(url, obj));
      console.log('API Response:', res);
      return res;
      
    } catch (error) {
      // ⚠️ สำคัญมาก: ต้องโยน Error ออกไป ไม่งั้นหน้า Login จะได้ค่า undefined
      console.error('API Error:', error);
      throw error; 
    }
  }

  // ✅ [เพิ่มใหม่ 1] ฟังก์ชันอัปเดตข้อมูลส่วนตัว
  public async updateProfile(userId: number, username: string, phoneNumber: string) {
    const url = this.endpoint.API_ENDPOINT + '/spec/user/' + userId;
    const body = { 
      username: username, 
      phone_number: phoneNumber 
    };
    try {
      // ใช้ PUT เพราะเป็นการแก้ไขข้อมูล
      const res = await lastValueFrom(this.http.put(url, body));
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }

  // ✅ [เพิ่มใหม่ 2] ฟังก์ชันปิดบัญชี (Soft Delete)
  public async deactivateUser(userId: number) {
    // ⚠️ URL ต้องตรงกับ Backend: router.delete('/spec/delAccount/:id', ...)
    const url = this.endpoint.API_ENDPOINT + '/spec/delAccount/' + userId;

    try {
      // ⚠️ เปลี่ยนเป็น delete() ให้ตรงกับ router.delete
      // delete ปกติไม่ต้องส่ง body
      const res = await lastValueFrom(this.http.delete(url)); 
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }

  public async recoverAccount(email: string, verify: boolean) {
    // API Route: /auth/recoverAccount/:email/:verify
    const url = `${this.endpoint.API_ENDPOINT}/auth/recoverAccount`;

    try {
       const obj = {
        email,
        verify
      }
      const res = await lastValueFrom(this.http.post(url, obj));
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }

}

