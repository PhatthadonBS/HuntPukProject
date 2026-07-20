import { Component, OnInit } from '@angular/core';
import { IonicModule } from "@ionic/angular";
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../environments/environment';
import { MenuComponent } from "./components/menu/menu.component";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, MenuComponent],
})
export class AppComponent implements OnInit {
  api = environment.GGMAPI;

  ngOnInit() {
    // ✅ ฟัง sidebar state change จาก MenuComponent
    window.addEventListener('sidebar-state-changed', (e: Event) => {
      const detail = (e as CustomEvent).detail as { isOpen: boolean; isDesktop: boolean };
      const ionApp = document.querySelector('ion-app');
      if (!ionApp) return;

      if (detail.isDesktop && detail.isOpen) {
        ionApp.classList.add('sidebar-open');
      } else {
        ionApp.classList.remove('sidebar-open');
      }
    });
  }
}