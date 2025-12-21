import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Constants } from '../config/config'; // หรือ path config ของคุณ

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private appConfig = new Constants();
  private apiUrl = this.appConfig.API_ENDPOINT; // เช่น http://192.168.x.x:3000

  constructor(private http: HttpClient) { }

  /**
   * ดึงข้อมูลผู้ใช้ตาม ID
   * Method: GET
   * Path: /spec/user/:id
   */
  async getUserProfile(userId: number): Promise<any> {
    const url = `${this.apiUrl}/spec/user/${userId}`;
    
    try {
      const res = await lastValueFrom(this.http.get<any[]>(url));

      if (res && res.length > 0) {
        const u = res[0]; // ข้อมูลดิบจาก Backend (ตัวพิมพ์ใหญ่)

        // ✅✅✅ แก้ตรงนี้: Map ตัวใหญ่ -> เป็นตัวเล็ก ✅✅✅
        return {
          id: u.USER_ID,              // Map USER_ID -> id
          username: u.USERNAME,       // Map USERNAME -> username
          email: u.EMAIL,             // Map EMAIL -> email
          phone: u.PHONE_NUMBER,      // Map PHONE_NUMBER -> phone
          role_id: u.ROLE_TYPE_ID,
          status: u.ACCOUNT_STATUS    // Map ACCOUNT_STATUS -> status
        };
      }
      return null;

    } catch (error) {
      throw error;
    }
  }
}