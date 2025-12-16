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
}