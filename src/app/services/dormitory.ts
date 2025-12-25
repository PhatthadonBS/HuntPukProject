import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom, Observable } from 'rxjs';
import { Constants } from '../config/config';

// ============================================
// 1. Interfaces
// ============================================
export interface Dormitory {
  DORM_ID: number;
  DORM_NAME: string;
  ADDRESS: string;
  lat: number;
  lng: number;
  start_price?: number;

  // ✅ ฟิลด์ที่ Backend ส่งมา (Alias)
  image?: string;
  zone?: string;
  SCORE?: number;

  // ✅ ฟิลด์รายละเอียดเพิ่มเติม (สำหรับหน้า Detail/Compare)
  phone?: string;
  line?: string;
  facilities?: string[];
  gallery?: string[];
  description?: string;

  // ✅ โครงสร้างของห้องพัก
  rooms?: {
    ROOM_TYPE_NAME: string;
    PRICE: number;
  }[];

  // ✅ ใช้สำหรับหน้า Compare (Checkbox)
  isChecked?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ============================================
// 2. Service Class
// ============================================
@Injectable({
  providedIn: 'root',
})
export class DormitoryService {
  private appConfig = new Constants();
  private apiUrl = this.appConfig.API_ENDPOINT;

  constructor(private http: HttpClient) {}

