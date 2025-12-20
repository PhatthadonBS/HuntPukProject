import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Auth } from '../../services/auth';
import { addIcons } from 'ionicons';
import { shieldCheckmark } from 'ionicons/icons';

@Component({
  selector: 'app-otp-modal',
  templateUrl: './otp-modal.component.html',
  styleUrls: ['./otp-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class OtpModalComponent implements OnInit, OnDestroy {

  @Input() email: string = '';

  otp: string[] = ['', '', '', '', '', ''];
  timeLeft: number = 60;
  interval: any;
  isLoading: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private authService: Auth,
    private toastCtrl: ToastController
  ) { 
    addIcons({ shieldCheckmark });
  }

  ngOnInit() {
    this.startTimer();
    setTimeout(() => {
      document.getElementById('otp-0')?.focus();
    }, 500);
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  // ✅ 1. แก้ปัญหา *ngFor เด้งมั่ว (สำคัญมาก)
  trackByIndex(index: number, obj: any): any {
    return index;
  }

  // ✅ 2. จัดการการพิมพ์ (ใช้กับ event input)
  handleInput(event: any, index: number) {
    const value = event.target.value;
    
    // ถ้าพิมพ์ตัวเลขลงไป
    if (value.length >= 1) {
      // ถ้าไม่ใช่ช่องสุดท้าย ให้ย้ายไปช่องถัดไป
      if (index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      } else {
        // ถ้าช่องสุดท้ายแล้ว ให้ลองยืนยันเลย
        this.verify(); 
      }
    }
  }

  // ✅ 3. จัดการการลบ (ใช้กับ event keydown)
  handleDelete(event: any, index: number) {
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;
      
      // ถ้าช่องนี้ว่าง และไม่ใช่ช่องแรก -> ถอยไปโฟกัสช่องก่อนหน้า
      if (input.value === '' && index > 0) {
        event.preventDefault(); // กันไม่ให้ลบซ้ำซ้อน
        const prev = document.getElementById(`otp-${index - 1}`);
        prev?.focus();
      }
    }
  }

  startTimer() {
    this.stopTimer();
    this.timeLeft = 60;
    this.interval = setInterval(() => {
      if(this.timeLeft > 0) this.timeLeft--;
      else this.stopTimer();
    }, 1000);
  }

  stopTimer() {
    if(this.interval) clearInterval(this.interval);
  }

  async resendOTP() {
    try {
      this.isLoading = true;
      await this.authService.reqOTP(this.email);
      this.showToast('ส่งรหัส OTP ใหม่แล้ว', 'success');
      this.startTimer();
    } catch (error) {
      this.showToast('ส่ง OTP ไม่สำเร็จ', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async verify() {
    const otpCode = this.otp.join('');
    if (otpCode.length < 6) return;

    this.isLoading = true;

    try {
      await this.authService.verifyOTP(this.email, otpCode);
      this.modalCtrl.dismiss({ success: true, otp: otpCode });
    } catch (error) {
      console.error(error);
      this.showToast('รหัส OTP ไม่ถูกต้อง', 'danger');
      // เคลียร์ค่า
      this.otp = ['', '', '', '', '', ''];
      setTimeout(() => document.getElementById('otp-0')?.focus(), 100);
    } finally {
      this.isLoading = false;
    }
  }

  closeModal() {
    this.modalCtrl.dismiss(null);
  }

  async showToast(msg: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }
}