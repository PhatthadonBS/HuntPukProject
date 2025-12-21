import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageRequestsCreatedormPage } from './manage-requests-createdorm.page';

describe('ManageRequestsCreatedormPage', () => {
  let component: ManageRequestsCreatedormPage;
  let fixture: ComponentFixture<ManageRequestsCreatedormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageRequestsCreatedormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
