import { TestBed } from '@angular/core/testing';

import { Dormitory } from './dormitory';

describe('Dormitory', () => {
  let service: Dormitory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Dormitory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
