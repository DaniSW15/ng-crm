import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DealCreate } from './deal-create';

describe('DealCreate', () => {
  let component: DealCreate;
  let fixture: ComponentFixture<DealCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(DealCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
