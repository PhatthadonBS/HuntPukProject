import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // 1. ต้อง import อันนี้เพื่อใช้ ngModel

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule] // 2. ใส่ FormsModule ที่นี่
})
export class HeaderComponent  implements OnInit {
  @Input() title: string = ''; 
  @Output() searchChange = new EventEmitter<string>(); // 3. ตัวส่งค่าออกไป

  searchText: string = '';

  constructor(private router: Router) { }

  ngOnInit() {}

  // ฟังก์ชันเมื่อกด Enter หรือพิมพ์
  onSearchInput() {
    this.searchChange.emit(this.searchText); // ส่งข้อความที่พิมพ์ออกไปให้หน้าแม่ (Home)
  }

  goToLogin() { this.router.navigate(['/login']); }
  goToRegister() { this.router.navigate(['/register']); }
}