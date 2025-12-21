import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageRequestsDormOwnerPage } from './manage-requests-dorm-owner.page';

describe('ManageRequestsDormOwnerPage', () => {
  let component: ManageRequestsDormOwnerPage;
  let fixture: ComponentFixture<ManageRequestsDormOwnerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageRequestsDormOwnerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
