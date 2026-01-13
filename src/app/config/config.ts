import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Constants {
  // public readonly API_ENDPOINT: string = 'http://192.168.6.1:3008';
  public readonly API_ENDPOINT: string = 'https://huntpukapi-production.up.railway.app';
}