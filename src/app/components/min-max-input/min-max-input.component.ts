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
