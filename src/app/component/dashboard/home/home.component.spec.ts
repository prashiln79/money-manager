import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { TestSetup } from '../../../util/testing/test-setup';
import { TEST_IMPORTS } from '../../../util/testing/test-config';
import { CalendarViewComponent } from '../calendar-view/calendar-view.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestSetup.configureTestingModule(
      [HomeComponent, CalendarViewComponent], // declarations
      TEST_IMPORTS, // imports
      [] // additional providers
    ).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
