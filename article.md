# Angular Fire and Forget Polling with NgRx and Unit Tests

In this tutorial I would like to show you how can you poll a service using Observables (RxJS) and the NgRx Store and Effects. It assumes that you have a basic knowledge of Angular, Typescript, NgRx and RxJS.

## Our Goal

The goal of this tutorial is to setup a fire and forget polling of a service. By fire and forget I mean to say that I would like to call the starting action of the polling only once and have the polling go on forever.

That being said, it would be easier to setup a polling strategy where I would call a given action from a component every X seconds, but then, if the user navigates away from this component, then the polling would stop, and this would violate our goal above.

Therefore our implementation strategy will be the following:

1. Create a mock service that will be polled every 15 seconds.
2. Create actions and reducers to start the polling and handle its results.
3. Create an Effect that will do the actual polling of our service and will dispatch the success and fail actions.
4. Create a component that will listen to the polling's results.

## Initial setup

For the initial setup add the following packages:

- NgRx Store: `ng add @ngrx/store`
- NgRx Effects: `ng add @ngrx/effects`
- NgRx DevTools:  `ng add @ngrx/store-devtools`
- Angular Material: `ng add @angular/material`
- Jasmine Marbles: `yarn add -D jasmine-marbles`

## Environment

Before web begin we should also add an environment variable. Edit the *src/environments/environment.ts* and *src/environments/environment.prod.ts* files to add a polling interval of 10 seconds (or 10.000 milliseconds):

```javascript
export const environment = {
  production: true,
  pollingInterval: 10000,
};
```

## Random number service

For this tutorial we will create a simple service that will return a random number when called. In order to simulate a more accurate behavior, we are going to return this random number inside an Observable, because this is what would happen if we were to poll a remote server for example.

To start create a new folder called: *src/app/services/random-number*. Then create a new service template with the command: `ng g service services/random-number/random-number`.

Copy and paste the following code into the *random-number.service.ts* file:

```javascript
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
```

What this service does is just generate a random integer between max and min and return it as an `Observable`. As state before, the purpose of the Observable here is to simulate the behavior of an API call.

### Unit testing our service

To make sure our service works as expected, we can add a unit test in the file: *src/app/services/random-number/random-number.service.spec.ts*:

```javascript
import { TestBed } from '@angular/core/testing';

import { RandomNumberService } from './random-number.service';

describe('RandomNumberService', () => {
  let service: RandomNumberService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RandomNumberService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate a random number', (done: DoneFn) => {
    service.getRandomInteger(0, 99).subscribe((result) => {
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(100);
      done();
    });
  });
});
```

## Actions

For the actions, create a new file: *src/app/actions/random-number.actions.ts* and paste the contents below:

```javascript
import { createAction, props } from '@ngrx/store';

export const START_POLLING = '[Polling] start';
export const POLLING_SUCCESS = '[Polling] success';
export const POLLING_ERROR = '[Polling] error';

export const startPolling = createAction(
  START_POLLING,
  props<{ min: number; max: number }>()
);

export const pollingSuccess = createAction(
  POLLING_SUCCESS,
  props<{ randomNumber: number }>()
);

export const pollingError = createAction(
  POLLING_ERROR,
  props<{ error: any }>()
);
```

## Reducers

Now let's create the random number reducer. To do this, create the file: *src/app/reducers/random-number/random-number.reducer.ts* and paste the code below:

```javascript
import * as actions from '../../actions/random-number.actions';
import { on, createReducer } from '@ngrx/store';
import { environment } from 'src/environments/environment';

export interface RandomNumberState {
  min: number;
  max: number;
  randomNumber: number;
  errorMsg: string;
  pollingInterval: number;
}

const initialState: RandomNumberState = {
  min: 0,
  max: 99,
  randomNumber: 0,
  errorMsg: '',
  pollingInterval: environment.pollingInterval,
};

export const randomNumberReducer = createReducer(
  initialState,
  on(actions.startPolling, (state, { min, max }) => ({ ...state, min, max })),
  on(actions.pollingSuccess, (state, { randomNumber }) => ({
    ...state,
    randomNumber,
    errorMsg: '',
  })),
  on(actions.pollingError, (state, { error }) => ({
    ...state,
    errorMsg: error.message,
  }))
);
```

This is a simple reducer that updates the current state with the `min` and `max` values for the random number generator and also stores either the resulting random number or an error message.

### Registering the random number reducer

To register our random number reducer, create the file: *src/app/state/state.ts* and paste the contents below:

