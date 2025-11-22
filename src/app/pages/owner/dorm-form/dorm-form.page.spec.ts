import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DormFormPage } from './dorm-form.page';

describe('DormFormPage', () => {
  let component: DormFormPage;
  let fixture: ComponentFixture<DormFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DormFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
