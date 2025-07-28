import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { TestSetup } from '../../../util/testing/test-setup';
import { TEST_IMPORTS } from '../../../util/testing/test-config';
import { SideBarComponent } from '../side-bar/side-bar.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestSetup.configureTestingModule(
      [HeaderComponent, SideBarComponent], // declarations
      TEST_IMPORTS, // imports
      [] // additional providers
    ).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