```javascript
import { ActionReducerMap } from '@ngrx/store';
import {
  randomNumberReducer,
  RandomNumberState,
} from './random-number/random-number.reducer';

export interface State {
  randomNumberFeature: RandomNumberState;
}

export const reducers: ActionReducerMap<State> = {
  randomNumberFeature: randomNumberReducer,
};

export const selectRandomNumberFeature = (appState: State) =>
  appState.randomNumberFeature;
```

As you can see we created a new state feature called `randomNumberFeature` and associated our reducer to it. We also created a feature selector that we will use below.

Then open the *src/app/app.module.ts* file and add our reducers to the store config:

```javascript
/* [...] */
import { reducers } from './state/state';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    StoreModule.forRoot(reducers),
    /* [...] */

export class AppModule {}

```

### Creating selectors

To make it easier for us to work with our state, let's create a few selectors. Create the file: *src/app/state/random-number/random-number.selector.ts* and paste the contents below:

```javascript
import { createSelector } from '@ngrx/store';
import { selectRandomNumberFeature } from '../state';
import { RandomNumberState } from 'src/app/reducers/random-number/random-number.reducer';

export const selectMinMax = createSelector(
  selectRandomNumberFeature,
  (state: RandomNumberState) => ({ min: state.min, max: state.max })
);

export const selectRandomNumber = createSelector(
  selectRandomNumberFeature,
  (state: RandomNumberState) => state.randomNumber
);

export const selectPollingInterval = createSelector(
  selectRandomNumberFeature,
  (state: RandomNumberState) => state.pollingInterval
);
```

### Unit testing or reducer

Now let's add a unit test to validate if our reducer is working correctly. Create the file: *src/app/reducers/random-number/random-number.reducer.spec.ts* and paste the contents below:

```javascript
import {
  startPolling,
  pollingSuccess,
  pollingError,
} from 'src/app/actions/random-number.actions';
import {
  randomNumberReducer,
  RandomNumberState,
} from './random-number.reducer';

describe('Random Number Reducer', () => {
  let initialState: RandomNumberState;
  beforeEach(() => {
    initialState = {
      min: 0,
      max: 100,
      randomNumber: 0,
      errorMsg: '',
      pollingInterval: 10,
    };
  });

  it('should handle the start polling action', () => {
    const action = startPolling({ min: 1, max: 5 });
    const result = randomNumberReducer(initialState, action);
    expect(result.min).toBe(1);
    expect(result.max).toBe(5);
  });

  it('should handle the polling success action', () => {
    const action = pollingSuccess({ randomNumber: 42 });
    const result = randomNumberReducer(initialState, action);
    expect(result.randomNumber).toBe(42);
  });

  it('should handle the polling error action', () => {
    const action = pollingError({ error: new Error('Fake error') });
    const result = randomNumberReducer(initialState, action);
    expect(result.errorMsg).toBe('Fake error');
  });
});
```

## Effects

Now that we have finished setting up our reducer we can setup a side effect that will implement our polling. To do this create the file:
*src/app/effects/random-number/random-number.effect.ts* and paste the contents below:

```javascript
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

```

There are a lot of things happening on our effect to create the polling. So we will break it down from the top:

