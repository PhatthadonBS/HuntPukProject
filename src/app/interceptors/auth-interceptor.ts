import { HttpInterceptorFn } from '@angular/common/http';
import { SESSION_STORAGE_KEY, SESSION_TYPE_KEY } from '../pages/login/login.page';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  let token = '';

  try {
    const sessionType = localStorage.getItem(SESSION_TYPE_KEY);

    if (sessionType === 'session') {
      // ❌ ไม่ได้ tick remember → อ่านจาก sessionStorage (หายเมื่อปิดแท็บ)
      const storedData = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (storedData) token = JSON.parse(storedData)?.token || '';
    } else {
      // ✅ tick remember → อ่านจาก localStorage (ค้างข้ามแท็บ)
      const storedData = localStorage.getItem(SESSION_STORAGE_KEY);
      if (storedData) token = JSON.parse(storedData)?.token || '';
    }
  } catch (e) {
    console.error('Error parsing token from storage', e);
  }

  if (token) {
    const clonedReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(clonedReq);
  }

  return next(req);
};