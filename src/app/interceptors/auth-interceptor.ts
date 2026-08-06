import { HttpInterceptorFn } from '@angular/common/http';
import { SESSION_STORAGE_KEY, SESSION_TYPE_KEY } from '../pages/login/login.page';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  let token = '';

  try {
    const storedData = localStorage.getItem(SESSION_STORAGE_KEY);
    if (storedData) token = JSON.parse(storedData)?.token || '';
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