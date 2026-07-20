import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ViewDidEnter } from '@ionic/angular';
import { Auth } from '../../services/auth';
import { addIcons } from 'ionicons';
import { arrowBack, key, person, eye, eyeOff, logInOutline, checkmark, lockClosedOutline, timeOutline } from 'ionicons/icons';

// ==========================================
// 🛡️ Security Constants — Brute-force Protection
// ==========================================
const MAX_ATTEMPTS = 5;               // สูงสุด 5 ครั้ง
const LOCKOUT_MS   = 15 * 60 * 1000; // lockout 15 นาที
const WINDOW_MS    = 15 * 60 * 1000; // นับใน window 15 นาที
const STORAGE_KEY  = 'hp_login_attempts';

interface AttemptRecord { count: number; firstAt: number; lockedUntil?: number; }

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
})
export class LoginPage implements OnInit, OnDestroy, ViewDidEnter {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;
  rememberMe: boolean = false;

  // 🛡️ Brute-force UI state
  isLocked       = false;
  lockCountdown  = '';
  attemptsLeft   = MAX_ATTEMPTS;
  private countdownTimer?: any;

  @ViewChild('emailInput', { static: false }) emailInput!: ElementRef;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: Auth
  ) {
    addIcons({ arrowBack, person, key, eye, eyeOff, logInOutline, checkmark, lockClosedOutline, timeOutline });
  }

  ngOnInit() {
    const remembered = localStorage.getItem('rememberLogin');
    if (remembered) {
      try {
        const data = JSON.parse(remembered);
        this.email      = data.email    || '';
        this.password   = data.password || '';
        this.rememberMe = true;
      } catch {}
    }
    this.checkLockoutStatus();
  }

  ngOnDestroy() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  }

  ionViewDidEnter() {
    this.checkLockoutStatus();
    setTimeout(() => this.emailInput?.nativeElement?.focus(), 150);
  }

  // ==========================================
  // 🛡️ Brute-force helpers
  // ==========================================
  private getRecord(): AttemptRecord {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return { count: 0, firstAt: Date.now() }; }
  }

  private saveRecord(r: AttemptRecord) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
  }

  checkLockoutStatus() {
    const rec = this.getRecord();
    const now = Date.now();

    if (rec.lockedUntil && now < rec.lockedUntil) {
      this.isLocked = true;
      this.startCountdown(rec.lockedUntil - now);
      return;
    }
    if (rec.lockedUntil && now >= rec.lockedUntil) {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.isLocked     = false;
    this.attemptsLeft = MAX_ATTEMPTS - (rec.count || 0);
    if (this.attemptsLeft < 0) this.attemptsLeft = 0;
  }

  private recordFailedAttempt() {
    const rec = this.getRecord();
    const now = Date.now();

    if (now - (rec.firstAt || now) > WINDOW_MS) {
      rec.count   = 1;
      rec.firstAt = now;
      delete rec.lockedUntil;
    } else {
      rec.count = (rec.count || 0) + 1;
    }

    if (rec.count >= MAX_ATTEMPTS) {
      rec.lockedUntil = now + LOCKOUT_MS;
      this.isLocked   = true;
      this.startCountdown(LOCKOUT_MS);
    }

    this.attemptsLeft = Math.max(0, MAX_ATTEMPTS - rec.count);
    this.saveRecord(rec);
  }

  private startCountdown(msLeft: number) {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    const end = Date.now() + msLeft;

    const tick = () => {
      const remaining = end - Date.now();
      if (remaining <= 0) {
        clearInterval(this.countdownTimer);
        this.isLocked      = false;
        this.lockCountdown = '';
        this.attemptsLeft  = MAX_ATTEMPTS;
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      // แสดงแบบ "อีก X นาที Y วินาที" ไม่ใช่ "HH:mm" เพื่อไม่ให้สับสนกับเวลานาฬิกา
      if (m > 0) {
        this.lockCountdown = `อีก ${m} นาที ${s} วินาที`;
      } else {
        this.lockCountdown = `อีก ${s} วินาที`;
      }
    };
    tick();
    this.countdownTimer = setInterval(tick, 1000);
  }

  // ==========================================
  togglePasswordVisibility() { this.showPassword = !this.showPassword; }
  goHome() { this.router.navigate(['/home']); }

  async login() {
    if (this.isLocked) {
      this.showAlert('⛔ บัญชีถูกล็อกชั่วคราว', `กรุณารอ ${this.lockCountdown} แล้วลองใหม่ เนื่องจากพยายามเข้าสู่ระบบผิดพลาดหลายครั้ง`);
      return;
    }
    if (this.isLoading) return;

    if (!this.email?.trim()) {
      this.showAlert('กรอกข้อมูลไม่ครบ', 'กรุณาระบุอีเมลของคุณ');
      setTimeout(() => this.emailInput?.nativeElement?.focus(), 100);
      return;
    }
    if (!this.password) {
      this.showAlert('กรอกข้อมูลไม่ครบ', 'กรุณาระบุรหัสผ่าน');
      return;
    }

    this.isLoading = true;

    try {
      const normalizedEmail = this.email.trim().toLowerCase();
      const res = (await this.authService.login(normalizedEmail, this.password)) as any;

      if (res && res.logged_in) {
        const roleId = res.user.role_id;
        const status = res.user.accout_status;

        if ((roleId === 1 || roleId === 2 || roleId === 3) && status === 0) {
          // ✅ สำเร็จ — reset attempt counter
          localStorage.removeItem(STORAGE_KEY);
          this.attemptsLeft = MAX_ATTEMPTS;

          const userData = {
            loggedIn: true,
            id:             res.user.id,
            email:          normalizedEmail,
            username:       res.user.username,
            role_id:        res.user.role_id,
            accout_status:  res.user.accout_status,
            phone:          res.user.phone,
            token:          res.token,
            showWelcome:    true,
            loginAt:        Date.now()
          };
          localStorage.setItem('loggedIn', JSON.stringify(userData));

          if (this.rememberMe) {
            localStorage.setItem('rememberLogin', JSON.stringify({ email: normalizedEmail, password: this.password }));
          } else {
            localStorage.removeItem('rememberLogin');
          }

          window.dispatchEvent(new CustomEvent('user-logged-in'));

          if (roleId === 3) this.router.navigate(['/dashboard']);
          else              this.router.navigate(['/home']);

        } else {
          this.recordFailedAttempt();
          this.showAlert('เข้าสู่ระบบไม่สำเร็จ', 'บัญชีของคุณถูกระงับหรือไม่มีสิทธิ์เข้าใช้งาน');
          localStorage.removeItem('loggedIn');
        }

      } else {
        this.recordFailedAttempt();
        if (this.isLocked) {
          this.showAlert('⛔ บัญชีถูกล็อก', `พยายามเข้าสู่ระบบผิดพลาด ${MAX_ATTEMPTS} ครั้ง กรุณารอ 15 นาที`);
        } else {
          this.showAlert('เข้าสู่ระบบไม่สำเร็จ',
            `อีเมลหรือรหัสผ่านไม่ถูกต้อง (เหลืออีก ${this.attemptsLeft} ครั้งก่อนถูกล็อก)`);
        }
      }

    } catch (error: any) {
      const serverMessage = error.error?.message || error.error || error.message || '';
      let displayMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
      if (serverMessage.includes('ไม่มีข้อมูล') || error.status === 404)
        displayMsg = 'ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบอีกครั้ง';
      else if (serverMessage.includes('รหัสผ่าน') || error.status === 401)
        displayMsg = 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
      else if (error.status === 500)
        displayMsg = 'ระบบเซิร์ฟเวอร์ขัดข้องชั่วคราว กรุณาลองใหม่ภายหลัง';
      else if (typeof serverMessage === 'string' && serverMessage.length > 0)
        displayMsg = serverMessage;

      if (error.status === 401 || error.status === 404) {
        this.recordFailedAttempt();
      }
      this.showAlert('พบข้อผิดพลาด', displayMsg);
    } finally {
      this.isLoading = false;
    }
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header, message, buttons: ['ตกลง'], cssClass: 'custom-alert',
    });
    await alert.present();
  }
}