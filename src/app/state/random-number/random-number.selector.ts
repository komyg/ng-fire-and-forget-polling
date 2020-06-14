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
