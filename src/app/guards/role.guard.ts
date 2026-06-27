import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard = (allowedRoles: number[]): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const storedData = localStorage.getItem('loggedIn');
    
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        // รองรับทั้ง { user: {...} } และ { id, username, ... }
        const userObj = parsed.user ? parsed.user : parsed;
        
        if (userObj && userObj.id) {
          // ตรวจสอบสถานะบัญชี (ถ้าโดนระงับ ให้เด้งออก)
          const status = userObj.accout_status ?? userObj.account_status ?? userObj.ACCOUNT_STATUS ?? 0;
          if (status !== 0 && status !== 'active') {
             router.navigate(['/login']);
             return false;
          }

          // ตรวจสอบ Role
          const role = Number(userObj.role_id || userObj.ROLE_TYPE_ID || userObj.role_type_id || 0);
          
          if (allowedRoles.includes(role)) {
            return true;
          }
        }
      } catch (e) {
        console.error('RoleGuard parse error', e);
      }
    }
    
    // ถ้าไม่ได้ล็อกอิน หรือ Role ไม่ตรง ให้เด้งกลับหน้า Login หรือ Home
    if (!storedData) {
       router.navigate(['/login']);
    } else {
       router.navigate(['/home']);
    }
    return false;
  };
};

// =====================================
// สร้าง Guard สำหรับใช้งานง่ายๆ ใน Routes
// =====================================

// ผู้ใช้ทั่วไปที่ล็อกอินแล้ว (Role 1, 2, 3)
export const authGuard: CanActivateFn = roleGuard([1, 2, 3]);

// สำหรับผู้ใช้ทั่วไป (Role 1) หรือ แอดมิน (Role 3) เข้าได้ (เช่น หน้าร้องขอเป็นเจ้าของ)
export const userOrAdminGuard: CanActivateFn = roleGuard([1, 3]);

// เฉพาะเจ้าของหอพัก (Role 2) หรือ แอดมิน (Role 3)
export const ownerGuard: CanActivateFn = roleGuard([2, 3]);

// เฉพาะแอดมินเท่านั้น (Role 3)
export const adminGuard: CanActivateFn = roleGuard([3]);
