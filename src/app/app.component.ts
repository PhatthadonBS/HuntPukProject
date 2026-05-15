import { Component, EnvironmentInjector } from '@angular/core';
import { IonicModule, MenuController } from "@ionic/angular"; // เพิ่ม MenuController
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../environments/environment';
import { MenuComponent } from "./components/menu/menu.component";
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, MenuComponent], 
})
export class AppComponent {
  api = environment.GGMAPI;

}