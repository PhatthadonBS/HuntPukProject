import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// ============================================
// 1. ส่วน Interface (Model): กำหนดหน้าตาข้อมูล
// ============================================
// ประกาศ Type ให้ตรงกับ Database เพื่อให้เรียกใช้ตัวแปรง่ายๆ
export interface DormitoryData {
  DORM_ID: number;
  DORM_NAME: string;
  ADDRESS: string;
  lat: number;        // รับจาก API (ที่แปลง ST_X มาแล้ว)
  lng: number;        // รับจาก API (ที่แปลง ST_Y มาแล้ว)
  start_price?: number;
  FRONT_DORM_IMAGE?: string;
  ZONE_NAME?: string;
  SCORE?: number;
}

// Interface สำหรับการตอบกลับจาก API (Response)
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ============================================
// 2. ส่วน Service: ฟังก์ชันเรียก API
// ============================================
@Injectable({
  providedIn: 'root',
})
export class DormitoryService { // <-- แนะนำให้เปลี่ยนชื่อ Class เป็น Service ให้ชัดเจน

  // URL ของ API Backend
  // กรณีทดสอบบน Android Emulator ใช้ 'http://10.0.2.2:3000/api'
  // กรณีทดสอบบน iOS หรือ Browser ใช้ 'http://localhost:3000/api'
  private apiUrl = 'http://192.168.116.1:3000'; 

  constructor(private http: HttpClient) { }

  /**
   * 1. ดึงหอพักทั้งหมด
   * @returns Observable ของรายการหอพัก
   */
  getAllDorms(): Observable<ApiResponse<DormitoryData[]>> {
    return this.http.get<ApiResponse<DormitoryData[]>>(`${this.apiUrl}/dorms`);
  }

  /**
   * 2. ดึงรายละเอียดหอพักตาม ID (เจาะลึก)
   * @param id รหัสหอพัก
   */
  getDormById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/dorms/${id}`);
  }

  /**
   * 3. ค้นหาหอพักด้วยชื่อ
   * @param keyword คำค้นหา
   */
  searchDorms(keyword: string): Observable<ApiResponse<DormitoryData[]>> {
    let params = new HttpParams();
    if (keyword) {
      params = params.set('q', keyword);
    }
    // หมายเหตุ: ต้องไปเขียน Backend รองรับ query parameter 'q' เพิ่มเติม
    return this.http.get<ApiResponse<DormitoryData[]>>(`${this.apiUrl}/dorms`, { params });
  }

  /**
   * 4. หาหอพักใกล้ฉัน (Optional)
   * @param lat ละติจูดปัจจุบัน
   * @param lng ลองจิจูดปัจจุบัน
   * @param radius ระยะทาง (km)
   */
  getNearbyDorms(lat: number, lng: number, radius: number = 5): Observable<ApiResponse<DormitoryData[]>> {
    let params = new HttpParams()
      .set('lat', lat.toString())
      .set('lng', lng.toString())
      .set('radius', radius.toString());
      
    return this.http.get<ApiResponse<DormitoryData[]>>(`${this.apiUrl}/dorms/nearby`, { params });
  }
}