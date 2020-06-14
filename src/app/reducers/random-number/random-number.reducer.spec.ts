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
