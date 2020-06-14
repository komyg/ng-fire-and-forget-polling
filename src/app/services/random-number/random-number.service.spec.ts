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
