import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
// ✅ 1. นำเข้า withInterceptors เพิ่มจาก @angular/common/http
import { provideHttpClient, withInterceptors } from '@angular/common/http'; 

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
// ✅ 2. นำเข้าไฟล์ Interceptor ที่เราเพิ่งสร้าง (เช็ค path ให้ตรงกับที่ไฟล์คุณอยู่นะครับ)
import { authInterceptor } from './app/interceptors/auth-interceptor'; 

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    
    // ✅ 3. ใส่ authInterceptor เข้าไปใน provideHttpClient
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ],
});