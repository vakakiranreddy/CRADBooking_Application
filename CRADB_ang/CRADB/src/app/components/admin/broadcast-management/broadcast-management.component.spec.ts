import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BroadcastManagementComponent } from './broadcast-management.component';

describe('BroadcastManagementComponent', () => {
  let component: BroadcastManagementComponent;
  let fixture: ComponentFixture<BroadcastManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BroadcastManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BroadcastManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});