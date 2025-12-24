import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditDormPage } from './edit-dorm.page';

describe('EditDormPage', () => {
  let component: EditDormPage;
  let fixture: ComponentFixture<EditDormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
