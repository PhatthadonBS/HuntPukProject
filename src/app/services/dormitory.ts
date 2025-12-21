import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
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

  constructor(private http: HttpClient) { }

  /**
   * 1. ดึงหอพักทั้งหมด
   */
  public async getAllDorms(): Promise<ApiResponse<Dormitory[]>> {
    const url = `${this.apiUrl}/dorms`;
    try {
      const res = await lastValueFrom(this.http.get<ApiResponse<Dormitory[]>>(url));
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
  public async searchDorms(keyword: string, zone?: string, min?: number, max?: number): Promise<ApiResponse<Dormitory[]>> {
    const url = `${this.apiUrl}/dorms`;
    let params = new HttpParams();
    
    // ใส่ Parameter ถ้ามีค่าส่งมา
    if (keyword) params = params.set('search', keyword);
    if (zone) params = params.set('zone', zone);
    if (min) params = params.set('minPrice', min.toString());
    if (max) params = params.set('maxPrice', max.toString());

    try {
      const res = await lastValueFrom(this.http.get<ApiResponse<Dormitory[]>>(url, { params }));
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error || error.message, null, 2));
    }
  }

  /**
   * 4. หาหอพักใกล้ฉัน
   */
  public async getNearbyDorms(lat: number, lng: number, radius: number = 5): Promise<ApiResponse<Dormitory[]>> {
    const url = `${this.apiUrl}/dorms/nearby`;
    let params = new HttpParams()
      .set('lat', lat.toString())
      .set('lng', lng.toString())
      .set('radius', radius.toString());
      
    try {
      const res = await lastValueFrom(this.http.get<ApiResponse<Dormitory[]>>(url, { params }));
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
        body: { user_id: userId, dorm_id: dormId }
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
      return res.map(item => ({
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
}
