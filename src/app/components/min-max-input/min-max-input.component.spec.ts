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
