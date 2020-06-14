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
  props<{ error: any }>()
);
