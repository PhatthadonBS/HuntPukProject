import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { search, personCircleOutline, logOutOutline } from 'ionicons/icons'; // ✅ เพิ่ม icon

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class HeaderComponent implements OnInit {

  @Input() title: string = '';
  
  // ✅ 1. เพิ่มตัวแปรรับข้อมูล User จากหน้า Home
  @Input() userData: any = null; 
  
  @Output() searchChange = new EventEmitter<string>();

  searchText: string = '';

  constructor(private router: Router) {
    // ✅ เพิ่ม icon user และ logout
    addIcons({ search, 'person-circle-outline': personCircleOutline, 'log-out-outline': logOutOutline });
  }

  ngOnInit() {}

  onSearchInput() {
    this.searchChange.emit(this.searchText);
  }

  goToLogin() { this.router.navigate(['/login']); }
  goToRegister() { this.router.navigate(['/register']); }

  // ✅ 2. ฟังก์ชัน Logout
  logout() {
    // ลบข้อมูลการล็อกอิน
    localStorage.removeItem('loggedIn');
    // รีโหลดหน้าจอเพื่อให้กลับสู่สถานะยังไม่ล็อกอิน
    window.location.reload(); 
  }
  // ✅ [เพิ่ม] ฟังก์ชันไปหน้าบัญชีของฉัน
  goToMyAccount() {
    this.router.navigate(['/my-account']);
  }
}