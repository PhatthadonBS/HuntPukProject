import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DormDetailPage } from './dorm-detail.page';

describe('DormDetailPage', () => {
  let component: DormDetailPage;
  let fixture: ComponentFixture<DormDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DormDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
