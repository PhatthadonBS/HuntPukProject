import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Constants } from '../config/config';
import { UserRegPostReq } from '../model/req/user_reg_post_req';
import { lastValueFrom, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  constructor(
    private endpoint: Constants,
    private http: HttpClient,
    private router: Router
  ) {}

  public async register(user: UserRegPostReq) {
    const url = this.endpoint.API_ENDPOINT + '/auth/registerSec1';
    try {
      const res = await lastValueFrom(this.http.post(url, user));
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }

  public async registerSec2(user: UserRegPostReq, verify: boolean) {
    const url = this.endpoint.API_ENDPOINT + '/auth/registerSec2';
    try {
      const obj = {
        userData: user, verify
      }
      const res = await lastValueFrom(this.http.post(url, obj));
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }

  public async reqOTP(email: string){
    const url = this.endpoint.API_ENDPOINT + '/SendOTP';
      try {
        console.log(email);
        
        const obj = {
          email: email
        }
        console.log(obj);
        
      const res = await lastValueFrom(this.http.post(url, obj));
      console.log(res);
      
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }


  public async verifyOTP(email: string, otp: string){
    const url = this.endpoint.API_ENDPOINT + '/OTPVerify';
      try {
        const obj = {
          email: email,
          otp: otp
        }
      const res = await lastValueFrom(this.http.post(url, obj));
      console.log(res);
      
      return res;
    } catch (error: any) {
      throw new Error(JSON.stringify(error.error, null, 2));
    }
  }
}