  /**
   * 1. ดึงหอพักทั้งหมด
   */
  public async getAllDorms(): Promise<ApiResponse<Dormitory[]>> {
    const url = `${this.apiUrl}/dorms`;
    try {
      const res = await lastValueFrom(
        this.http.get<ApiResponse<Dormitory[]>>(url)
      );
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error || error.message, null, 2));
    }
  }
  /**
   * ✅ ดึงหอพักทั้งหมดสำหรับ Admin (รวมที่ปิดปรับปรุง + ชื่อเจ้าของ)
   * API: GET /dorms/admin
   */
  public async getAllDormsAdmin(): Promise<ApiResponse<any[]>> {
    const url = `${this.apiUrl}/dorms/admin`; // ยิงไป Route ใหม่ที่เราเพิ่งสร้าง
    try {
      const res = await lastValueFrom(this.http.get<ApiResponse<any[]>>(url));
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error || error.message, null, 2));
    }
  }
  /**
   * 2. ดึงรายละเอียดหอพักตาม ID
   */
  public async getDormById(id: number): Promise<ApiResponse<any>> {
    const url = `${this.apiUrl}/dorms/${id}`;
    try {
      const res = await lastValueFrom(this.http.get<ApiResponse<any>>(url));
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error || error.message, null, 2));
    }
  }

  /**
   * 3. ค้นหาและกรองหอพัก (รองรับ Keyword, Zone, Price)
   * ✅ อัปเดต: รับค่า zone, min, max เพิ่ม
   */
  public async searchDorms(
    keyword: string,
    zone?: string,
    min?: number,
    max?: number
  ): Promise<ApiResponse<Dormitory[]>> {
    const url = `${this.apiUrl}/dorms`;
    let params = new HttpParams();

    // ใส่ Parameter ถ้ามีค่าส่งมา
    if (keyword) params = params.set('search', keyword);
    if (zone) params = params.set('zone', zone);
    if (min) params = params.set('minPrice', min.toString());
    if (max) params = params.set('maxPrice', max.toString());

    try {
      const res = await lastValueFrom(
        this.http.get<ApiResponse<Dormitory[]>>(url, { params })
      );
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error || error.message, null, 2));
    }
  }

  /**
   * 4. หาหอพักใกล้ฉัน
   */
  public async getNearbyDorms(
    lat: number,
    lng: number,
    radius: number = 5
  ): Promise<ApiResponse<Dormitory[]>> {
    const url = `${this.apiUrl}/dorms/nearby`;
    let params = new HttpParams()
      .set('lat', lat.toString())
      .set('lng', lng.toString())
      .set('radius', radius.toString());

    try {
      const res = await lastValueFrom(
        this.http.get<ApiResponse<Dormitory[]>>(url, { params })
      );
      return res;
    } catch (error: any) {
      console.warn('API /dorms/nearby might not be implemented yet.');
      throw new Error(JSON.stringify(error.error || error.message, null, 2));
    }
  }

  /**
   * 5. ดึงรายชื่อโซนทั้งหมด (สำหรับ Dropdown ตัวกรอง)
   */
  public async getZones(): Promise<ApiResponse<any[]>> {
    const url = `${this.apiUrl}/dorms/zones`;
    try {
      const res = await lastValueFrom(this.http.get<ApiResponse<any[]>>(url));
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error || error.message, null, 2));
    }
  }

  /**
   * เพิ่มรายการโปรด
   */
  public async addFavorite(userId: number, dormId: number) {
    const url = `${this.apiUrl}/other/addFavorite`; // ⚠️ ตรวจสอบ Path API ของคุณว่าชื่อ route อะไร
    const body = { user_id: userId, dorm_id: dormId };

    try {
      const res = await lastValueFrom(this.http.post<any>(url, body));
      return res;
    } catch (error: any) {
      // ถ้า Error 409 (ซ้ำ) ให้ throw error เฉพาะออกไป หรือจัดการตามเหมาะสม
      throw error;
    }
  }

  /**
   * ลบรายการโปรด
   * หมายเหตุ: HTTP Delete ส่ง body ต้องซับซ้อนหน่อยใน Angular
   */
  public async removeFavorite(userId: number, dormId: number) {
    const url = `${this.apiUrl}/other/delFavorite`; // ✅ Path ตามที่คุณแจ้ง

    try {
      const options = {
        body: { user_id: userId, dorm_id: dormId },
      };

      const res = await lastValueFrom(this.http.delete<any>(url, options));
      return res;
    } catch (error: any) {
      throw error;
    }
  }

  public async getMyFavorites(userId: number): Promise<Dormitory[]> {
    const url = `${this.apiUrl}/spec/favorite/${userId}`; // ✅ ตรงกับ router.get('/spec/favorite/:id')

    try {
      // Backend ส่งมาเป็น Array ตรงๆ (res.json(rows)) ไม่ได้ห่อ data: {}
      const res = await lastValueFrom(this.http.get<any[]>(url));

      // ✅ แปลงชื่อตัวแปรจาก SQL Alias (Backend) -> Interface (Frontend)
      // SQL: DORMID, DORMNAME, COVERIMAGE, ADDRESS
      // Front: DORM_ID, DORM_NAME, image, ADDRESS
      return res.map((item) => ({
        DORM_ID: item.DORMID,
        DORM_NAME: item.DORMNAME,
        ADDRESS: item.ADDRESS,
        image: item.COVERIMAGE, // Map ให้ตรงกัน
        SCORE: item.SCORE,
        // ค่าเหล่านี้ SQL ไม่ได้ส่งมา ใส่ค่า Default ไว้ก่อนกัน Error
        lat: 0,
        lng: 0,
        start_price: item.START_PRICE || 0, // ถ้า SQL ไม่ได้ select ราคามา มันจะเป็น undefined
        zone: '',
      }));
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error || error.message, null, 2));
    }
  }

  /**
   * 6. ดึงรายการคำร้องขอหอพักที่รออนุมัติ (Pending Requests)
   * API: GET /dorms/pendingReq
   */
  public async getPendingRequests(): Promise<ApiResponse<any[]>> {
    const url = `${this.apiUrl}/dorms/pendingReq`;
    try {
      // Backend ส่งกลับมารูปแบบ { data: [...] } ตรงกับ ApiResponse
      const res = await lastValueFrom(this.http.get<ApiResponse<any[]>>(url));
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error || error.message, null, 2));
    }
  }

  /**
   * 7. อนุมัติหรือปฏิเสธคำร้องขอหอพัก
   * API: POST /dorms/approve
   * @param dormId รหัสหอพัก
   * @param isApproved true = อนุมัติ (Accept), false = ปฏิเสธ (Reject)
   * @param message ข้อความเหตุผล (จำเป็นต้องใส่ถ้าปฏิเสธ)
   */
  public async approveRequest(
    dormId: number,
    isApproved: boolean,
    message: string = ''
  ): Promise<any> {
    const url = `${this.apiUrl}/dorms/approve`;

    // จัดเตรียม Body ให้ตรงกับที่ Backend ต้องการ
    // const { dorm_id, approve_status, msg } = req.body;
    const body = {
      dorm_id: dormId,
      approve_status: isApproved, // ส่ง boolean ไปเลย Backend เช็ค true/false เอง
      msg: message,
    };

    try {
      const res = await lastValueFrom(this.http.post<any>(url, body));
      return res;
    } catch (error: any) {
      // โยน Error ออกไปให้หน้าบ้านจัดการ Alert
      throw error;
    }
  }

  /**
   * 8. ลบหอพัก (ปิดปรับปรุง / Soft Delete)
   * API: DELETE /spec/dorm/:id
   */
  public async removeDorm(dormId: number) {
    const url = `${this.apiUrl}/spec/dorm/${dormId}`;
    try {
      const res = await lastValueFrom(this.http.delete<any>(url));
      return res;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * 9. กู้คืนหอพัก (Restore)
   * API: PUT /spec/restoreDorm/:id
   */
  public async restoreDorm(dormId: number) {
    const url = `${this.apiUrl}/spec/restoreDorm/${dormId}`;
    try {
      // PUT method มักจะต้องส่ง body เสมอในบาง config, ถ้าไม่มีให้ส่ง {} ว่างๆ
      const res = await lastValueFrom(this.http.put<any>(url, {}));
      return res;
    } catch (error: any) {
      throw error;
    }
  }

createDorm(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/dorms`, formData);
  }


  /**
   * 10. ดึงรีวิวของหอพัก (ตาม ID หอพัก)
   * API: GET /dorms/review/:id
   */
  public async getReviewsByDormId(dormId: number): Promise<ApiResponse<any[]>> {
    const url = `${this.apiUrl}/dorms/review/${dormId}`;
    try {
      const res = await lastValueFrom(this.http.get<ApiResponse<any[]>>(url));
      return res;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * 11. ลบรีวิว
   * API: DELETE /spec/review/:id
   */
  public async deleteReview(reviewId: number): Promise<any> {
    const url = `${this.apiUrl}/spec/review/${reviewId}`;
    try {
      const res = await lastValueFrom(this.http.delete<any>(url));
      return res;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * 12. เพิ่มรีวิวใหม่
   * API: POST /user/review
   */
  public async addReview(userId: number, dormId: number, score: number, comment: string): Promise<any> {
    const url = `${this.apiUrl}/user/review`;
    const body = { 
      user_id: userId, 
      dorm_id: dormId, 
      score: score, 
      comment: comment 
    };
    
    try {
      const res = await lastValueFrom(this.http.post<any>(url, body));
      return res;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * 13. ดึงหอพักยอดนิยม (Top Ranking)
   * API: GET /dorms/popular?limit=10
   */
  public async getPopularDorms(limit: number = 6): Promise<ApiResponse<any[]>> {
    const url = `${this.apiUrl}/dorms/popular`;
    const params = new HttpParams().set('limit', limit.toString());
    
    try {
      const res = await lastValueFrom(this.http.get<ApiResponse<any[]>>(url, { params }));
      return res;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * 14. ดึงหอพักของฉัน (สำหรับเจ้าของหอ)
   * API: GET /spec/dorm/:id (ส่ง user_id ไป)
   */
  public async getMyDorms(ownerId: number): Promise<ApiResponse<any[]>> {
    const url = `${this.apiUrl}/spec/dorm/${ownerId}`;
    try {
      const res = await lastValueFrom(this.http.get<ApiResponse<any[]>>(url));
      return res;
    } catch (error: any) {
      throw error;
    }
  }
  
  /**
   * 15. อัปเดตข้อมูลหอพัก
   * API: PUT /spec/dorm/:id
   */
  public async updateDorm(dormId: number, formData: FormData): Promise<any> {
    const url = `${this.apiUrl}/spec/dorm/${dormId}`;
    try {
      const res = await lastValueFrom(this.http.put<any>(url, formData));
      return res;
    } catch (error: any) {
      throw error;
    }
  }

}






