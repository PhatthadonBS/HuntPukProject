import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { search, personCircle, personCircleOutline, logOutOutline } from 'ionicons/icons'; // ✅ นำเข้าทั้งแบบทึบและแบบเส้น

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class HeaderComponent implements OnInit {

  @Input() title: string = '';
  
  // ✅ ตัวแปรรับข้อมูล User จากหน้า Home
  @Input() userData: any = null; 
  
  @Output() searchChange = new EventEmitter<string>();

  searchText: string = '';

  constructor(private router: Router) {
    // ✅ ลงทะเบียนไอคอนแบบ shorthand (ลบเครื่องหมายคำพูดและคอลอนออกทั้งหมด)
    // การเขียนแบบนี้ทำให้ Ionic เข้าใจและจับคู่ไอคอนให้กับ HTML ได้สมบูรณ์ที่สุดทั้งแบบ person-circle และ person-circle-outline ครับ
    addIcons({ 
      search, 
      personCircle, 
      personCircleOutline, 
      logOutOutline 
    });
  }

  ngOnInit() {}

  onSearchInput() {
    this.searchChange.emit(this.searchText);
  }

  goToLogin() { this.router.navigate(['/login']); }
  goToRegister() { this.router.navigate(['/register']); }

  // ✅ ฟังก์ชัน Logout
  logout() {
    // ลบข้อมูลการล็อกอิน
    localStorage.removeItem('loggedIn');
    // รีโหลดหน้าจอเพื่อให้กลับสู่สถานะยังไม่ล็อกอิน
    window.location.reload(); 
  }

  // ✅ ฟังก์ชันไปหน้าบัญชีของฉัน
  goToMyAccount() {
    this.router.navigate(['/my-account']);
  }
}