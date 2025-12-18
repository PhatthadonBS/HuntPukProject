import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecoverAccountPage } from './recover-account.page';

describe('RecoverAccountPage', () => {
  let component: RecoverAccountPage;
  let fixture: ComponentFixture<RecoverAccountPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RecoverAccountPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
