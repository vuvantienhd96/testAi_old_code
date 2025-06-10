import { TestBed } from '@angular/core/testing';

import { LeadUnitManagementService } from './lead-unit-management.service';

describe('LeadUnitManagementService', () => {
  let service: LeadUnitManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeadUnitManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
