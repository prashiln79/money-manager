import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileTransactionListComponent } from './mobile-transaction-list.component';

describe('MobileTransactionListComponent', () => {
  let component: MobileTransactionListComponent;
  let fixture: ComponentFixture<MobileTransactionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileTransactionListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MobileTransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 