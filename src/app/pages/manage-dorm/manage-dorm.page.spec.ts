import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageDormPage } from './manage-dorm.page';

describe('ManageDormPage', () => {
  let component: ManageDormPage;
  let fixture: ComponentFixture<ManageDormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageDormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
