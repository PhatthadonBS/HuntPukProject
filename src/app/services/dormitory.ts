import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom } from 'rxjs'; // สำคัญ: ใช้แปลง Observable เป็น Promise
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
  FRONT_DORM_IMAGE?: string;
  ZONE_NAME?: string;
  SCORE?: number;
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

  // ✅ ขั้นตอนที่ 1: สร้าง Instance ของ Constants ขึ้นมา
  private appConfig = new Constants(); 

  // ✅ ขั้นตอนที่ 2: ดึงค่า API_ENDPOINT มาจากตัวแปร appConfig
  private apiUrl = this.appConfig.API_ENDPOINT; 

  constructor(private http: HttpClient) { }

  /**
   * 1. ดึงหอพักทั้งหมด
   */
  public async getAllDorms(): Promise<ApiResponse<Dormitory[]>> {
    const url = `${this.apiUrl}/dorms`;
    try {
      // ใช้ lastValueFrom เพื่อรอผลลัพธ์ (await)
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
   * 3. ค้นหาหอพักด้วยชื่อ
   */
  public async searchDorms(keyword: string): Promise<ApiResponse<Dormitory[]>> {
    const url = `${this.apiUrl}/dorms`;
    let params = new HttpParams();
    if (keyword) {
      params = params.set('q', keyword);
    }

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
      throw new Error(JSON.stringify(error.error || error.message, null, 2));
    }
  }
}