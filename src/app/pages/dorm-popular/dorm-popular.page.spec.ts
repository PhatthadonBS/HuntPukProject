import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DormPopularPage } from './dorm-popular.page';

describe('DormPopularPage', () => {
  let component: DormPopularPage;
  let fixture: ComponentFixture<DormPopularPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DormPopularPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
