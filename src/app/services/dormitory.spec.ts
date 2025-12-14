import { TestBed } from '@angular/core/testing';

// 1. เปลี่ยน Import ให้เรียก Service (ตัว Class) มาแทน
// (เช็คชื่อไฟล์ด้วยว่า service คุณชื่อไฟล์ dormitory.service.ts หรือเปล่า)
import { DormitoryService } from '../services/dormitory'; 

describe('DormitoryService', () => { // 2. เปลี่ยนชื่อ Test Suite
  let service: DormitoryService;     // 3. เปลี่ยน Type ของตัวแปร

  beforeEach(() => {
    TestBed.configureTestingModule({});
    
    // 4. ต้อง Inject ตัว Class (DormitoryService) ไม่ใช่ Interface
    service = TestBed.inject(DormitoryService); 
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});