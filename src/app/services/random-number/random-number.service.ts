import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RandomNumberService {
  constructor() {}

  getRandomInteger(min: number, max: number): Observable<number> {
    const num = Math.floor(Math.random() * (max - min)) + min;
    return of(num);
  }
}
