import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageReviewsPage } from './manage-reviews.page';

describe('ManageReviewsPage', () => {
  let component: ManageReviewsPage;
  let fixture: ComponentFixture<ManageReviewsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageReviewsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
