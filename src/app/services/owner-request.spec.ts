import { TestBed } from '@angular/core/testing';

import { OwnerRequest } from './owner-request';

describe('OwnerRequest', () => {
  let service: OwnerRequest;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OwnerRequest);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
