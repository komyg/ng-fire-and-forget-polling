import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { asyncScheduler, EMPTY, of, timer } from 'rxjs';
import {
  catchError,
  map,
  switchMap,
  takeUntil,
  timeout,
  withLatestFrom,
} from 'rxjs/operators';
import {
  pollingError,
  pollingSuccess,
  startPolling,
} from 'src/app/actions/random-number.actions';
import { RandomNumberService } from 'src/app/services/random-number/random-number.service';
import { selectPollingInterval } from 'src/app/state/random-number/random-number.selector';
import { State } from 'src/app/state/state';

@Injectable()
export class RandomNumberEffects {
  randomNumberPolling$ = createEffect(
    () => ({ scheduler = asyncScheduler, stopTimer = EMPTY } = {}) =>
      this.actions$.pipe(
        // Filter action type
        ofType(startPolling),
        // Get the polling interval
        withLatestFrom(this.store$.pipe(select(selectPollingInterval))),
        switchMap(([action, pollingInterval]) =>
          // Start polling
          timer(0, pollingInterval, scheduler).pipe(
            // Stop the polling (used only in testing)
            takeUntil(stopTimer),
            switchMap(() =>
              this.randomNumberService
                .getRandomInteger(action.min, action.max)
                .pipe(
                  map((randomNumber) => pollingSuccess({ randomNumber })),
                  catchError((error) => {
                    console.error(error);
                    return of(pollingError({ error }));
                  })
                )
            )
          )
        )
      )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<State>,
    private randomNumberService: RandomNumberService
  ) {}
}
