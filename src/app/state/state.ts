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
