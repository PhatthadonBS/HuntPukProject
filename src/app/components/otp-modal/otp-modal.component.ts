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

  otp: string = '';
  timeLeft: number = 60;
  interval: any;
  isLoading: boolean = false;

  wrongAttempts: number = 0;
  resendAttempts: number = 0;
  isBlocked: boolean = false;
  errorMessage: string = '';

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
      document.getElementById('otp-input')?.focus();
    }, 500);
  }

  ngOnDestroy() {
    this.stopTimer();
  }



  startTimer() {
    this.stopTimer();
    this.timeLeft = (this.resendAttempts >= 3) ? 180 : 60;
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
      this.resendAttempts++;
      this.wrongAttempts = 0;
      this.isBlocked = false;
      this.otp = '';
      this.startTimer();
    } catch (error) {
      this.showToast('ส่ง OTP ไม่สำเร็จ', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  clearError() {
    this.errorMessage = '';
  }

  async verify() {
    if (this.isBlocked) {
      this.errorMessage = 'คุณกรอกผิดเกิน 3 ครั้ง กรุณาขอรหัส OTP ใหม่';
      return;
    }

    const otpCode = this.otp;
    if (otpCode.length < 6) return;

    this.isLoading = true;

    try {
      await this.authService.verifyOTP(this.email, otpCode);
      this.modalCtrl.dismiss({ success: true, otp: otpCode });
    } catch (error) {
      console.error(error);
      this.wrongAttempts++;
      
      if (this.wrongAttempts >= 3) {
        this.isBlocked = true;
        this.errorMessage = 'กรอกผิดเกิน 3 ครั้ง กรุณารอขอ OTP ใหม่';
        this.otp = '';
      } else {
        this.errorMessage = `รหัส OTP ไม่ถูกต้อง (ผิดครั้งที่ ${this.wrongAttempts}/3)`;
        this.otp = '';
        setTimeout(() => document.getElementById('otp-input')?.focus(), 100);
      }
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