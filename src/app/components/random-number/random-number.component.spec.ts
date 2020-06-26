import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RandomNumberComponent } from './random-number.component';
import { provideMockStore } from '@ngrx/store/testing';
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
