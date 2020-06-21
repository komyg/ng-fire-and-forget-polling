import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { selectPollingInterval } from 'src/app/state/random-number/random-number.selector';
import { RandomNumberService } from 'src/app/services/random-number/random-number.service';
import { Action } from '@ngrx/store';
import { Observable } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { cold, getTestScheduler, hot } from 'jasmine-marbles';
import { RandomNumberEffects } from './random-number.effect';
import {
  startPolling,
  pollingSuccess,
  pollingError,
} from 'src/app/actions/random-number.actions';
import { TestScheduler } from 'rxjs/testing';

describe('Random Number Effect', () => {
  let actions$: Observable<Action>;
  let effects: RandomNumberEffects;
  let service: jasmine.SpyObj<RandomNumberService>;
  let testScheduler: TestScheduler;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RandomNumberEffects,
        // Mock Random number service
        {
          provide: RandomNumberService,
          useValue: jasmine.createSpyObj('service-spy', ['getRandomInteger']),
        },
        provideMockActions(() => actions$),
        provideMockStore({
          selectors: [{ selector: selectPollingInterval, value: 30 }],
        }),
      ],
    });

    effects = TestBed.inject(RandomNumberEffects);
    service = TestBed.inject(RandomNumberService) as jasmine.SpyObj<
      RandomNumberService
    >;

    // Get the test scheduler so that we can simulate the async behavior
    testScheduler = getTestScheduler();
  });

  it('should successfully poll for random numbers', () => {
    // Mock service response
    service.getRandomInteger.and.returnValues(
      cold('a|', { a: 42 }),
      cold('b|', { b: 33 }),
      cold('c|', { c: 2 })
    );

    // Call the action observable with the Action that will be processed by the effect.
    actions$ = hot('a', { a: startPolling({ min: 0, max: 99 }) });

    // Create the expected result
    const expected = hot('a--b--c', {
      a: pollingSuccess({ randomNumber: 42 }),
      b: pollingSuccess({ randomNumber: 33 }),
      c: pollingSuccess({ randomNumber: 2 }),
    });

    // Make sure we stop the timer at the end of the test
    const stopTimer = hot('-------a', { a: 'stop' });

    expect(
      effects.randomNumberPolling$({ scheduler: testScheduler, stopTimer })
    ).toBeObservable(expected);
  });

  it('should handle a timeout', () => {
    service.getRandomInteger.and.returnValues(
      cold('----a|', { a: 42 }),
      cold('b|', { b: 33 }),
      cold('-c|', { c: 2 })
    );

    actions$ = hot('a', { a: startPolling({ min: 0, max: 99 }) });
    const expected = hot('---b---c', {
      b: pollingSuccess({ randomNumber: 33 }),
      c: pollingSuccess({ randomNumber: 2 }),
    });

    const stopTimer = hot('-------a', { a: 'stop' });

    expect(
      effects.randomNumberPolling$({ scheduler: testScheduler, stopTimer })
    ).toBeObservable(expected);
  });

  it('should handle an error', () => {
    service.getRandomInteger.and.returnValues(
      cold('-#'),
      cold('b|', { b: 33 }),
      cold('c|', { c: 2 })
    );

    actions$ = hot('a', { a: startPolling({ min: 0, max: 99 }) });
    const expected = hot('-a-b--c', {
      a: pollingError({ error: 'error' }),
      b: pollingSuccess({ randomNumber: 33 }),
      c: pollingSuccess({ randomNumber: 2 }),
    });

    const stopTimer = hot('-------a', { a: 'stop' });

    expect(
      effects.randomNumberPolling$({ scheduler: testScheduler, stopTimer })
    ).toBeObservable(expected);
  });
});
