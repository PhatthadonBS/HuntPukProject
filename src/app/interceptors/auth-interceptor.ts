import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. ดึงข้อมูลผู้ใช้จาก localStorage
  const storedData = localStorage.getItem('loggedIn');
  let token = '';

  if (storedData) {
    try {
      const userObj = JSON.parse(storedData);
      // ⚠️ ตรงนี้เช็คให้ชัวร์นะครับว่าตอน Login สำเร็จ คุณเก็บ Token ไว้ในชื่อ userObj.token หรือชื่ออื่น
      token = userObj.token; 
    } catch (e) {
      console.error('Error parsing token from localStorage', e);
    }
  }

  // 2. ถ้ามี Token ให้โคลน Request แล้วแนบ Header
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  // 3. ถ้าไม่มี Token ก็ปล่อยผ่านไปแบบปกติ
  return next(req);
};