- `() => ({ scheduler = asyncScheduler, stopTimer = EMPTY } = {}) =>`: we start our effect by passing two variables to it: `scheduler` and `topTimer`, both which have default values of `asyncScheduler` and `EMTPY` respectively. They are here, because we want to be able to replace the default `asyncScheduler` provided by RxJS so that we can run our tests.
- `ofType(startPolling),`: we use this filter to execute or effect only after the `startPolling` action has finished.
- `withLatestFrom(this.store$.pipe(select(selectPollingInterval))),`: here we take the polling interval from our store state and pass it forward to our test (we could use the value directly from the `environment` variables, but I wanted to illustrate this use case).
- `switchMap(([action, pollingInterval]) =>`: we use the `switchMap` here, because it will subscribe only to the latest observable returned by the `timer`, this means that if our service does not return a response within the polling interval, we cancel this request and make a new one. A more through explanation of what a `switchMap` does is available in the [RxJS documentation](https://www.learnrxjs.io/learn-rxjs/operators/transformation/switchmap#why-use-switchmap).
- `timer(0, pollingInterval, scheduler)`: this the part of our effect that does the polling. It will make a request to our service immediately and then do it again after the time prescribed in the `pollingInterval` has passed. Notice that we are passing the `scheduler` variable to it. This is done to make our effect testable with marbles.
- `takeUntil(stopTimer),`: this statement will stop our polling when the `stopTimer` observable emits. We are only using this for testing purposes.
- `switchMap(() =>`: we use this switch map to encapsulate a call to our service.
- `this.randomNumberService.getRandomInteger(action.min, action.max)`: this is the actual call for our random number service. It returns an Observable containing a random number.
- `map((randomNumber) => pollingSuccess({ randomNumber })),`: if the call to our random number service succeeds, we map the result to the `pollingSuccess` action.
- `catchError((error) =>`: if the call to our random number service fails, we return the `pollingError` action.

### Testing our effect

Now that we have our effect created, let's add a unit test for it. Create the file: *src/app/effects/random-number/random-number.effect.spec.ts* and paste the contents below:

```javascript
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
```

In the test above we are making extensive use of marble tests. I took the summary below from [this article](https://medium.com/@bencabanes/marble-testing-observable-introduction-1f5ad39231c). If you've never worked with marble tests, I strongly suggest you read it.

To write a test with marble diagrams you will need to stick to a convention of characters that will help visualize the observable stream:

- During the tests, the sens of time (when values are emitted) is handle by the RxJS TestScheduler
- (dash): simulate the passage of time, one dash correspond to a frame which can be perceived as 10ms in our tests, —--- is 40 ms
- a-z (a to z): represent an emission, -a--b---c stands for “emit a at 20ms, b at 50ms, c at 90ms”
- | (pipe): emit a completed (end of the stream), ---a-| stands for emit ‘a’ at 40ms then complete (60ms)
- \# (pound sign): indicate an error (end of the stream), —--a--# emit a at 40ms then an error at 70ms
- ( ) (parenthesis): multiple values together in the same unit of time, —--(ab|) stands for emit a b at 40ms then complete (40ms)
- ^ (caret): indicate a subscription point, —^-- subscription starting at ^
- ! (exclamation point): indicate the end of a subscription point, —^--! subscription starting at ^ and ending at !

These strings are a powerful syntax that will permit you to simulate the passage of time, emit a value, a completion, an error etc.. all that, without creating the observable yourself.

You also have some methods to parse and create observables from your diagrams:
**cold()**

`cold(marbles: string, values?: object, error?: any)` Subscription starts when test begins:

`cold(--a--b--|, { a: 'Hello', b: 'World' })` → Emit ‘Hello’ at 30ms and ‘World’ at 60ms, complete at 90ms.
**hot()**

`hot(marbles: string, values?: object, error?: any)` Behaves like subscription starts at point of caret:

`hot(--^--a--b--|, { a: 'Hello', b: 'World' })` → Subscription begins at point of caret, then emit ‘Hello’ at 30ms and ‘World’ at 60ms, complete at 90ms.

Here is the breakdown of the main parts of the first test:

- `testScheduler = getTestScheduler();`: We have to get the test scheduler from the jasmine marbles in order the test the async behaviors such as the timer and the timeout.
- `service.getRandomInteger.and.returnValues(cold('a|', { a: 42 }), cold('b|', { b: 33 }), cold('c|', { c: 2 }));`: mock our service so that it returns test observables.
- `const expected = hot('a--b--c', { a: pollingSuccess({ randomNumber: 42 }), b: pollingSuccess({ randomNumber: 33 }), c: pollingSuccess(randomNumber: 2 }), });`: here we setup our test's expected result. Notice that the polling effect on the marble diagram and that we don't need to keep calling the `action$` observable to make the polling work.
- `const stopTimer = hot('-------a', { a: 'stop' });`: here we create an observable that emits at the end of the test. If we don't do this, the polling will continue to run after we are done, and this will generate an error on the `expect` assertion, because we will have more returns from our effect than we expect.
- `expect(effects.randomNumberPolling$({ scheduler: testScheduler, stopTimer })).toBeObservable(expected);`: here are testing our side effect. Notice that we pass both the `testScheduler` and the `stopTimer` as arguments. This way we can override the default async scheduler from rxjs and stop the `timer` once our test is done.

The second test very similar to the first one, but in this case we are forcing a timeout using an observable that will emit a result after the specified polling interval of 30: `cold('----a|', { a: 42 }),`. Our effect will handle the timeout error and try again.

The last test is also similar to the other ones, but in this case we are simulating an error using this observable: `cold('-#'),`. Our effect should handle this error and try again.

