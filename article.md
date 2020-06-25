# Angular Fire and Forget Polling with NgRx and Unit Tests

In this tutorial I would like to show you how you can poll a service using Observables (RxJS) and the NgRx Store and Effects. It assumes that you have a basic knowledge of Angular, Typescript, NgRx and RxJS.

The full code for this tutorial is available in this [repository](https://github.com/komyg/ng-fire-and-forget-polling).

## Our Goal

The goal of this tutorial is to setup a fire and forget polling. By fire and forget I mean to say that I would like to call the starting action of the polling only once and have the polling go on forever.

That being said, it would be easier to setup a polling strategy where I would call a given action from a component every X seconds, but then, if the user navigates away from this component, the polling would stop and this would violate our goal above.

Our implementation strategy will be the following:

1. Create a mock service that will be polled every 3 seconds.
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

Before web begin we should also add an environment variable. Edit the *src/environments/environment.ts* and *src/environments/environment.prod.ts* files to add a polling interval of 3 seconds (or 3.000 milliseconds):

```javascript
export const environment = {
  production: true,
  pollingInterval: 3000,
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

What this service does is just generate a random integer between max and min and return it as an `Observable`. As stated before, the purpose of the Observable here is to simulate the behavior of an API call.

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
  RandomNumberState,
  randomNumberReducer,
} from '../reducers/random-number/random-number.reducer';

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

- `() => ({ scheduler = asyncScheduler, stopTimer = EMPTY } = {}) =>`: we start our effect by passing two variables to it: `scheduler` and `stopTimer`, both of which have the default values of `asyncScheduler` and `EMTPY` respectively. They are here, because we want to be able to replace the default `asyncScheduler` provided by RxJS in our tests.
- `ofType(startPolling),`: we use this filter to run our effect when the action `startPolling` is called.
- `withLatestFrom(this.store$.pipe(select(selectPollingInterval))),`: here we take the polling interval from our store state and pass it forward to our test (we could use the value directly from the `environment` variables, but I wanted to illustrate this use case).
- `switchMap(([action, pollingInterval]) =>`: we use the `switchMap` here, because it will subscribe only to the latest observable returned by the `timer`, this means that if our service does not return a response within the polling interval, we cancel this request and make a new one. A more through explanation of what a `switchMap` does is available in the [RxJS documentation](https://www.learnrxjs.io/learn-rxjs/operators/transformation/switchmap#why-use-switchmap).
- `timer(0, pollingInterval, scheduler)`: this the part of our effect that does the polling. It will make a request to our service immediately and then do it again after the time prescribed in the `pollingInterval` has passed. Notice that we are passing the `scheduler` variable to it. This is done to make our effect testable with marbles.
- `takeUntil(stopTimer),`: this statement will stop our polling when the `stopTimer` observable emits. We are only using this for testing purposes.
- `switchMap(() =>`: we use this switch map to encapsulate a call to our service.
- `this.randomNumberService.getRandomInteger(action.min, action.max)`: this is the actual call for our random number service. It returns an Observable containing a random number.
- `map((randomNumber) => pollingSuccess({ randomNumber })),`: if the call to our random number service succeeds, we map the result to the `pollingSuccess` action.
- `catchError((error) =>`: if the call to our random number service fails, we return the `pollingError` action.

### Registering our effect

To register our effect, open the *src/app.module.ts* file and add it to the effects declaration: `EffectsModule.forRoot([RandomNumberEffects]),`.

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

In the test above we are making extensive use of marble tests. I took the summary below from [this article](https://medium.com/@bencabanes/marble-testing-observable-introduction-1f5ad39231c). If you've never worked with marble tests, I strongly suggest you read it in its entirety.

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
- `service.getRandomInteger.and.returnValues(cold('a|', { a: 42 }), cold('b|', { b: 33 }), cold('c|', { c: 2 }));`: mock our service so that it returns test observables each time it is called.
- `const expected = hot('a--b--c', { a: pollingSuccess({ randomNumber: 42 }), b: pollingSuccess({ randomNumber: 33 }), c: pollingSuccess(randomNumber: 2 }), });`: here we setup our test's expected result. Notice the polling effect on the marble diagram and that we don't need to keep calling the `action$` observable to make the polling work.
- `const stopTimer = hot('-------a', { a: 'stop' });`: here we create an observable that emits at the end of the test. If we don't do this, the polling will continue to run after we are done, and this will generate an error on the `expect` assertion.
- `expect(effects.randomNumberPolling$({ scheduler: testScheduler, stopTimer })).toBeObservable(expected);`: here are testing our effect. Notice that we pass both the `testScheduler` and the `stopTimer` as arguments. This way we can override the default async scheduler from RxJS and stop the `timer` once our test is done.

The second test very similar to the first one, but in this case we are forcing a timeout using an observable that will emit a result after the specified polling interval of 30: `cold('----a|', { a: 42 }),`. Our effect will handle the timeout error and try again.

The last test is also similar to the other ones, but in this case we are simulating an error using this observable: `cold('-#'),`. Our effect should handle this error and try again.

## Components

Now that we have our effect up and running, let's create some components.

>Note: the fastest way to generate a new component is by using the Angular CLI Schematics and the command: `ng generate component [component name]`.

### Random number

This component will subscribe to the `selectRandomNumber` selector using the async pipe and display our random number as it is updated by our service.

Schematics command: `ng g components/random-number`

*src/app/components/random-number/random-number.component.html*:

```html
<div class="root">
  <h3 id="random-number">Your random number is: {{ randomNumber$ | async }}</h3>
</div>
```

*src/app/components/random-number/random-number.component.scss*: this file is empty.

*src/app/components/random-number/random-number.component.ts*:

```javascript
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
```

*src/app/components/random-number/random-number.component.spec.ts*:

```javascript
import {
  async,
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';

import { RandomNumberComponent } from './random-number.component';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { selectRandomNumber } from 'src/app/state/random-number/random-number.selector';
import { By } from '@angular/platform-browser';

describe('RandomNumberComponent', () => {
  let component: RandomNumberComponent;
  let fixture: ComponentFixture<RandomNumberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        provideMockStore({
          selectors: [{ selector: selectRandomNumber, value: 42 }],
        }),
      ],
      declarations: [RandomNumberComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RandomNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the current random number', () => {
    const randomNumber = fixture.debugElement.query(By.css('#random-number'));
    expect(randomNumber.nativeElement.textContent).toContain(42);
  });
});
```

### The Min Max Input Component

This component allows our users to choose the min and max value of our random numbers and allows them to start the polling process. Notice that you can always restart the polling with new values.

This component uses the Angular Reactive Forms.

*src/app/components/min-max-input/min-max-input.component.html*:

```html
<form class="root" [formGroup]="inputForm" (ngSubmit)="onSubmit()">
  <mat-form-field>
    <mat-label>Minimum Value</mat-label>
    <input matInput formControlName="minInput" />
  </mat-form-field>
  <mat-form-field>
    <mat-label>Maximum Value</mat-label>
    <input matInput formControlName="maxInput" />
  </mat-form-field>
  <button id="submit-btn" type="submit" mat-flat-button color="primary">
    Start polling!
  </button>
</form>
```

*src/app/components/min-max-input/min-max-input.component.scss*:

```scss
.root {
  display: flex;
  flex-direction: column;
  align-content: center;
}
```

*src/app/components/min-max-input/min-max-input.component.ts*:

```javascript
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { startPolling } from 'src/app/actions/random-number.actions';

@Component({
  selector: 'app-min-max-input',
  templateUrl: './min-max-input.component.html',
  styleUrls: ['./min-max-input.component.scss'],
})
export class MinMaxInputComponent implements OnInit {
  inputForm: FormGroup;

  constructor(private store$: Store) {}

  ngOnInit(): void {
    this.inputForm = new FormGroup({
      minInput: new FormControl(0, [
        Validators.required,
        Validators.pattern('^[0-9]*$'),
      ]),
      maxInput: new FormControl(99, [
        Validators.required,
        Validators.pattern('^[0-9]*$'),
      ]),
    });
  }

  onSubmit() {
    if (this.inputForm.invalid) {
      console.warn('The form is invalid');
      return;
    }

    this.store$.dispatch(
      startPolling({
        min: this.inputForm.get('minInput').value,
        max: this.inputForm.get('maxInput').value,
      })
    );
  }
}
```

*src/app/components/min-max-input/min-max-input.component.spec.ts*:

```javascript
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MinMaxInputComponent } from './min-max-input.component';
import { ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { startPolling } from 'src/app/actions/random-number.actions';
import { MatButtonModule } from '@angular/material/button';

describe('MinMaxInputComponent', () => {
  let component: MinMaxInputComponent;
  let fixture: ComponentFixture<MinMaxInputComponent>;
  let loader: HarnessLoader;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, MatButtonModule],
      declarations: [MinMaxInputComponent],
      providers: [provideMockStore()],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MinMaxInputComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call an action when the form is submitted', async () => {
    const mockStore = TestBed.inject(MockStore);
    spyOn(mockStore, 'dispatch');

    const submitBtn = await loader.getHarness(MatButtonHarness);

    component.inputForm.get('minInput').setValue(10);
    component.inputForm.get('maxInput').setValue(100);

    await submitBtn.click();

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      startPolling({ min: 10, max: 100 })
    );
  });
});
```

### App component

This is the entry point app component. To make things more organized, I moved it from the *src/app* folder to the *src/app/components/app* folder.

*src/app/components/app/app.component.html*:

```html
<div class="root">
  <div class="app-content">
    <h1 class="app-header">Angular Fire and Forget Polling</h1>
    <app-random-number></app-random-number>
    <app-min-max-input></app-min-max-input>
  </div>
</div>
```

*src/app/components/app/app.component.scss*:

```scss
.root {
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 0 3rem;

  @media (min-width: 1200px) {
    margin: 0 20rem;
  }

  @media (min-width: 992px) {
    margin: 0 10rem;
  }

  .app-content {
    width: 100%;
  }

  .app-header {
    margin: 1rem 0;
    text-align: center;
  }
}
```

*src/app/components/app/app.component.ts*:

```javascript
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
```

*src/app/components/app/app.component.spec.ts*:

```javascript
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### Registering the components

Don't forget to register all the components in the *app.module*: `declarations: [AppComponent, RandomNumberComponent, MinMaxInputComponent],`

## Conclusion

Now that everything is created you can either run the unit tests using the command: `ng test` or run the app itself using the command: `ng serve`.
