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
