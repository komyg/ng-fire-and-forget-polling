import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectRandomNumber } from 'src/app/state/random-number/random-number.selector';

@Component({
  selector: 'app-random-number',
  templateUrl: './random-number.component.html',
  styleUrls: ['./random-number.component.scss'],
})
export class RandomNumberComponent implements OnInit {
  randomNumber$: Observable<number>;

  constructor(private store$: Store) {}

  ngOnInit(): void {
    this.randomNumber$ = this.store$.pipe(select(selectRandomNumber));
  }
}
