import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { search } from 'ionicons/icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class HeaderComponent implements OnInit {

  @Input() title: string = '';
  @Output() searchChange = new EventEmitter<string>(); // ส่งค่าการค้นหากลับไปหน้า Home

  searchText: string = '';

  constructor(private router: Router) {
    addIcons({ search });
  }

  ngOnInit() {}

  // ฟังก์ชันเมื่อกดค้นหา หรือกด Enter
  onSearchInput() {
    console.log('Searching for:', this.searchText);
    this.searchChange.emit(this.searchText);
  }

  // ไปหน้า Login
  goToLogin() {
    this.router.navigate(['/login']);
  }

  // ไปหน้า Register
  goToRegister() {
    this.router.navigate(['/register']);
  }
}