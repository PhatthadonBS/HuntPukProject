import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyDormsPage } from './my-dorms.page';

describe('MyDormsPage', () => {
  let component: MyDormsPage;
  let fixture: ComponentFixture<MyDormsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MyDormsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
