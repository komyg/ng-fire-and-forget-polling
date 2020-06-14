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

export const startPolling = createAction(
  '[Polling] start',
  props<{ min: number; max: number }>()
);

export const pollingSuccess = createAction(
  '[Polling] success',
  props<{ randomNumber: number }>()
);

export const pollingError = createAction(
  '[Polling] error',
  props<{ error: Error }>()
);
```

## Reducers

Now let's create the random number reducer. To do this, create the file: *src/app/reducers/random-number/random-number.reducer.ts* and paste the code below:

```javascript
import * as actions from '../../actions/random-number.actions';
import { on, createReducer } from '@ngrx/store';

export interface RandomNumberState {
  min: number;
  max: number;
  randomNumber: number;
  errorMsg: string;
}

const initialState: RandomNumberState = {
  min: 0,
  max: 99,
  randomNumber: 0,
  errorMsg: '',
};

const randomNumberReducer = createReducer(
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
